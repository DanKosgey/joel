/**
 * src/types/index.ts
 *
 * Canonical TypeScript interfaces for AurumXAU data returned from
 * Server Actions and passed as props to Client Components.
 *
 * These types mirror the Prisma schema but are intentionally leaner
 * (no passwordHash, no internal IDs you don't need, etc.)
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export type Role = 'CLIENT' | 'ADMIN';
export type KycStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type DocumentType = 'PASSPORT' | 'ID_CARD';
export type SignalDirection = 'BUY' | 'SELL';
export type SignalStatus = 'ACTIVE' | 'CLOSED' | 'CANCELLED';

// ─── Domain Types ─────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  kycStatus: KycStatus;
  createdAt: string; // ISO string — Date is not serialisable across Server/Client boundary
}

export interface Mt5Account {
  id: string;
  userId: string;
  brokerName: string;
  accountNumber: string;
  serverName: string;
  isVerified: boolean;
  createdAt: string;
}

export interface KycSubmissionSummary {
  id: string;
  userId: string;
  fullName: string;
  nationality: string;
  documentType: DocumentType;
  submittedAt: string;
  reviewedAt: string | null;
  reviewNotes: string | null;
}

export interface LiveSignal {
  id: string;
  instrument: string;
  direction: SignalDirection;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  status: SignalStatus;
  openedAt: string;
  closedAt: string | null;
}

// ─── Equity Curve (mock until real MT5 data available) ───────────────────────

export interface EquityPoint {
  label: string;  // e.g. "Apr 1"
  value: number;  // USD
}

export interface TradeHistoryItem {
  instrument: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  profit: number;
  closedAt: string; // ISO string
}

// ─── Aggregated payloads returned by Server Actions ──────────────────────────

export interface ClientDashboardData {
  user: UserProfile;
  mt5Accounts: Mt5Account[];
  signals: LiveSignal[];
  equityCurve: EquityPoint[];  // mock until MT5 integration
  balance: number;   // mock until MT5 integration
  equity: number;    // mock until MT5 integration
  history: TradeHistoryItem[];  // mock until MT5 integration
}

export interface AdminDashboardData {
  totalClients: number;
  clients: ClientRow[];
  kycQueue: KycQueueItem[];
  activeSignals: LiveSignal[];
}

// ─── Admin-specific row shapes ────────────────────────────────────────────────

export interface ClientRow {
  id: string;
  name: string;
  email: string;
  kycStatus: KycStatus;
  createdAt: string;
  mt5AccountCount: number;
}

export interface KycQueueItem {
  id: string;           // KycSubmission.id
  userId: string;
  fullName: string;
  nationality: string;
  documentType: DocumentType;
  submittedAt: string;
  documentFrontUrl: string;
  documentBackUrl: string;
  selfieUrl: string;
}

// ─── Trade History (real from DB) ──────────────────────────────────────────

export interface TradeRecord {
  id: string;
  mt5AccountId: string;
  ticket: string;
  instrument: string;
  direction: string;
  lots: number;
  entryPrice: number;
  exitPrice: number | null;
  profit: number;
  commission: number;
  swap: number;
  openedAt: string;
  closedAt: string | null;
  signalId: string | null;
}

// ─── Daily Equity Snapshot ────────────────────────────────────────────────

export interface DailySnapshot {
  date: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  drawdown: number;
}

// ─── Risk Breach ──────────────────────────────────────────────────────────

export type RiskBreachType = 'MAX_DAILY_DRAWDOWN' | 'MAX_TOTAL_DRAWDOWN' | 'UNAUTHORIZED_SYMBOL' | 'MAX_LOTS_EXCEEDED';
export type RiskBreachStatus = 'ACTIVE' | 'RESOLVED' | 'WAIVED';

export interface RiskBreachItem {
  id: string;
  mt5AccountId: string;
  accountNumber: string;
  userName: string;
  type: RiskBreachType;
  description: string;
  breachedValue: number;
  limitValue: number;
  status: RiskBreachStatus;
  detectedAt: string;
  resolvedAt: string | null;
  reviewNotes: string | null;
}

// ─── Signal Execution Log ─────────────────────────────────────────────────

export interface SignalExecution {
  id: string;
  signalId: string;
  mt5AccountId: string;
  status: 'PENDING' | 'EXECUTED' | 'FAILED';
  executionPrice: number | null;
  errorMessage: string | null;
  executedAt: string | null;
}

// ─── Company Growth Snapshot ──────────────────────────────────────────────

export interface GrowthSnapshot {
  date: string;
  totalAum: number;
  activeClients: number;
  totalDeposit: number;
  totalWithdrawal: number;
  netRevenue: number;
  averageClientWinRate: number;
  averageDrawdown: number;
}

// ─── Client Detailed Analytics (for admin inspection) ─────────────────────

export interface ClientDetailedAnalytics {
  user: UserProfile;
  mt5Accounts: Mt5Account[];
  trades: TradeRecord[];
  dailySnapshots: DailySnapshot[];
  riskBreaches: RiskBreachItem[];
  totalProfit: number;
  winRate: number;
  totalTrades: number;
  maxDrawdown: number;
  profitFactor: number;
  sharpeRatio: number;
  currentBalance: number;
  currentEquity: number;
}

// ─── Extended Admin Dashboard Data ────────────────────────────────────────

export interface AdminDashboardDataExtended extends AdminDashboardData {
  totalAum: number;
  totalProfit: number;
  platformWinRate: number;
  platformMaxDrawdown: number;
  activeRiskBreaches: RiskBreachItem[];
  growthSnapshots: GrowthSnapshot[];
  monthlyReturns: { month: string; returnPct: number }[];
  sessionWinRates: { session: string; winRate: number }[];
}
