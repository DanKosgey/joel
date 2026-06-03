"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../lib/StoreContext';
import { drawEquity, drawAUM, drawSessionBar, drawMonthly } from '../lib/charts';
import SignalCard from './SignalCard';
import type { AdminDashboardDataExtended, RiskBreachItem, ClientDetailedAnalytics } from '@/types';
import { 
  getSignedKycUrl, 
  approveKyc, 
  rejectKyc, 
  broadcastSignal, 
  fetchClientDetailedAnalytics, 
  resolveRiskBreach, 
  waiveRiskBreach 
} from '@/app/actions/admin';

export default function AdminView({ initialData }: { initialData: AdminDashboardDataExtended }) {
  const router = useRouter();
  const { ticker, showToast } = useStore();
  const { 
    clients, 
    activeSignals: initialSigs, 
    kycQueue: initialKycQueue, 
    totalClients,
    totalAum,
    totalProfit,
    platformWinRate,
    platformMaxDrawdown,
    activeRiskBreaches: initialBreaches,
    growthSnapshots,
    monthlyReturns,
    sessionWinRates
  } = initialData;

  const [sigs, setSigs] = useState(initialSigs);
  const [kycQueue, setKycQueue] = useState(initialKycQueue);
  const [breaches, setBreaches] = useState(initialBreaches);
  const [inspectedClient, setInspectedClient] = useState<ClientDetailedAnalytics | null>(null);
  const [inspectingId, setInspectingId] = useState<string | null>(null);
  
  const [tab, setTab] = useState('a-overview');
  const [tabLoading, setTabLoading] = useState(false);
  const [mobMenuOpen, setMobMenuOpen] = useState(false);
  const [breachActionNotes, setBreachActionNotes] = useState<Record<string, string>>({});
  
  const handleTab = (id: string) => {
    setTabLoading(true);
    setTab(id);
    setMobMenuOpen(false);
    setTimeout(() => setTabLoading(false), 400);
  };

  const aEquityRef = useRef<HTMLCanvasElement>(null);
  const aSessionRef = useRef<HTMLCanvasElement>(null);
  const aAumRef = useRef<HTMLCanvasElement>(null);
  const aBarRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (tab === 'a-analytics') {
        if (aEquityRef.current) {
          const aumPoints = growthSnapshots.map(g => ({ label: g.date, value: g.totalAum }));
          drawEquity(aEquityRef.current, aumPoints);
        }
        if (aSessionRef.current) {
          drawSessionBar(aSessionRef.current, sessionWinRates);
        }
      } else if (tab === 'a-performance') {
        if (aAumRef.current) {
          const aumPoints = growthSnapshots.map(g => ({ label: g.date, value: g.totalAum }));
          drawAUM(aAumRef.current, aumPoints);
        }
        if (aBarRef.current) {
          drawMonthly(aBarRef.current, monthlyReturns);
        }
      }
    }, 60);
    return () => clearTimeout(t);
  }, [tab, growthSnapshots, sessionWinRates, monthlyReturns]);

  const activeSigs = sigs.filter(s => s.status === 'ACTIVE');
  const priceStr = ticker.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const chgStr = `${ticker.change >= 0 ? '▲ +' : '▼ '}${Math.abs(ticker.change).toFixed(2)} (${Math.abs((ticker.change / 2318.40) * 100).toFixed(2)}%)`;
  const up = ticker.change >= 0;

  const [sigForm, setSigForm] = useState({ pair: 'XAUUSD', dir: 'buy', entry: '', sl: '', tp1: '', tp2: '', lots: '0.10', note: '' });
  const [err, setErr] = useState('');

  const broadcast = async () => {
    const e = parseFloat(sigForm.entry);
    const sl = parseFloat(sigForm.sl);
    const t1 = parseFloat(sigForm.tp1);
    if (!e || !sl || !t1) {
      setErr('Please fill out all required signal parameters.');
      return;
    }
    setErr('');
    
    const res = await broadcastSignal({
      instrument: sigForm.pair,
      direction: sigForm.dir === 'buy' ? 'BUY' : 'SELL',
      entryPrice: e,
      stopLoss: sl,
      takeProfit: t1,
    });

    if (res.success) {
      const newSig: any = {
        id: res.signalId || `NEX-${Math.floor(Math.random()*1000 + 1000)}`,
        instrument: sigForm.pair,
        direction: sigForm.dir === 'buy' ? 'BUY' : 'SELL',
        entryPrice: e,
        stopLoss: sl,
        takeProfit: t1,
        status: 'ACTIVE',
        openedAt: new Date().toISOString(),
        closedAt: null,
      };
      setSigs([newSig, ...sigs]);
      setSigForm({ pair: 'XAUUSD', dir: 'buy', entry: '', sl: '', tp1: '', tp2: '', lots: '0.10', note: '' });
      showToast('Signal successfully sent to all linked accounts.');
    } else {
      setErr(res.error || 'Failed to send signal.');
    }
  };

  const navBtn = (id: string, icon: React.ReactNode, label: string, extra?: React.ReactNode) => (
    <button className={`nav-btn ${tab === id ? 'active' : ''}`} onClick={() => handleTab(id)}>
      {icon} <span>{label}</span> {extra}
    </button>
  );

  const formatCurrency = (val: number) => val.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  
  const formatCompactCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
    return formatCurrency(val);
  };

  const activeBreachesCount = breaches.filter(b => b.status === 'ACTIVE').length;
  const totalProfitPct = totalAum > 0 ? (totalProfit / (totalAum - totalProfit)) * 100 : 0;
  
  const latestGrowth = growthSnapshots[growthSnapshots.length - 1] || {
    activeClients: totalClients,
    totalDeposit: 4800000,
    totalWithdrawal: 800000,
    netRevenue: 180000
  };

  return (
    <div id="view-admin" className="fade-in" style={{ width: '100%' }}>
      {mobMenuOpen && <div className="sidebar-overlay active" onClick={() => setMobMenuOpen(false)} />}
      <div className={`sidebar ${mobMenuOpen ? 'open' : ''}`}>
        <div className="sb-brand">
          <div className="sb-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <path d="M12 2v20M17 5H7M17 19H7M2 12h20" opacity="0.5"/>
              <rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor"/>
              <circle cx="12" cy="12" r="3" fill="#fff"/>
            </svg>
          </div>
          <div className="sb-name">NexusFX<small style={{ color: 'var(--red)' }}>Admin Portal</small></div>
        </div>
        <div className="nav-group">
          <div className="nav-group-label">Place Trading Signal</div>
          {navBtn('a-overview', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>, 'Signals Dashboard')}
          {navBtn('a-signals', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, 'Active Signals')}
        </div>
        <div className="nav-group">
          <div className="nav-group-label">Users & Verification</div>
          {navBtn('a-clients', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>, 'Linked Accounts')}
          {navBtn('a-kyc', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>, 'Verification Queue', kycQueue.length > 0 && <span className="nav-pill">{kycQueue.length}</span>)}
          {navBtn('a-risk', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>, 'Risk Monitoring', activeBreachesCount > 0 && <span className="nav-pill b-err" style={{ backgroundColor: 'var(--red)' }}>{activeBreachesCount}</span>)}
        </div>
        <div className="nav-group">
          <div className="nav-group-label">Performance Analytics</div>
          {navBtn('a-analytics', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 4-4"/></svg>, 'Global Analytics')}
          {navBtn('a-performance', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, 'Assets Growth')}
        </div>
        <div className="sb-user">
          <div className="user-card"><div className="avatar admin">AD</div><div><div className="uname">Admin Mode</div><div className="urole">Administrator</div></div></div>
          <button className="sb-logout" onClick={() => router.push('/')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>Sign Out</button>
        </div>
      </div>

      <div className="main">
        <div className="mob-header">
           <div className="sb-name">NexusFX<small style={{ color: 'var(--red)' }}>Admin</small></div>
           <button className="mob-menu-btn" onClick={() => setMobMenuOpen(!mobMenuOpen)}>☰</button>
        </div>
        <div className="topbar">
          <div className="topbar-title">Admin Command Center</div>
          <div className="topbar-right">
            <div className="gold-live">
              <div className="ticker-dot pulse-dot"></div>
              <span className="gold-live-label">XAU/USD Spot Price</span>
              <span className="gold-live-price">{priceStr}</span>
              <span style={{ color: up ? 'var(--green)' : 'var(--red)' }}>{chgStr}</span>
            </div>
          </div>
        </div>

        <div className="page">{tabLoading ? <div className="tab-loader"><div className="spinner"></div></div> : (
          <div className="fade-in">
            {tab === 'a-overview' && (
              <div>
                <div className="g4">
                  <div className="kcard">
                    <div className="kcard-label">Total Linked AUM</div>
                    <div className="kcard-val">{formatCompactCurrency(totalAum)}</div>
                    <div className="kcard-sub up">
                      {totalProfit >= 0 ? '▲ ' : '▼ '}
                      {totalProfit >= 0 ? '+' : ''}
                      {formatCurrency(totalProfit)} ({totalProfitPct.toFixed(1)}%) net profit
                    </div>
                  </div>
                  <div className="kcard">
                    <div className="kcard-label">Verified Accounts</div>
                    <div className="kcard-val">{totalClients}</div>
                    <div className="kcard-sub">Active client trading accounts</div>
                  </div>
                  <div className="kcard">
                    <div className="kcard-label">Platform Win Rate</div>
                    <div className="kcard-val">{platformWinRate.toFixed(1)}%</div>
                    <div className="kcard-sub">Across closed copy-trades</div>
                  </div>
                  <div className="kcard">
                    <div className="kcard-label">Active Open Positions</div>
                    <div className="kcard-val">{activeSigs.length} Active</div>
                    <div className="kcard-sub">Signals currently active</div>
                  </div>
                </div>
                <div className="g2-7">
                    <div>
                      <div className="sec-hdr" style={{ border: 'none', marginBottom: 12 }}><div className="sec-title">Active Trading Signals</div></div>
                      {activeSigs.length > 0 ? (
                        <div className="sigs-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))' }}>
                          {activeSigs.map(s => <SignalCard key={s.id} s={s} />)}
                        </div>
                      ) : (
                        <div className="chart-box" style={{ textAlign: 'center', padding: '60px 20px', opacity: 0.8 }}>
                          <div style={{ fontSize: 14, color: 'var(--t4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 2 }}>No active signals</div>
                          <button className="btn btn-gold btn-sm" style={{ marginTop: 24, width: 'auto' }} onClick={() => handleTab('a-signals')}>Place New Signal</button>
                        </div>
                      )}
                    </div>
                </div>
              </div>
            )}

            {tab === 'a-signals' && (
              <div className="g2-7">
                <div>
                  <div className="sig-form-container">
                    <div className="sig-form-title">📡 Send Trading Signal</div>
                    <div className="dir-row">
                      <div className={`dir-chip buy ${sigForm.dir === 'buy' ? 'sel' : ''}`} onClick={() => setSigForm({...sigForm, dir: 'buy'})}>Buy (Long)</div>
                      <div className={`dir-chip sell ${sigForm.dir === 'sell' ? 'sel' : ''}`} onClick={() => setSigForm({...sigForm, dir: 'sell'})}>Sell (Short)</div>
                    </div>
                    {err && <div className="alert alert-err" style={{ marginBottom: 24 }}>{err}</div>}
                    <div className="frow" style={{ gap: 24 }}>
                      <div className="fgroup"><label>Entry Price</label><input type="number" value={sigForm.entry} onChange={e => setSigForm({...sigForm, entry: e.target.value})} placeholder="e.g. 2318.40" /></div>
                      <div className="fgroup"><label>Stop Loss</label><input type="number" value={sigForm.sl} onChange={e => setSigForm({...sigForm, sl: e.target.value})} placeholder="e.g. 2305.00" /></div>
                    </div>
                    <div className="frow" style={{ gap: 24 }}>
                      <div className="fgroup"><label>Take Profit 1</label><input type="number" value={sigForm.tp1} onChange={e => setSigForm({...sigForm, tp1: e.target.value})} /></div>
                      <div className="fgroup"><label>Take Profit 2 (Optional)</label><input type="number" value={sigForm.tp2} onChange={e => setSigForm({...sigForm, tp2: e.target.value})} /></div>
                    </div>
                    <div className="fgroup" style={{ marginBottom: 32 }}><label>Signal Description</label><input type="text" value={sigForm.note} onChange={e => setSigForm({...sigForm, note: e.target.value})} placeholder="e.g. Price bouncing off support level" /></div>
                    <button className="btn btn-gold" onClick={broadcast}>📡 Send Signal to Network</button>
                  </div>
                </div>
                <div>
                    <div className="sec-hdr" style={{ border: 'none', marginBottom: 12 }}><div className="sec-title">Active Signals Feed</div></div>
                    {activeSigs.length > 0 ? (
                        <div className="sigs-grid">
                            {activeSigs.map(s => <SignalCard key={s.id} s={s} />)}
                        </div>
                    ) : (
                        <div className="chart-box" style={{ textAlign: 'center', opacity: 0.6 }}>No active signals.</div>
                    )}
                </div>
              </div>
            )}

            {tab === 'a-clients' && (
              <div>
                <div className="sec-hdr"><div className="sec-title">Manage Linked Accounts</div></div>
                <div className="tbl-container" style={{ overflowX: 'auto' }}>
                  <table style={{ minWidth: 700 }}>
                    <thead><tr><th>Name</th><th>Email Address</th><th>Linked Accounts</th><th>Verification Status</th><th>Created On</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
                    <tbody>
                      {clients.map((c, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 800 }}>{c.name}</td>
                          <td className="mono" style={{ color: 'var(--brand)' }}>{c.email}</td>
                          <td className="mono">{c.mt5AccountCount} account(s)</td>
                          <td>
                            <span className={`badge ${c.kycStatus === 'APPROVED' ? 'b-ok' : c.kycStatus === 'REJECTED' ? 'b-err' : 'b-warn'}`}>
                              {c.kycStatus === 'APPROVED' ? 'Verified' : c.kycStatus}
                            </span>
                          </td>
                          <td style={{ color: 'var(--t4)' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              className="btn-ghost" 
                              style={{ padding: '6px 12px', fontSize: 11, borderRadius: 8, width: 'auto' }} 
                              onClick={async () => {
                                setInspectingId(c.id);
                                try {
                                  const details = await fetchClientDetailedAnalytics(c.id);
                                  setInspectedClient(details);
                                } catch (err: any) {
                                  showToast(err.message || 'Failed to inspect account.');
                                } finally {
                                  setInspectingId(null);
                                }
                              }}
                            >
                              {inspectingId === c.id ? 'Auditing...' : 'Inspect Account'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === 'a-kyc' && (
               <div>
                  <div className="sec-hdr"><div className="sec-title">Identity Verification Queue</div></div>
                  <div className="g2-7">
                    <div>
                      {kycQueue.map((k) => (
                        <div key={k.id} className="chart-box" style={{ marginBottom: 24 }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                              <div style={{ fontSize: 20, fontWeight: 800 }}>{k.fullName}</div>
                              <span className="badge b-warn">REVIEW REQUIRED</span>
                           </div>
                           <div className="review-line"><span style={{ fontWeight: 800, color: 'var(--t4)' }}>Nationality:</span> {k.nationality}</div>
                           <div className="review-line" style={{ marginBottom: 24 }}><span style={{ fontWeight: 800, color: 'var(--t4)' }}>Document Type:</span> {k.documentType}</div>
                           
                           <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
                              <button className="btn-ghost" style={{ flex: 1, fontSize: 12 }} onClick={async () => {
                                const res = await getSignedKycUrl(k.documentFrontUrl);
                                if (res.success) window.open(res.url, '_blank');
                              }}>View ID Front</button>
                              <button className="btn-ghost" style={{ flex: 1, fontSize: 12 }} onClick={async () => {
                                const res = await getSignedKycUrl(k.documentBackUrl);
                                if (res.success) window.open(res.url, '_blank');
                              }}>View ID Back</button>
                           </div>

                           <div style={{ display: 'flex', gap: 16 }}>
                              <button className="btn btn-gold" style={{ flex: 1 }} onClick={async () => {
                                const res = await approveKyc(k.id, k.userId);
                                if (res.success) {
                                  setKycQueue(prev => prev.filter(q => q.id !== k.id));
                                  showToast('Account successfully verified.');
                                }
                              }}>Verify User</button>
                              <button className="btn-ghost" style={{ flex: 0.5, borderColor: 'var(--red)', color: 'var(--red)' }} onClick={() => showToast('Flagged for review.')}>Flag Account</button>
                           </div>
                        </div>
                      ))}
                      {kycQueue.length === 0 && <div className="chart-box" style={{ textAlign: 'center', opacity: 0.6 }}>Verification queue is empty.</div>}
                    </div>
                  </div>
               </div>
            )}

            {tab === 'a-risk' && (
              <div>
                <div className="sec-hdr"><div className="sec-title">Risk Management Audits & Drawdowns</div></div>
                <div className="tbl-container" style={{ overflowX: 'auto' }}>
                  <table style={{ minWidth: 800 }}>
                    <thead>
                      <tr>
                        <th>Client / Account</th>
                        <th>Breach Type</th>
                        <th>Value / Limit</th>
                        <th>Status</th>
                        <th>Detected At</th>
                        <th style={{ width: '250px' }}>Resolution Notes</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breaches.map((b) => (
                        <tr key={b.id} style={{ opacity: b.status !== 'ACTIVE' ? 0.6 : 1 }}>
                          <td>
                            <div style={{ fontWeight: 800 }}>{b.userName}</div>
                            <div className="mono" style={{ fontSize: 11, color: 'var(--brand)' }}>ACC: {b.accountNumber}</div>
                          </td>
                          <td>
                            <span className="mono" style={{ fontWeight: 800 }}>{b.type.replace(/_/g, ' ')}</span>
                            <div style={{ fontSize: 11, color: 'var(--t4)', maxWidth: 200, whiteSpace: 'normal', marginTop: 4 }}>{b.description}</div>
                          </td>
                          <td className="mono">
                            <span style={{ color: 'var(--red)', fontWeight: 800 }}>{b.breachedValue.toFixed(2)}{b.type.includes('DRAWDOWN') ? '%' : ''}</span>
                            <span style={{ color: 'var(--t4)' }}> / {b.limitValue.toFixed(2)}{b.type.includes('DRAWDOWN') ? '%' : ''}</span>
                          </td>
                          <td>
                            <span className={`badge ${b.status === 'ACTIVE' ? 'b-err' : b.status === 'RESOLVED' ? 'b-ok' : 'b-warn'}`}>
                              {b.status}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--t4)' }}>
                            {new Date(b.detectedAt).toLocaleString()}
                          </td>
                          <td>
                            {b.status === 'ACTIVE' ? (
                              <input
                                type="text"
                                placeholder="Enter resolution notes..."
                                value={breachActionNotes[b.id] || ''}
                                onChange={(e) => setBreachActionNotes({ ...breachActionNotes, [b.id]: e.target.value })}
                                style={{
                                  width: '100%',
                                  background: 'rgba(255,255,255,0.05)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  borderRadius: '6px',
                                  color: '#fff',
                                  fontSize: '12px',
                                  padding: '6px 10px'
                                }}
                              />
                            ) : (
                              <div style={{ fontSize: 12, color: 'var(--t4)', fontStyle: 'italic', whiteSpace: 'normal', maxWidth: 220 }}>
                                {b.reviewNotes || 'No notes logged.'}
                                {b.resolvedAt && <div style={{ fontSize: 10, marginTop: 4 }}>Audit cleared: {new Date(b.resolvedAt).toLocaleDateString()}</div>}
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {b.status === 'ACTIVE' ? (
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <button
                                  className="btn btn-gold btn-sm"
                                  style={{ padding: '6px 12px', fontSize: 11, width: 'auto' }}
                                  onClick={async () => {
                                    const notes = breachActionNotes[b.id] || 'Resolved by Administrator';
                                    const res = await resolveRiskBreach(b.id, notes);
                                    if (res.success) {
                                      setBreaches(prev => prev.map(item => item.id === b.id ? { ...item, status: 'RESOLVED', reviewNotes: notes, resolvedAt: new Date().toISOString() } : item));
                                      showToast('Breach resolved successfully.');
                                    } else {
                                      showToast('Failed to resolve breach.');
                                    }
                                  }}
                                >
                                  Resolve
                                </button>
                                <button
                                  className="btn-ghost btn-sm"
                                  style={{ padding: '6px 12px', fontSize: 11, borderColor: 'var(--brand)', color: 'var(--brand)', width: 'auto' }}
                                  onClick={async () => {
                                    const notes = breachActionNotes[b.id] || 'Waived by Administrator';
                                    const res = await waiveRiskBreach(b.id, notes);
                                    if (res.success) {
                                      setBreaches(prev => prev.map(item => item.id === b.id ? { ...item, status: 'WAIVED', reviewNotes: notes, resolvedAt: new Date().toISOString() } : item));
                                      showToast('Breach waived successfully.');
                                    } else {
                                      showToast('Failed to waive breach.');
                                    }
                                  }}
                                >
                                  Waive
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: 12, color: 'var(--t4)' }}>Audited</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {breaches.length === 0 && (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', opacity: 0.6, padding: '40px 0' }}>No risk breaches recorded.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {tab === 'a-analytics' && (
              <div>
                <div className="g4" style={{ marginBottom: 24 }}>
                  <div className="kcard">
                    <div className="kcard-label">Platform Max Drawdown</div>
                    <div className="kcard-val" style={{ color: 'var(--red)' }}>{platformMaxDrawdown.toFixed(1)}%</div>
                    <div className="kcard-sub">Worst client trailing drawdown</div>
                  </div>
                  <div className="kcard">
                    <div className="kcard-label">Average Platform Win Rate</div>
                    <div className="kcard-val">{platformWinRate.toFixed(1)}%</div>
                    <div className="kcard-sub">Across all client closed trades</div>
                  </div>
                  <div className="kcard">
                    <div className="kcard-label">Total Trade Profit</div>
                    <div className="kcard-val" style={{ color: 'var(--green)' }}>{formatCompactCurrency(totalProfit)}</div>
                    <div className="kcard-sub">Net realized platform wins</div>
                  </div>
                </div>
                <div className="g2">
                  <div className="chart-box">
                    <div className="chart-title">Account Growth Performance (Total AUM Curve)</div>
                    <canvas ref={aEquityRef} height="200" style={{ width: '100%' }}></canvas>
                  </div>
                  <div className="chart-box">
                    <div className="chart-title">Trade Distribution by Session Win Rate</div>
                    <canvas ref={aSessionRef} height="200" style={{ width: '100%' }}></canvas>
                  </div>
                </div>
              </div>
            )}

            {tab === 'a-performance' && (
              <div>
                <div className="g4" style={{ marginBottom: 24 }}>
                  <div className="kcard">
                    <div className="kcard-label">Active Clients</div>
                    <div className="kcard-val">{latestGrowth.activeClients}</div>
                    <div className="kcard-sub">Linked verified accounts</div>
                  </div>
                  <div className="kcard">
                    <div className="kcard-label">Total Deposits</div>
                    <div className="kcard-val">{formatCurrency(latestGrowth.totalDeposit)}</div>
                    <div className="kcard-sub">Inflow through system</div>
                  </div>
                  <div className="kcard">
                    <div className="kcard-label">Total Withdrawals</div>
                    <div className="kcard-val">{formatCurrency(latestGrowth.totalWithdrawal)}</div>
                    <div className="kcard-sub">Outflow to clients</div>
                  </div>
                  <div className="kcard">
                    <div className="kcard-label">Net Commission Revenue</div>
                    <div className="kcard-val" style={{ color: 'var(--brand)' }}>{formatCurrency(latestGrowth.netRevenue)}</div>
                    <div className="kcard-sub">Platform performance fees</div>
                  </div>
                </div>
                <div className="g2">
                   <div className="chart-box">
                     <div className="chart-title">Linked Accounts Balance Growth (Total AUM)</div>
                     <canvas ref={aAumRef} height="200" style={{ width: '100%' }}></canvas>
                   </div>
                   <div className="chart-box">
                     <div className="chart-title">Trading Momentum and Return Index (Monthly %)</div>
                     <canvas ref={aBarRef} height="200" style={{ width: '100%' }}></canvas>
                   </div>
                </div>
              </div>
            )}
          </div>
        )}</div>
      </div>

      {/* Client Inspection Modal */}
      {inspectedClient && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{
            background: 'var(--card, rgba(20, 20, 20, 0.85))',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--r, 12px)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '30px',
            color: '#fff',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '16px', marginBottom: '24px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '22px', fontWeight: 800 }}>Account Audit: {inspectedClient.user.name}</h3>
                <span style={{ fontSize: '12px', color: 'var(--t4)' }}>{inspectedClient.user.email}</span>
              </div>
              <button
                className="btn-ghost"
                style={{ padding: '6px 12px', fontSize: '12px', width: 'auto' }}
                onClick={() => setInspectedClient(null)}
              >
                Close Audit
              </button>
            </div>

            {/* Metrics Row */}
            <div className="g4" style={{ marginBottom: '28px' }}>
              <div className="kcard" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
                <div className="kcard-label" style={{ fontSize: '11px' }}>Net Profit</div>
                <div className="kcard-val" style={{ fontSize: '18px', color: inspectedClient.totalProfit >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {inspectedClient.totalProfit >= 0 ? '+' : ''}{inspectedClient.totalProfit.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </div>
              </div>
              <div className="kcard" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
                <div className="kcard-label" style={{ fontSize: '11px' }}>Win Rate</div>
                <div className="kcard-val" style={{ fontSize: '18px' }}>{inspectedClient.winRate.toFixed(1)}%</div>
                <div className="kcard-sub" style={{ fontSize: '10px' }}>{inspectedClient.totalTrades} closed trades</div>
              </div>
              <div className="kcard" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
                <div className="kcard-label" style={{ fontSize: '11px' }}>Max Drawdown</div>
                <div className="kcard-val" style={{ fontSize: '18px', color: 'var(--red)' }}>{inspectedClient.maxDrawdown.toFixed(1)}%</div>
              </div>
              <div className="kcard" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
                <div className="kcard-label" style={{ fontSize: '11px' }}>Profit Factor</div>
                <div className="kcard-val" style={{ fontSize: '18px' }}>{inspectedClient.profitFactor.toFixed(2)}</div>
                <div className="kcard-sub" style={{ fontSize: '10px' }}>Sharpe: {inspectedClient.sharpeRatio.toFixed(2)}</div>
              </div>
            </div>

            {/* Account Info */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '28px', flexWrap: 'wrap' }}>
              {inspectedClient.mt5Accounts.map((acc) => (
                <div key={acc.id} className="chart-box" style={{ flex: 1, minWidth: '240px', padding: '16px', margin: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '10px' }}>MT5 Account: {acc.accountNumber}</div>
                  <div style={{ fontSize: '12px', color: 'var(--t4)', marginBottom: '4px' }}>Broker: {acc.brokerName} ({acc.serverName})</div>
                  <div style={{ fontSize: '12px', color: 'var(--t4)', marginBottom: '8px' }}>Verification status: {acc.isVerified ? 'Verified' : 'Pending'}</div>
                  <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--t4)', display: 'block' }}>Balance</span>
                      <span className="mono" style={{ fontSize: '14px', fontWeight: 800 }}>{inspectedClient.currentBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', color: 'var(--t4)', display: 'block' }}>Equity</span>
                      <span className="mono" style={{ fontSize: '14px', fontWeight: 800, color: 'var(--brand)' }}>{inspectedClient.currentEquity.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Trades Table */}
            <div style={{ marginBottom: '28px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--brand)' }}>Recent Executed Trades</h4>
              <div className="tbl-container" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                <table style={{ minWidth: '100%', fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>Ticket</th>
                      <th>Instrument</th>
                      <th>Type</th>
                      <th>Lots</th>
                      <th>Entry Price</th>
                      <th>Exit Price</th>
                      <th style={{ textAlign: 'right' }}>Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspectedClient.trades.slice(0, 10).map((t) => (
                      <tr key={t.id}>
                        <td className="mono">{t.ticket}</td>
                        <td>{t.instrument}</td>
                        <td>
                          <span style={{ color: t.direction === 'BUY' ? 'var(--green)' : 'var(--red)', fontWeight: 800 }}>
                            {t.direction}
                          </span>
                        </td>
                        <td>{t.lots.toFixed(2)}</td>
                        <td>{t.entryPrice.toFixed(2)}</td>
                        <td>{t.exitPrice?.toFixed(2) ?? '-'}</td>
                        <td style={{ textAlign: 'right', color: t.profit >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 800 }} className="mono">
                          {t.profit >= 0 ? '+' : ''}{t.profit.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </td>
                      </tr>
                    ))}
                    {inspectedClient.trades.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', opacity: 0.6 }}>No trades executed yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Risk Breaches History */}
            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--red)' }}>Risk Breaches & Alerts</h4>
              <div className="tbl-container">
                <table style={{ minWidth: '100%', fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Detected At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspectedClient.riskBreaches.map((b) => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: 800 }}>{b.type.replace(/_/g, ' ')}</td>
                        <td style={{ whiteSpace: 'normal', maxWidth: '300px' }}>{b.description}</td>
                        <td>
                          <span className={`badge ${b.status === 'ACTIVE' ? 'b-err' : b.status === 'RESOLVED' ? 'b-ok' : 'b-warn'}`}>
                            {b.status}
                          </span>
                        </td>
                        <td style={{ color: 'var(--t4)' }}>{new Date(b.detectedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {inspectedClient.riskBreaches.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', opacity: 0.6 }}>No risk breaches detected.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
