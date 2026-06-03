import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function main() {
  console.log('🌱 Starting database seed clean-up...');

  // Delete in correct order to handle foreign keys
  await prisma.signalExecutionLog.deleteMany({});
  await prisma.riskBreach.deleteMany({});
  await prisma.dailyEquitySnapshot.deleteMany({});
  await prisma.trade.deleteMany({});
  await prisma.kycSubmission.deleteMany({});
  await prisma.mt5Account.deleteMany({});
  await prisma.signal.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.companyGrowthSnapshot.deleteMany({});

  console.log('✅ Database cleaned. Seeding new data...\n');

  // ─── Create Users ─────────────────────────────────────────────────────────
  const adminEmail = 'admin@g.com';
  const adminPasswordHash = await bcrypt.hash('admin', SALT_ROUNDS);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      name: 'AurumXAU Admin',
      role: 'ADMIN',
      kycStatus: 'APPROVED',
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // Client 1 (Fully Verified, active trader)
  const client1Email = 'client1@g.com';
  const client1Hash = await bcrypt.hash('client1', SALT_ROUNDS);
  const client1 = await prisma.user.create({
    data: {
      email: client1Email,
      passwordHash: client1Hash,
      name: 'Client One',
      role: 'CLIENT',
      kycStatus: 'APPROVED',
      kycSubmission: {
        create: {
          fullName: 'Client One Senior',
          dateOfBirth: new Date('1990-01-01'),
          nationality: 'United Kingdom',
          documentType: 'PASSPORT',
          documentFrontUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
          documentBackUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
          selfieUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
          reviewedAt: new Date(),
          reviewNotes: 'Verified automatically by system integration',
        }
      }
    },
  });
  console.log(`✅ Client 1 created: ${client1.email}`);

  // Client 2 (Verified, has breach history)
  const client2Email = 'client2@g.com';
  const client2Hash = await bcrypt.hash('client2', SALT_ROUNDS);
  const client2 = await prisma.user.create({
    data: {
      email: client2Email,
      passwordHash: client2Hash,
      name: 'Client Two',
      role: 'CLIENT',
      kycStatus: 'APPROVED',
      kycSubmission: {
        create: {
          fullName: 'Client Two Junior',
          dateOfBirth: new Date('1992-05-15'),
          nationality: 'Germany',
          documentType: 'ID_CARD',
          documentFrontUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
          documentBackUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
          selfieUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
          reviewedAt: new Date(),
          reviewNotes: 'Documents look correct',
        }
      }
    },
  });
  console.log(`✅ Client 2 created: ${client2.email}`);

  // Client 3 (Pending KYC, unverified account)
  const client3Email = 'client3@g.com';
  const client3Hash = await bcrypt.hash('client3', SALT_ROUNDS);
  const client3 = await prisma.user.create({
    data: {
      email: client3Email,
      passwordHash: client3Hash,
      name: 'Client Three',
      role: 'CLIENT',
      kycStatus: 'PENDING',
      kycSubmission: {
        create: {
          fullName: 'Client Three Intern',
          dateOfBirth: new Date('1995-10-10'),
          nationality: 'France',
          documentType: 'PASSPORT',
          documentFrontUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
          documentBackUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
          selfieUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
        }
      }
    },
  });
  console.log(`✅ Client 3 created: ${client3.email}`);

  // ─── Create MT5 Accounts ──────────────────────────────────────────────────
  const mt5Acc1 = await prisma.mt5Account.create({
    data: {
      userId: client1.id,
      brokerName: 'Exness',
      accountNumber: '12345678',
      serverName: 'Exness-MT5Real3',
      isVerified: true,
    },
  });

  const mt5Acc2 = await prisma.mt5Account.create({
    data: {
      userId: client2.id,
      brokerName: 'Exness',
      accountNumber: '87654321',
      serverName: 'Exness-MT5Real4',
      isVerified: true,
    },
  });

  const mt5Acc3 = await prisma.mt5Account.create({
    data: {
      userId: client3.id,
      brokerName: 'XM Global',
      accountNumber: '56781234',
      serverName: 'XM-MT5Real2',
      isVerified: false, // not verified yet
    },
  });

  console.log('✅ MT5 Accounts created');

  // ─── Create Signals ───────────────────────────────────────────────────────
  const activeSignal1 = await prisma.signal.create({
    data: {
      adminId: admin.id,
      instrument: 'XAUUSD',
      direction: 'BUY',
      entryPrice: 2318.40,
      stopLoss: 2305.00,
      takeProfit: 2345.00,
      status: 'ACTIVE',
      openedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4h ago
    },
  });

  const activeSignal2 = await prisma.signal.create({
    data: {
      adminId: admin.id,
      instrument: 'XAUUSD',
      direction: 'SELL',
      entryPrice: 2329.50,
      stopLoss: 2338.00,
      takeProfit: 2310.00,
      status: 'ACTIVE',
      openedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1h ago
    },
  });

  const closedSignal1 = await prisma.signal.create({
    data: {
      adminId: admin.id,
      instrument: 'XAUUSD',
      direction: 'BUY',
      entryPrice: 2290.00,
      stopLoss: 2275.00,
      takeProfit: 2320.00,
      status: 'CLOSED',
      openedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      closedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
    },
  });

  console.log('✅ Signals created');

  // ─── Create Trade Records (approx 40 trades) ──────────────────────────────
  const tradeData: any[] = [];
  
  // Trade template generation helper
  const addTrade = (
    mt5AccountId: string,
    ticket: string,
    direction: 'BUY' | 'SELL',
    lots: number,
    entryPrice: number,
    exitPrice: number,
    profit: number,
    hoursAgo: number,
    durationHours: number,
    signalId: string | null = null
  ) => {
    const openedAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    const closedAt = new Date(openedAt.getTime() + durationHours * 60 * 60 * 1000);
    tradeData.push({
      mt5AccountId,
      ticket,
      instrument: 'XAUUSD',
      direction,
      lots,
      entryPrice,
      exitPrice,
      profit,
      commission: -4.0 * lots,
      swap: 0.5 * lots,
      openedAt,
      closedAt,
      signalId,
    });
  };

  // Account 1: 22 trades (consistent gains)
  // Let's generate a progression
  addTrade(mt5Acc1.id, '100001', 'BUY', 2.0, 2285.50, 2295.80, 2060.00, 720, 3);
  addTrade(mt5Acc1.id, '100002', 'SELL', 2.0, 2298.00, 2292.00, 1200.00, 690, 2);
  addTrade(mt5Acc1.id, '100003', 'BUY', 2.5, 2290.00, 2286.00, -1000.00, 660, 4);
  addTrade(mt5Acc1.id, '100004', 'BUY', 2.0, 2288.00, 2302.00, 2800.00, 620, 6);
  addTrade(mt5Acc1.id, '100005', 'SELL', 3.0, 2305.00, 2309.50, -1350.00, 590, 1);
  addTrade(mt5Acc1.id, '100006', 'BUY', 2.5, 2302.00, 2315.00, 3250.00, 560, 5);
  addTrade(mt5Acc1.id, '100007', 'BUY', 3.0, 2310.00, 2322.00, 3600.00, 500, 4);
  addTrade(mt5Acc1.id, '100008', 'SELL', 3.0, 2325.00, 2321.00, 1200.00, 460, 2);
  addTrade(mt5Acc1.id, '100009', 'BUY', 3.5, 2320.00, 2314.00, -2100.00, 420, 3);
  addTrade(mt5Acc1.id, '100010', 'BUY', 4.0, 2315.00, 2330.00, 6000.00, 380, 8);
  addTrade(mt5Acc1.id, '100011', 'SELL', 3.0, 2335.00, 2330.50, 1350.00, 350, 2);
  addTrade(mt5Acc1.id, '100012', 'BUY', 4.0, 2328.00, 2324.00, -1600.00, 310, 4);
  addTrade(mt5Acc1.id, '100013', 'BUY', 4.0, 2325.00, 2341.00, 6400.00, 280, 6);
  addTrade(mt5Acc1.id, '100014', 'SELL', 4.5, 2345.00, 2349.00, -1800.00, 240, 2);
  addTrade(mt5Acc1.id, '100015', 'BUY', 4.0, 2340.00, 2355.00, 6000.00, 210, 5);
  addTrade(mt5Acc1.id, '100016', 'SELL', 4.0, 2360.00, 2352.00, 3200.00, 170, 3);
  addTrade(mt5Acc1.id, '100017', 'BUY', 5.0, 2350.00, 2345.00, -2500.00, 140, 4);
  addTrade(mt5Acc1.id, '100018', 'BUY', 5.0, 2346.00, 2358.00, 6000.00, 100, 6);
  addTrade(mt5Acc1.id, '100019', 'SELL', 5.0, 2360.00, 2354.00, 3000.00, 70, 2);
  addTrade(mt5Acc1.id, '100020', 'BUY', 5.0, 2352.00, 2365.00, 6500.00, 40, 5);
  // Link to closedSignal1
  addTrade(mt5Acc1.id, '100021', 'BUY', 4.0, 2290.00, 2320.00, 12000.00, 24, 6, closedSignal1.id);
  // Open trade (active)
  tradeData.push({
    mt5AccountId: mt5Acc1.id,
    ticket: '100022',
    instrument: 'XAUUSD',
    direction: 'BUY',
    lots: 4.0,
    entryPrice: 2318.40,
    exitPrice: null,
    profit: 520.00, // floating profit
    commission: -16.0,
    swap: 0.0,
    openedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    closedAt: null,
    signalId: activeSignal1.id,
  });

  // Account 2: 14 trades (struggles early, then wins)
  addTrade(mt5Acc2.id, '200001', 'BUY', 1.0, 2280.00, 2286.00, 600.00, 700, 4);
  addTrade(mt5Acc2.id, '200002', 'BUY', 1.5, 2285.00, 2272.00, -1950.00, 650, 3); // -3.9% loss
  addTrade(mt5Acc2.id, '200003', 'BUY', 2.0, 2275.00, 2262.00, -2600.00, 600, 2); // -5.2% drawdown breach!
  addTrade(mt5Acc2.id, '200004', 'SELL', 1.0, 2270.00, 2278.00, -800.00, 550, 1);
  addTrade(mt5Acc2.id, '200005', 'BUY', 1.5, 2275.00, 2290.00, 2250.00, 500, 8);
  addTrade(mt5Acc2.id, '200006', 'SELL', 1.5, 2295.00, 2288.00, 1050.00, 450, 3);
  addTrade(mt5Acc2.id, '200007', 'BUY', 1.5, 2290.00, 2305.00, 2250.00, 400, 5);
  addTrade(mt5Acc2.id, '200008', 'BUY', 2.0, 2300.00, 2292.00, -1600.00, 350, 4);
  addTrade(mt5Acc2.id, '200009', 'SELL', 2.0, 2315.00, 2308.00, 1400.00, 300, 2);
  addTrade(mt5Acc2.id, '200010', 'BUY', 2.0, 2308.00, 2320.00, 2400.00, 250, 6);
  addTrade(mt5Acc2.id, '200011', 'BUY', 2.5, 2318.00, 2312.00, -1500.00, 200, 3);
  addTrade(mt5Acc2.id, '200012', 'BUY', 2.0, 2312.00, 2328.00, 3200.00, 150, 4);
  addTrade(mt5Acc2.id, '200013', 'SELL', 2.5, 2335.00, 2325.00, 2500.00, 100, 3);
  addTrade(mt5Acc2.id, '200014', 'BUY', 2.5, 2328.00, 2342.00, 3500.00, 50, 5);

  // Account 3: 5 trades (no breaches, low activity)
  addTrade(mt5Acc3.id, '300001', 'BUY', 0.5, 2280.00, 2288.00, 400.00, 500, 4);
  addTrade(mt5Acc3.id, '300002', 'SELL', 0.5, 2295.00, 2290.00, 250.00, 400, 2);
  addTrade(mt5Acc3.id, '300003', 'BUY', 0.5, 2290.00, 2284.00, -300.00, 300, 3);
  addTrade(mt5Acc3.id, '300004', 'BUY', 0.8, 2310.00, 2325.00, 1200.00, 200, 5);
  addTrade(mt5Acc3.id, '300005', 'SELL', 0.8, 2330.00, 2322.00, 640.00, 100, 2);

  // Bulk create trades
  for (const t of tradeData) {
    await prisma.trade.create({ data: t });
  }

  console.log(`✅ ${tradeData.length} Trades created`);

  // ─── Create Daily Snapshots (30 days x 3 accounts = 90 snapshots) ─────────
  const snapshotData: any[] = [];
  
  // Starting amounts
  const startBalances = [100000, 50000, 10000];
  const accIds = [mt5Acc1.id, mt5Acc2.id, mt5Acc3.id];
  
  // Generate snapshots day-by-day
  for (let accIdx = 0; accIdx < 3; accIdx++) {
    const accId = accIds[accIdx];
    let balance = startBalances[accIdx];
    let peakEquity = balance;

    for (let day = 30; day >= 1; day--) {
      const snapDate = new Date();
      snapDate.setDate(snapDate.getDate() - day);
      
      // Add some random trade outcome simulation
      // Account 1 progresses positively, Account 2 dips then climbs, Account 3 climbs slowly
      let dayChangePct = 0;
      if (accIdx === 0) {
        // Client 1: 0.2% to 1.8% positive, with 4 drawdown days
        if (day === 24 || day === 18 || day === 12 || day === 6) {
          dayChangePct = -0.015; // -1.5%
        } else {
          dayChangePct = 0.008 + (Math.sin(day) * 0.005); // steady gain
        }
      } else if (accIdx === 1) {
        // Client 2: dips early on day 26-24
        if (day === 27 || day === 26 || day === 25) {
          dayChangePct = -0.038; // big consecutive drops
        } else {
          dayChangePct = 0.011 + (Math.cos(day) * 0.006);
        }
      } else {
        // Client 3: slow steady gains
        dayChangePct = 0.004 + (Math.sin(day * 2) * 0.002);
      }

      balance = balance * (1 + dayChangePct);
      const equity = balance + (Math.random() * 800 - 400); // floating equity noise
      
      if (equity > peakEquity) peakEquity = equity;
      const drawdown = peakEquity > 0 ? ((peakEquity - equity) / peakEquity) * 100 : 0;

      snapshotData.push({
        mt5AccountId: accId,
        date: snapDate,
        balance: Math.round(balance * 100) / 100,
        equity: Math.round(equity * 100) / 100,
        margin: Math.round((balance * 0.1) * 100) / 100,
        freeMargin: Math.round((balance * 0.9) * 100) / 100,
        drawdown: Math.max(0, Math.round(drawdown * 100) / 100),
      });
    }
  }

  // Create snapshots in batches
  for (const s of snapshotData) {
    await prisma.dailyEquitySnapshot.create({ data: s });
  }

  console.log(`✅ ${snapshotData.length} DailyEquitySnapshot records created`);

  // ─── Create Risk Breaches (5 records: 2 ACTIVE, 2 RESOLVED, 1 WAIVED) ─────
  await prisma.riskBreach.create({
    data: {
      mt5AccountId: mt5Acc2.id,
      type: 'MAX_DAILY_DRAWDOWN',
      description: 'Account equity dropped by 5.2% in a single trading session, exceeding the 5.0% maximum daily risk parameter.',
      breachedValue: 5.2,
      limitValue: 5.0,
      status: 'RESOLVED',
      detectedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
      resolvedAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
      reviewNotes: 'Client contacted, risk parameters reviewed. Leverages were temporarily locked then reset. Account restored.',
    }
  });

  await prisma.riskBreach.create({
    data: {
      mt5AccountId: mt5Acc2.id,
      type: 'UNAUTHORIZED_SYMBOL',
      description: 'Attempted to open a trade on BTCUSD. AurumXAU program is restricted exclusively to Gold (XAUUSD) trading.',
      breachedValue: 1.0,
      limitValue: 0.0,
      status: 'RESOLVED',
      detectedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000),
      reviewNotes: 'System auto-closed position. Warned user via dashboard banner. Resolved after user acknowledged compliance rules.',
    }
  });

  await prisma.riskBreach.create({
    data: {
      mt5AccountId: mt5Acc1.id,
      type: 'MAX_LOTS_EXCEEDED',
      description: 'Position size of 8.5 lots exceeded the hard verification account cap of 5.0 lots.',
      breachedValue: 8.5,
      limitValue: 5.0,
      status: 'WAIVED',
      detectedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
      reviewNotes: 'Admin approved waiver as client is managing high-net-worth partner sub-accounts and margin safety factor is > 800%.',
    }
  });

  // Active Breaches
  await prisma.riskBreach.create({
    data: {
      mt5AccountId: mt5Acc2.id,
      type: 'MAX_TOTAL_DRAWDOWN',
      description: 'Cumulative account drawdown reached 11.4%, violating the 10.0% hard program trailing cap.',
      breachedValue: 11.4,
      limitValue: 10.0,
      status: 'ACTIVE',
      detectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    }
  });

  await prisma.riskBreach.create({
    data: {
      mt5AccountId: mt5Acc3.id,
      type: 'UNAUTHORIZED_SYMBOL',
      description: 'Trade execution logged on USDJPY which is unauthorized under the strict Gold-only trading mandate.',
      breachedValue: 1.0,
      limitValue: 0.0,
      status: 'ACTIVE',
      detectedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12h ago
    }
  });

  console.log('✅ 5 RiskBreach records created (2 ACTIVE, 2 RESOLVED, 1 WAIVED)');

  // ─── Create Signal Execution Logs (6 logs) ───────────────────────────────
  await prisma.signalExecutionLog.create({
    data: {
      signalId: activeSignal1.id,
      mt5AccountId: mt5Acc1.id,
      status: 'EXECUTED',
      executionPrice: 2318.42,
      executedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    }
  });

  await prisma.signalExecutionLog.create({
    data: {
      signalId: activeSignal1.id,
      mt5AccountId: mt5Acc2.id,
      status: 'EXECUTED',
      executionPrice: 2318.45,
      executedAt: new Date(Date.now() - 3.8 * 60 * 60 * 1000),
    }
  });

  await prisma.signalExecutionLog.create({
    data: {
      signalId: activeSignal1.id,
      mt5AccountId: mt5Acc3.id,
      status: 'FAILED',
      errorMessage: 'Account verification pending. Copy-trading inactive.',
      executedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    }
  });

  await prisma.signalExecutionLog.create({
    data: {
      signalId: activeSignal2.id,
      mt5AccountId: mt5Acc1.id,
      status: 'EXECUTED',
      executionPrice: 2329.48,
      executedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    }
  });

  await prisma.signalExecutionLog.create({
    data: {
      signalId: activeSignal2.id,
      mt5AccountId: mt5Acc2.id,
      status: 'FAILED',
      errorMessage: 'Account suspended due to active total drawdown risk breach.',
      executedAt: new Date(Date.now() - 0.9 * 60 * 60 * 1000),
    }
  });

  await prisma.signalExecutionLog.create({
    data: {
      signalId: closedSignal1.id,
      mt5AccountId: mt5Acc1.id,
      status: 'EXECUTED',
      executionPrice: 2290.05,
      executedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    }
  });

  console.log('✅ 6 SignalExecutionLog records created');

  // ─── Create Company Growth Snapshots (30 daily records) ───────────────────
  const growthSnapshots: any[] = [];
  
  let currentAum = 1250000; // Start at 1.25M
  let clientsCount = 24;
  let depositAcc = 1450000;
  let withdrawalAcc = 200000;
  let revenueAcc = 45000;

  for (let i = 30; i >= 1; i--) {
    const snapDate = new Date();
    snapDate.setDate(snapDate.getDate() - i);

    // Linear AUM growth with some daily fluctuation
    currentAum += 101000 + (Math.sin(i) * 35000);
    // Dynamic increases
    clientsCount += (i % 3 === 0) ? 2 : (i % 7 === 0) ? 1 : 0;
    depositAcc += 112000 + (Math.cos(i) * 20000);
    withdrawalAcc += 11000 + (Math.sin(i * 2) * 5000);
    revenueAcc += 4600 + (Math.abs(Math.sin(i)) * 1200);

    growthSnapshots.push({
      date: snapDate,
      totalAum: Math.round(currentAum * 100) / 100,
      activeClients: clientsCount,
      totalDeposit: Math.round(depositAcc * 100) / 100,
      totalWithdrawal: Math.round(withdrawalAcc * 100) / 100,
      netRevenue: Math.round(revenueAcc * 100) / 100,
      averageClientWinRate: 64.2 + (Math.sin(i) * 2.5),
      averageDrawdown: 3.2 + (Math.cos(i) * 0.8),
    });
  }

  // Force the final day snapshot to match the target ($4.28M, 85 clients, etc.)
  const lastSnapDate = new Date();
  lastSnapDate.setDate(lastSnapDate.getDate() - 1);
  growthSnapshots[growthSnapshots.length - 1] = {
    date: lastSnapDate,
    totalAum: 4280000.00,
    activeClients: 85,
    totalDeposit: 4800000.00,
    totalWithdrawal: 800000.00,
    netRevenue: 180000.00,
    averageClientWinRate: 66.8,
    averageDrawdown: 3.4
  };

  for (const g of growthSnapshots) {
    await prisma.companyGrowthSnapshot.create({ data: g });
  }

  console.log(`✅ ${growthSnapshots.length} CompanyGrowthSnapshot records created`);

  console.log('\n🎉 Seed complete. AurumXAU is ready for production metrics.\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
