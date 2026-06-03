/**
 * src/lib/data.ts
 *
 * ⚠️ This file contains ONLY data needed for chart rendering and UI demo.
 *
 * What was removed (now comes from the database via Server Actions):
 *  - INITIAL_USER        → fetched in /client/page.tsx via fetchClientDashboardData()
 *  - INITIAL_CLIENTS     → fetched in /admin/page.tsx via fetchAdminDashboardData()
 *  - INITIAL_KYC_QUEUE   → fetched in /admin/page.tsx via fetchAdminDashboardData()
 *  - INITIAL_REPORTS     → will come from a reports table (future)
 *  - INITIAL_NOTIFICATIONS → will come from a notifications table (future)
 *
 * What remains:
 *  - Chart drawing constants (used by charts.ts)
 *  - Signal UI shape for the canvas-rendered signal cards (not the DB Signal model)
 */

// ─── Signal shape used by chart components and SignalCard UI ──────────────────
// This is NOT the Prisma Signal model — it's the UI representation used
// by the canvas chart renderer and SignalCard component.

export interface UISignal {
  id: string;
  pair: string;
  dir: 'buy' | 'sell';
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  lots: number;
  time: string;
  pct: number;
  closed?: boolean;
  note: string;
}

// ─── Demo signals (shown when DB returns empty results) ───────────────────────

export const DEMO_SIGNALS: UISignal[] = [
  {
    id: 'AXC-441', pair: 'XAUUSD', dir: 'buy',
    entry: 2318.40, sl: 2305.00, tp1: 2325.00, tp2: 2340.00,
    lots: 0.10, time: '09:14', pct: 62,
    note: 'H4 bullish engulfing + demand zone confluence',
  },
  {
    id: 'AXC-442', pair: 'XAUUSD', dir: 'sell',
    entry: 2298.20, sl: 2312.00, tp1: 2285.00, tp2: 2268.00,
    lots: 0.15, time: '09:31', pct: 48,
    note: 'D1 supply zone rejection — bearish momentum',
  },
];

// ─── Demo trade history (shown on ClientView History tab) ─────────────────────

export const DEMO_TRADES: (string | number)[][] = [
  ['#1044','BUY',2318.40,2334.80,2305.00,2325.00,2340.00,0.10,+164,+328,'Closed','Apr 4'],
  ['#1043','SELL',2298.20,2281.50,2312.00,2285.00,2268.00,0.15,-167,+251,'Closed','Apr 3'],
  ['#1042','BUY',2310.60,2305.10,2296.00,2322.00,2338.00,0.10,-55,-110,'Closed','Apr 2'],
  ['#1041','BUY',2302.80,2322.00,2288.00,2313.00,2328.00,0.20,+192,+384,'Closed','Apr 1'],
  ['#1040','SELL',2315.40,2298.60,2329.00,2302.00,2284.00,0.10,-168,+168,'Closed','Mar 31'],
  ['#1039','BUY',2290.20,2276.80,2278.00,2302.00,2318.00,0.15,-134,-201,'Closed','Mar 30'],
  ['#1038','BUY',2278.50,2294.30,2264.00,2289.00,2304.00,0.10,+158,+316,'Closed','Mar 28'],
  ['#1037','SELL',2305.60,2289.40,2319.00,2291.00,2272.00,0.10,-162,+162,'Closed','Mar 27'],
];
