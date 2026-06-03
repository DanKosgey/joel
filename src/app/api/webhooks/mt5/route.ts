import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate Request
    const authHeader = req.headers.get('Authorization');
    const secret = process.env.MT5_WEBHOOK_SECRET;

    if (!secret) {
      console.error('MT5_WEBHOOK_SECRET environment variable is not configured.');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== secret) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    // 2. Parse Body
    const body = await req.json();
    const { event, accountNumber } = body;

    if (!event || !accountNumber) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Find the corresponding MT5 account
    const account = await prisma.mt5Account.findFirst({
      where: { accountNumber: String(accountNumber) },
    });

    if (!account) {
      return NextResponse.json({ error: `MT5 Account ${accountNumber} not found` }, { status: 404 });
    }

    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    // 3. Process Events
    switch (event) {
      case 'TRADE_OPENED': {
        const { ticket, instrument, direction, lots, entryPrice, openedAt } = body;
        if (!ticket || !instrument || !direction || !lots || !entryPrice || !openedAt) {
          return NextResponse.json({ error: 'Missing trade parameters' }, { status: 400 });
        }

        const trade = await prisma.trade.upsert({
          where: { ticket: String(ticket) },
          update: {
            instrument,
            direction,
            lots: Number(lots),
            entryPrice: Number(entryPrice),
            openedAt: new Date(openedAt),
          },
          create: {
            mt5AccountId: account.id,
            ticket: String(ticket),
            instrument,
            direction,
            lots: Number(lots),
            entryPrice: Number(entryPrice),
            openedAt: new Date(openedAt),
            profit: 0.0,
          },
        });

        return NextResponse.json({ success: true, tradeId: trade.id });
      }

      case 'TRADE_CLOSED': {
        const { ticket, instrument, direction, lots, entryPrice, exitPrice, profit, commission, swap, openedAt, closedAt, signalId } = body;
        if (!ticket || !instrument || !direction || !lots || !entryPrice || exitPrice === undefined || profit === undefined || !openedAt || !closedAt) {
          return NextResponse.json({ error: 'Missing trade closure parameters' }, { status: 400 });
        }

        // Upsert trade
        const trade = await prisma.trade.upsert({
          where: { ticket: String(ticket) },
          update: {
            exitPrice: Number(exitPrice),
            profit: Number(profit),
            commission: commission ? Number(commission) : 0.0,
            swap: swap ? Number(swap) : 0.0,
            closedAt: new Date(closedAt),
            signalId: signalId || null,
          },
          create: {
            mt5AccountId: account.id,
            ticket: String(ticket),
            instrument,
            direction,
            lots: Number(lots),
            entryPrice: Number(entryPrice),
            exitPrice: Number(exitPrice),
            profit: Number(profit),
            commission: commission ? Number(commission) : 0.0,
            swap: swap ? Number(swap) : 0.0,
            openedAt: new Date(openedAt),
            closedAt: new Date(closedAt),
            signalId: signalId || null,
          },
        });

        // Check for MAX_DAILY_DRAWDOWN breach (5% limit of starting balance)
        const latestDailySnapshot = await prisma.dailyEquitySnapshot.findFirst({
          where: {
            mt5AccountId: account.id,
            date: { lt: startOfToday },
          },
          orderBy: { date: 'desc' },
        });

        // Use previous day balance or fall back to today's snapshot balance, or $100,000 baseline
        let startingBalance = latestDailySnapshot?.balance;
        if (!startingBalance) {
          const todaySnapshot = await prisma.dailyEquitySnapshot.findUnique({
            where: {
              mt5AccountId_date: {
                mt5AccountId: account.id,
                date: startOfToday,
              },
            },
          });
          startingBalance = todaySnapshot?.balance ?? 100000;
        }

        // Sum up negative trade profits realized today
        const todayTrades = await prisma.trade.findMany({
          where: {
            mt5AccountId: account.id,
            closedAt: { gte: startOfToday },
          },
        });
        const todayLoss = todayTrades.reduce((sum, t) => t.profit < 0 ? sum + Math.abs(t.profit) : sum, 0);

        const limitValue = startingBalance * 0.05;
        if (todayLoss > limitValue) {
          const existingBreach = await prisma.riskBreach.findFirst({
            where: {
              mt5AccountId: account.id,
              type: 'MAX_DAILY_DRAWDOWN',
              status: 'ACTIVE',
              detectedAt: { gte: startOfToday },
            },
          });

          if (!existingBreach) {
            await prisma.riskBreach.create({
              data: {
                mt5AccountId: account.id,
                type: 'MAX_DAILY_DRAWDOWN',
                description: `Realized daily loss of $${todayLoss.toFixed(2)} exceeded the 5.0% limit of $${limitValue.toFixed(2)} (Starting Balance: $${startingBalance.toFixed(2)}).`,
                breachedValue: Number(((todayLoss / startingBalance) * 100).toFixed(2)),
                limitValue: 5.0,
                status: 'ACTIVE',
              },
            });
          }
        }

        return NextResponse.json({ success: true, tradeId: trade.id });
      }

      case 'BALANCE_UPDATE': {
        const { balance, equity, margin, freeMargin } = body;
        if (balance === undefined || equity === undefined) {
          return NextResponse.json({ error: 'Missing balance/equity updates' }, { status: 400 });
        }

        // Calculate drawdown dynamically using historical peaks
        const allSnapshots = await prisma.dailyEquitySnapshot.findMany({
          where: { mt5AccountId: account.id },
          orderBy: { date: 'desc' },
        });

        const historicalPeakEquity = allSnapshots.reduce((max, s) => s.equity > max ? s.equity : max, 0);
        const peakEquity = Math.max(historicalPeakEquity, Number(equity));
        const drawdown = peakEquity > 0 ? ((peakEquity - Number(equity)) / peakEquity) * 100 : 0.0;

        // Upsert Daily snapshot for today
        const snapshot = await prisma.dailyEquitySnapshot.upsert({
          where: {
            mt5AccountId_date: {
              mt5AccountId: account.id,
              date: startOfToday,
            },
          },
          update: {
            balance: Number(balance),
            equity: Number(equity),
            margin: margin ? Number(margin) : 0.0,
            freeMargin: freeMargin ? Number(freeMargin) : 0.0,
            drawdown: Number(drawdown.toFixed(2)),
          },
          create: {
            mt5AccountId: account.id,
            date: startOfToday,
            balance: Number(balance),
            equity: Number(equity),
            margin: margin ? Number(margin) : 0.0,
            freeMargin: freeMargin ? Number(freeMargin) : 0.0,
            drawdown: Number(drawdown.toFixed(2)),
          },
        });

        // Also check for MAX_TOTAL_DRAWDOWN breach (10% total drawdown limit)
        if (drawdown > 10.0) {
          const existingBreach = await prisma.riskBreach.findFirst({
            where: {
              mt5AccountId: account.id,
              type: 'MAX_TOTAL_DRAWDOWN',
              status: 'ACTIVE',
            },
          });

          if (!existingBreach) {
            await prisma.riskBreach.create({
              data: {
                mt5AccountId: account.id,
                type: 'MAX_TOTAL_DRAWDOWN',
                description: `Trailing drawdown reached ${drawdown.toFixed(2)}%, violating the 10.0% account protection limit.`,
                breachedValue: Number(drawdown.toFixed(2)),
                limitValue: 10.0,
                status: 'ACTIVE',
              },
            });
          }
        }

        return NextResponse.json({ success: true, snapshotId: snapshot.id });
      }

      default:
        return NextResponse.json({ error: `Unhandled event type: ${event}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('MT5 Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
