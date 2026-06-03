"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../lib/StoreContext';
import { drawEquity, drawAUM, drawSessionBar, drawBar } from '../lib/charts';
import SignalCard from './SignalCard';
import type { AdminDashboardData } from '@/types';
import { getSignedKycUrl, approveKyc, rejectKyc, broadcastSignal } from '@/app/actions/admin';

export default function AdminView({ initialData }: { initialData: AdminDashboardData }) {
  const router = useRouter();
  const { ticker, showToast } = useStore();
  const { clients, activeSignals: initialSigs, kycQueue: initialKycQueue, totalClients } = initialData;
  const [sigs, setSigs] = useState(initialSigs);
  const [kycQueue, setKycQueue] = useState(initialKycQueue);
  const [tab, setTab] = useState('a-overview');
  const [tabLoading, setTabLoading] = useState(false);
  const [mobMenuOpen, setMobMenuOpen] = useState(false);
  
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
        if (aEquityRef.current) drawEquity(aEquityRef.current, 0, 4280000);
        if (aSessionRef.current) drawSessionBar(aSessionRef.current);
      } else if (tab === 'a-performance') {
        if (aAumRef.current) drawAUM(aAumRef.current);
        if (aBarRef.current) drawBar(aBarRef.current);
      }
    }, 60);
    return () => clearTimeout(t);
  }, [tab]);

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
    const t2 = parseFloat(sigForm.tp2);
    if (!e || !sl || !t1 || !t2) {
      setErr('Please fill out all signal parameters.');
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
          <div className="topbar-title">Admin Dashboard</div>
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
                    <div className="kcard-label">Total Linked Balance</div>
                    <div className="kcard-val">$4.28M</div>
                    <div className="kcard-sub up">▲ +$320,000 (8.1%) total profit</div>
                  </div>
                  <div className="kcard">
                    <div className="kcard-label">Verified Accounts</div>
                    <div className="kcard-val">{totalClients}</div>
                    <div className="kcard-sub">Verified user trading accounts</div>
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
                    <thead><tr><th>Name</th><th>Email Address</th><th>Status</th><th>Balance</th><th>Verification Status</th><th>Created On</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
                    <tbody>
                      {clients.map((c, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 800 }}>{c.name}</td>
                          <td className="mono" style={{ color: 'var(--brand)' }}>{c.email}</td>
                          <td className="mono">Linked</td>
                          <td className="mono" style={{ color: 'var(--green)', fontWeight: 800 }}>$24,000.00</td>
                          <td><span className="badge b-ok">{c.kycStatus === 'APPROVED' ? 'Verified' : c.kycStatus}</span></td>
                          <td style={{ color: 'var(--t4)' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn-ghost" style={{ padding: '6px 12px', fontSize: 11, borderRadius: 8 }} onClick={() => showToast(`Opening details for ${c.name}...`)}>Inspect Account</button>
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
            
            {tab === 'a-analytics' && (
              <div className="g2">
                <div className="chart-box">
                  <div className="chart-title">Account Growth Performance</div>
                  <canvas ref={aEquityRef} height="200" style={{ width: '100%' }}></canvas>
                </div>
                <div className="chart-box">
                  <div className="chart-title">Trade Distribution by Session</div>
                  <canvas ref={aSessionRef} height="200" style={{ width: '100%' }}></canvas>
                </div>
              </div>
            )}

            {tab === 'a-performance' && (
                <div className="g2">
                   <div className="chart-box">
                     <div className="chart-title">Linked Accounts Balance Growth (Total AUM)</div>
                     <canvas ref={aAumRef} height="200" style={{ width: '100%' }}></canvas>
                   </div>
                   <div className="chart-box">
                     <div className="chart-title">Trading Momentum and Return Index</div>
                     <canvas ref={aBarRef} height="200" style={{ width: '100%' }}></canvas>
                   </div>
                </div>
            )}
          </div>
        )}</div>
      </div>
    </div>
  );
}
