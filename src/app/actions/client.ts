'use server';

import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';
import type {
  ClientDashboardData,
  EquityPoint,
  LiveSignal,
  Mt5Account,
  TradeHistoryItem,
  UserProfile,
} from '@/types';
import { KycStatus, Role, DocumentType } from '@prisma/client';

// ─── Mock equity curve (fallback if no snapshot history exists yet) ────────────

function generateMockEquityCurve(seedBalance: number): EquityPoint[] {
  const labels = ['Mar 1','Mar 8','Mar 15','Mar 22','Mar 29','Apr 1','Apr 4'];
  let current = seedBalance * 0.8;
  return labels.map((label) => {
    current += (Math.random() - 0.35) * seedBalance * 0.02;
    return { label, value: Math.round(current) };
  });
}

// ─── Main Server Action ───────────────────────────────────────────────────────

/**
 * Fetches all data required to render the Client Portal dashboard.
 * Called from the /client Server Component after session is verified.
 */
export async function fetchClientDashboardData(
  userId: string,
): Promise<ClientDashboardData> {
  // Single query — pull user + related accounts in one round-trip
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id:        true,
      name:      true,
      email:     true,
      role:      true,
      kycStatus: true,
      createdAt: true,
      mt5Accounts: {
        select: {
          id:            true,
          userId:        true,
          brokerName:    true,
          accountNumber: true,
          serverName:    true,
          isVerified:    true,
          createdAt:     true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!dbUser) {
    throw new Error(`User not found: ${userId}`);
  }

  // Recent ACTIVE + CLOSED signals (platform-wide, shown to all clients)
  const dbSignals = await prisma.signal.findMany({
    where: {
      status: { in: ['ACTIVE', 'CLOSED'] },
    },
    select: {
      id:          true,
      instrument:  true,
      direction:   true,
      entryPrice:  true,
      stopLoss:    true,
      takeProfit:  true,
      status:      true,
      openedAt:    true,
      closedAt:    true,
    },
    orderBy: { openedAt: 'desc' },
    take: 20,
  });

  // ── Serialise (Date → ISO string) ─────────────────────────────────────────

  const user: UserProfile = {
    id:        dbUser.id,
    name:      dbUser.name,
    email:     dbUser.email,
    role:      dbUser.role as UserProfile['role'],
    kycStatus: dbUser.kycStatus as UserProfile['kycStatus'],
    createdAt: dbUser.createdAt.toISOString(),
  };

  const mt5Accounts: Mt5Account[] = dbUser.mt5Accounts.map((a: any) => ({
    id:            a.id,
    userId:        a.userId,
    brokerName:    a.brokerName,
    accountNumber: a.accountNumber,
    serverName:    a.serverName,
    isVerified:    a.isVerified,
    createdAt:     a.createdAt.toISOString(),
  }));

  const signals: LiveSignal[] = dbSignals.map((s: any) => ({
    id:          s.id,
    instrument:  s.instrument,
    direction:   s.direction as LiveSignal['direction'],
    entryPrice:  s.entryPrice,
    stopLoss:    s.stopLoss,
    takeProfit:  s.takeProfit,
    status:      s.status as LiveSignal['status'],
    openedAt:    s.openedAt.toISOString(),
    closedAt:    s.closedAt?.toISOString() ?? null,
  }));

  // ─── Query Live Trade Data ────────────────────────────────────────────────
  const verifiedAccounts = dbUser.mt5Accounts.filter(a => a.isVerified);
  const accountIds = verifiedAccounts.map(a => a.id);

  // Fetch real trade history from database
  const dbTrades = await prisma.trade.findMany({
    where: {
      mt5AccountId: { in: accountIds },
      closedAt: { not: null }
    },
    orderBy: { closedAt: 'desc' },
    take: 30
  });

  const history: TradeHistoryItem[] = dbTrades.map(t => ({
    instrument: t.instrument,
    direction: t.direction as any,
    entryPrice: t.entryPrice,
    exitPrice: t.exitPrice ?? 0,
    profit: t.profit,
    closedAt: t.closedAt ? t.closedAt.toISOString() : new Date().toISOString()
  }));

  // Fetch real daily equity snapshots
  const dbSnapshots = await prisma.dailyEquitySnapshot.findMany({
    where: {
      mt5AccountId: { in: accountIds }
    },
    orderBy: { date: 'asc' },
    take: 30
  });

  let equityCurve = dbSnapshots.map(s => ({
    label: s.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: s.equity
  }));

  // Sum of balance and equity across verified accounts
  let balance = 0;
  let equity = 0;

  for (const acc of verifiedAccounts) {
    const latestSnapshot = await prisma.dailyEquitySnapshot.findFirst({
      where: { mt5AccountId: acc.id },
      orderBy: { date: 'desc' }
    });
    if (latestSnapshot) {
      balance += latestSnapshot.balance;
      equity += latestSnapshot.equity;
    } else {
      balance += 100000;
      equity += 100000;
    }
  }

  // Fallback defaults if there are no verified accounts linked yet
  if (verifiedAccounts.length === 0) {
    balance = 0;
    equity = 0;
  }

  if (equityCurve.length === 0 && verifiedAccounts.length > 0) {
    equityCurve = generateMockEquityCurve(balance || 100000);
  }

  return { user, mt5Accounts, signals, equityCurve, balance, equity, history };
}

/**
 * Handles KYC form submission:
 * 1. Uploads files to Supabase Storage bucket 'kyc-documents'
 * 2. Creates a KycSubmission record in Prisma
 * 3. Updates the User's kycStatus to SUBMITTED
 */
export async function submitKycSubmission(formData: FormData, userId: string) {
  try {
    const fullName     = formData.get('fullName') as string;
    const dob          = formData.get('dob') as string;
    const nationality  = formData.get('nationality') as string;
    const docType      = formData.get('documentType') as DocumentType;

    const idFront      = formData.get('idFront') as File | null;
    const idBack       = formData.get('idBack') as File | null;
    const selfie       = formData.get('selfie') as File | null;
    const proofAddress = formData.get('proofAddress') as File | null;

    if (!userId || !fullName || !idFront || !selfie) {
      console.error('KYC Server Action Missing Data:', { userId, fullName, idFrontExists: !!idFront, selfieExists: !!selfie });
      throw new Error('Missing required identity fields');
    }

    // ─── Upload Files to Supabase Storage ───────────────────────────────────────
    
    const uploadFile = async (file: File | null, folder: string) => {
      if (!file || !file.name) return '';
      
      const fileName = `${userId}/${folder}-${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      const buffer   = Buffer.from(await file.arrayBuffer());
      
      const { data, error } = await supabaseAdmin.storage
        .from('kyc-documents')
        .upload(fileName, buffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.error(`Supabase Upload Error [${folder}]:`, error);
        throw new Error(`Failed to upload ${folder}: ${error.message}`);
      }
      
      return data.path;
    };
 
    const [frontPath, backPath, selfiePath, proofPath] = await Promise.all([
      uploadFile(idFront, 'id-front'),
      uploadFile(idBack, 'id-back'),
      uploadFile(selfie, 'selfie'),
      uploadFile(proofAddress, 'proof-address'),
    ]);

    // ─── Save to Database ───────────────────────────────────────────────────────

    await prisma.$transaction([
      prisma.kycSubmission.create({
        data: {
          userId,
          fullName,
          dateOfBirth:      new Date(dob),
          nationality,
          documentType:     docType,
          documentFrontUrl: frontPath,
          documentBackUrl:  backPath,
          selfieUrl:        selfiePath,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { kycStatus: 'SUBMITTED' },
      }),
    ]);

    revalidatePath('/client');
    revalidatePath('/admin');
    
    return { success: true };
  } catch (error: any) {
    console.error('KYC Submission Error:', error);
    return { success: false, error: error.message };
  }
}
