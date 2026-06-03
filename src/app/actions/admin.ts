'use server';

import { prisma } from '@/lib/prisma';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';
import { getServerAuthSession } from '@/lib/auth';
import type {
  AdminDashboardData,
  ClientRow,
  KycQueueItem,
  LiveSignal,
} from '@/types';

/**
 * Fetches all data required to render the Admin Command Center.
 * Called from the /admin Server Component after session + ADMIN role is verified.
 */
export async function fetchAdminDashboardData(): Promise<AdminDashboardData> {
  // Run all three queries in parallel for maximum speed
  const [clientUsers, kycSubmissions, activeSignals] = await Promise.all([
    // All CLIENT users with their MT5 account counts
    prisma.user.findMany({
      where: { role: 'CLIENT' },
      select: {
        id:        true,
        name:      true,
        email:     true,
        kycStatus: true,
        createdAt: true,
        _count: {
          select: { mt5Accounts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),

    // KYC submissions currently SUBMITTED (awaiting admin review)
    prisma.kycSubmission.findMany({
      where: {
        user: { kycStatus: 'SUBMITTED' },
      },
      select: {
        id:               true,
        userId:           true,
        fullName:         true,
        nationality:      true,
        documentType:     true,
        documentFrontUrl: true,
        documentBackUrl:  true,
        selfieUrl:        true,
        submittedAt:      true,
      },
      orderBy: { submittedAt: 'asc' }, // oldest first so nothing sits too long
    }),

    // Currently active trading signals
    prisma.signal.findMany({
      where: { status: 'ACTIVE' },
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
    }),
  ]);

  // ── Serialise ─────────────────────────────────────────────────────────────

  const clients: ClientRow[] = clientUsers.map((u: any) => ({
    id:              u.id,
    name:            u.name,
    email:           u.email,
    kycStatus:       u.kycStatus as ClientRow['kycStatus'],
    createdAt:       u.createdAt.toISOString(),
    mt5AccountCount: u._count.mt5Accounts,
  }));

  const kycQueue: KycQueueItem[] = kycSubmissions.map((k) => ({
    id:           k.id,
    userId:       k.userId,
    fullName:     k.fullName,
    nationality:  k.nationality,
    documentType: k.documentType as KycQueueItem['documentType'],
    submittedAt:  k.submittedAt.toISOString(),
    documentFrontUrl: k.documentFrontUrl,
    documentBackUrl:  k.documentBackUrl,
    selfieUrl:        k.selfieUrl,
  }));

  const signals: LiveSignal[] = activeSignals.map((s: any) => ({
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

  return {
    totalClients: clientUsers.length,
    clients,
    kycQueue,
    activeSignals: signals,
  };
}

/**
 * Generates a signed URL for a KYC document path.
 * This is used to display sensitive images securely in the Admin Portal.
 */
export async function getSignedKycUrl(path: string) {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from('kyc-documents')
      .createSignedUrl(path, 3600); // 1 hour validity

    if (error) throw error;
    return { success: true, url: data.signedUrl };
  } catch (error: any) {
    console.error('Signed URL Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Approves a KYC submission and updates the user's status.
 */
export async function approveKyc(submissionId: string, userId: string) {
  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { kycStatus: 'APPROVED' },
      }),
      prisma.kycSubmission.update({
        where: { id: submissionId },
        data: { reviewedAt: new Date() },
      }),
    ]);
    
    revalidatePath('/admin');
    revalidatePath('/client');
    return { success: true };
  } catch (error: any) {
    console.error('Approve KYC Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Rejects a KYC submission.
 */
export async function rejectKyc(submissionId: string, userId: string, reason: string) {
  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { kycStatus: 'REJECTED' },
      }),
      prisma.kycSubmission.update({
        where: { id: submissionId },
        data: { reviewedAt: new Date(), reviewNotes: reason },
      }),
    ]);
    
    revalidatePath('/admin');
    revalidatePath('/client');
    return { success: true };
  } catch (error: any) {
    console.error('Reject KYC Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Broadcasts an institutional signal to the database and dispatches it to the MT5 bridge webhook.
 */
export async function broadcastSignal(data: {
  instrument: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
}) {
  try {
    const session = await getServerAuthSession();
    if (!session || session.user.role !== 'ADMIN') {
      throw new Error('Unauthorized access to administrative command pipeline.');
    }

    const signal = await prisma.signal.create({
      data: {
        adminId: session.user.id,
        instrument: data.instrument,
        direction: data.direction,
        entryPrice: data.entryPrice,
        stopLoss: data.stopLoss,
        takeProfit: data.takeProfit,
        status: 'ACTIVE',
      },
    });

    const webhookUrl = process.env.MT5_WEBHOOK_URL;
    const webhookSecret = process.env.MT5_WEBHOOK_SECRET;

    if (webhookUrl && webhookUrl !== 'https://your-mt5-bridge.example.com/webhook') {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${webhookSecret}`,
          },
          body: JSON.stringify({
            event: 'SIGNAL_BROADCAST',
            signal: {
              id: signal.id,
              instrument: signal.instrument,
              direction: signal.direction,
              entryPrice: signal.entryPrice,
              stopLoss: signal.stopLoss,
              takeProfit: signal.takeProfit,
            },
          }),
        });
      } catch (err) {
        console.error('MT5 Webhook dispatch failed:', err);
      }
    }

    revalidatePath('/admin');
    revalidatePath('/client');

    return { success: true, signalId: signal.id };
  } catch (error: any) {
    console.error('Broadcast Signal Error:', error);
    return { success: false, error: error.message };
  }
}

