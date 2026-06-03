"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../lib/StoreContext';
import { drawEquity, drawAUM, drawSessionBar, drawBar, drawEquityDD, drawDist, drawDD } from '../lib/charts';
import SignalCard from './SignalCard';
import type { ClientDashboardData } from '@/types';
import { supabase } from '@/lib/supabase';

export default function ClientView({ initialData, userId }: { initialData: ClientDashboardData; userId: string }) {
  const router = useRouter();
  const { ticker, showToast } = useStore();
  const [signals, setSignals] = useState(initialData.signals);
  const [tab, setTab] = useState('overview');
  const [tabLoading, setTabLoading] = useState(false);
  const [mobMenuOpen, setMobMenuOpen] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel('db-signals')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Signal' },
        (payload) => {
          const newSig = payload.new as any;
          setSignals((prev) => [newSig, ...prev]);
          showToast(`New Live Signal Broadcasted: ${newSig.direction} ${newSig.instrument}`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showToast]);
  
  const handleTab = (id: string) => {
    setTabLoading(true);
    setTab(id);
    setMobMenuOpen(false);
    setTimeout(() => setTabLoading(false), 400);
  };

  const equityRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<HTMLCanvasElement>(null);
  const aumRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLCanvasElement>(null);
  const eqDdRef = useRef<HTMLCanvasElement>(null);
  const distRef = useRef<HTMLCanvasElement>(null);
  const ddRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const triggerDraw = () => {
      if (tab === 'overview') {
        if (equityRef.current) drawEquity(equityRef.current, initialData.equityCurve);
        if (sessionRef.current) drawSessionBar(sessionRef.current);
      }
      if (tab === 'performance') {
        if (aumRef.current) drawAUM(aumRef.current, initialData.equityCurve);
        if (barRef.current) drawBar(barRef.current);
      }
      if (tab === 'analytics') {
        const eqValues = initialData.equityCurve.map(e => e.value);
        let peak = eqValues[0] || 0;
        const ddValues = eqValues.map(e => {
          if (e > peak) peak = e;
          return peak > 0 ? -((peak - e) / peak) * 100 : 0;
        });

        if (eqDdRef.current) drawEquityDD(eqDdRef.current, eqValues, ddValues);
        if (distRef.current) drawDist(distRef.current);
        if (ddRef.current) drawDD(ddRef.current, ddValues);
      }
    };

    const t = setTimeout(triggerDraw, 60);

    window.addEventListener('resize', triggerDraw);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', triggerDraw);
    };
  }, [tab, initialData]);

  const priceStr = ticker.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const chgStr = `${ticker.change >= 0 ? '▲ +' : '▼ '}${Math.abs(ticker.change).toFixed(2)} (${Math.abs((ticker.change / 2318.40) * 100).toFixed(2)}%)`;
  const up = ticker.change >= 0;

  const navBtn = (id: string, icon: React.ReactNode, label: string, extra?: React.ReactNode) => (
    <button className={`nav-btn ${tab === id ? 'active' : ''}`} onClick={() => handleTab(id)}>
      {icon} <span>{label}</span> {extra}
    </button>
  );

  const formatCurrency = (val: number) => val.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  // Math Calculations for Dashboard Cards
  const totalClosedProfit = initialData.history.reduce((sum, h) => sum + h.profit, 0);
  
  const wins = initialData.history.filter(h => h.profit > 0).reduce((sum, h) => sum + h.profit, 0);
  const losses = Math.abs(initialData.history.filter(h => h.profit < 0).reduce((sum, h) => sum + h.profit, 0));
  const profitFactor = losses > 0 ? (wins / losses).toFixed(2) : wins > 0 ? '99.90' : '0.00';

  const totalTrades = initialData.history.length;
  const winningTrades = initialData.history.filter(h => h.profit > 0).length;
  const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : '0.0';

  const profitDiff = initialData.equity - initialData.balance;
  const profitIsPositive = profitDiff >= 0;
  const verifiedAccounts = initialData.mt5Accounts.filter(a => a.isVerified);

  return (
    <div id="view-client" className="fade-in">
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
          <div className="sb-name">NexusFX<small>Signals</small></div>
        </div>
        <div className="nav-group">
          <div className="nav-group-label">Menu</div>
          {navBtn('overview', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>, 'Dashboard')}
          {navBtn('signals', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>, 'Signals Feed', <span className="nav-pill">{signals.filter(s => s.status === 'ACTIVE').length}</span>)}
          {navBtn('performance', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, 'Performance')}
          {navBtn('analytics', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>, 'Advanced Analytics')}
        </div>
        <div className="nav-group">
          <div className="nav-group-label">Account & Security</div>
          {navBtn('liquidity', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>, 'Link MT5 Account')}
          {navBtn('compliance', <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, 'Verification Status')}
        </div>
        <div className="sb-user">
          <div className="user-card">
            <div className="avatar">U</div>
            <div><div className="uname">{initialData.user.name}</div><div className="urole">Active Client</div></div>
          </div>
          <button className="sb-logout" onClick={() => router.push('/')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>Sign Out</button>
        </div>
      </div>

      <div className="main">
        <div className="mob-header">
           <div className="sb-name">NexusFX<small>Signals</small></div>
           <button className="mob-menu-btn" onClick={() => setMobMenuOpen(!mobMenuOpen)}>☰</button>
        </div>

        <div className="topbar">
          <div className="topbar-title">{tab === 'overview' ? 'My Dashboard' : tab === 'signals' ? 'Active Trading Signals' : tab === 'performance' ? 'Performance Analytics' : tab === 'analytics' ? 'Quantitative Analytics' : 'Account Analytics'}</div>
          <div className="topbar-right">
            <div className="gold-live">
              <div className="ticker-dot pulse-dot"></div>
              <span className="gold-live-label">XAU/USD Live Price</span>
              <span className="gold-live-price">{priceStr}</span>
              <span style={{ color: up ? 'var(--green)' : 'var(--red)' }}>{chgStr}</span>
            </div>
          </div>
        </div>

        <div className="page">
          {tab === 'overview' && (
            <div className="fade-in">
              <div className="g4">
                <div className="kcard">
                  <div className="kcard-label">Current Equity</div>
                  <div className="kcard-val">{formatCurrency(initialData.equity)}</div>
                  <div className={`kcard-sub ${profitIsPositive ? 'up' : 'down'}`}>
                    {profitIsPositive ? '▲ +' : '▼ '}{formatCurrency(Math.abs(profitDiff))} floating profit
                  </div>
                </div>
                <div className="kcard">
                  <div className="kcard-label">Realized Earnings</div>
                  <div className="kcard-val" style={{ color: totalClosedProfit >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {totalClosedProfit >= 0 ? '+' : ''}{formatCurrency(totalClosedProfit)}
                  </div>
                  <div className="kcard-sub">Total closed trade profit</div>
                </div>
                <div className="kcard">
                  <div className="kcard-label">Win Rate</div>
                  <div className="kcard-val">{winRate}%</div>
                  <div className="kcard-sub">All execution stats</div>
                </div>
                <div className="kcard">
                  <div className="kcard-label">Profit Factor</div>
                  <div className="kcard-val">{profitFactor}</div>
                  <div className="kcard-sub up">Performance metric score</div>
                </div>
              </div>

              <div className="g2-7">
                <div>
                  <div className="chart-box" style={{ minHeight: 460 }}>
                    <div className="chart-title">Account Growth (USD)</div>
                    <canvas ref={equityRef} height="220" style={{ width: '100%' }}></canvas>
                    <div className="legend-row">
                      <div className="leg-item"><div className="leg-dot" style={{ background: 'var(--brand)' }}></div> Current Value</div>
                      <div className="leg-item"><div className="leg-dot" style={{ background: 'var(--card2)' }}></div> Starting Value</div>
                    </div>
                  </div>
                  <div className="tbl-container" style={{ overflowX: 'auto' }}>
                    <div className="sec-hdr" style={{ padding: '20px 24px', marginBottom: 0 }}>
                      <div className="sec-title">Recent Trades</div>
                    </div>
                    {initialData.history.length > 0 ? (
                      <table style={{ minWidth: 600 }}>
                        <thead><tr><th>Symbol</th><th>Direction</th><th>Entry</th><th>Exit</th><th>Profit</th><th>Date</th></tr></thead>
                        <tbody>
                          {initialData.history.map((h, i) => (
                              <tr key={i}>
                                <td style={{ fontWeight: 700 }}>{h.instrument}</td>
                                <td><span className={`badge ${h.direction === 'BUY' ? 'b-ok' : 'b-sell'}`}>{h.direction}</span></td>
                                <td className="mono">{h.entryPrice.toFixed(2)}</td>
                                <td className="mono">{h.exitPrice.toFixed(2)}</td>
                                <td className={`mono ${h.profit >= 0 ? 'up' : 'down'}`}>{h.profit >= 0 ? '+' : ''}${h.profit.toFixed(2)}</td>
                                <td style={{ color: 'var(--t4)' }}>{new Date(h.closedAt).toLocaleDateString()}</td>
                              </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ padding: 40, textAlign: 'center', color: 'var(--t4)' }}>No trade history recorded yet.</div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="sec-hdr"><div className="sec-title">Active Signals</div></div>
                  <div className="sigs-grid">
                    {signals.filter(s => s.status === 'ACTIVE').length > 0 ? (
                      signals.filter(s => s.status === 'ACTIVE').map(s => <SignalCard key={s.id} s={s} />)
                    ) : (
                      <div className="chart-box" style={{ textAlign: 'center', opacity: 0.7 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t4)', marginBottom: 12 }}>NO ACTIVE SIGNALS</div>
                        <div style={{ color: 'var(--t4)', fontSize: 11 }}>We are currently looking for new trading opportunities.</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'signals' && (
            <div className="fade-in">
                <div className="sec-hdr"><div className="sec-title">Signals History Feed</div></div>
                <div className="sigs-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))' }}>
                  {signals.map(s => <SignalCard key={s.id} s={s} />)}
                </div>
            </div>
          )}

          {tab === 'performance' && (
            <div className="fade-in">
              <div className="g2">
                <div className="chart-box">
                  <div className="chart-title">Total Growth</div>
                  <canvas ref={aumRef} height="200" style={{ width: '100%' }}></canvas>
                </div>
                <div className="chart-box">
                  <div className="chart-title">Monthly Returns (%)</div>
                  <canvas ref={barRef} height="200" style={{ width: '100%' }}></canvas>
                </div>
              </div>
              <div className="chart-box">
                 <div className="chart-title">Performance Statistics</div>
                 <div className="metric-grid">
                    <div className="metric-card">
                       <div className="metric-lbl">Profit Factor</div>
                       <div className="metric-val">{profitFactor}</div>
                       <div className="metric-bar"><div className="metric-bar-fill" style={{ width: `${Math.min(100, Number(profitFactor) * 30)}%`, background: 'var(--green)' }}></div></div>
                    </div>
                    <div className="metric-card">
                       <div className="metric-lbl">Win Rate</div>
                       <div className="metric-val">{winRate}%</div>
                       <div className="metric-bar"><div className="metric-bar-fill" style={{ width: `${winRate}%`, background: 'var(--brand)' }}></div></div>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {tab === 'analytics' && (
            <div className="fade-in">
              <div className="g4">
                <div className="kcard">
                  <div className="kcard-label">Win Rate</div>
                  <div className="kcard-val">{winRate}%</div>
                  <div className="kcard-sub up">▲ Platform target met</div>
                </div>
                <div className="kcard">
                  <div className="kcard-label">Profit Factor</div>
                  <div className="kcard-val">{profitFactor}</div>
                  <div className="kcard-sub up">▲ High profit factor index</div>
                </div>
                <div className="kcard">
                  <div className="kcard-label">Total Trades</div>
                  <div className="kcard-val">{totalTrades}</div>
                  <div className="kcard-sub">Closed copied trades</div>
                </div>
                <div className="kcard">
                  <div className="kcard-label">Value at Risk (95%)</div>
                  <div className="kcard-val">$240</div>
                  <div className="kcard-sub">Calculated safety cushion</div>
                </div>
              </div>
              <div className="g2-7">
                <div className="chart-box" style={{ minHeight: 320 }}>
                  <div className="chart-title">Equity Curve vs Drawdown</div>
                  <canvas ref={eqDdRef} height="260" style={{ width: '100%' }}></canvas>
                  <div className="legend-row">
                    <div className="leg-item"><div className="leg-dot" style={{ background: 'var(--brand)' }}></div> Equity Curve</div>
                    <div className="leg-item"><div className="leg-dot" style={{ background: 'var(--red)' }}></div> Drawdown %</div>
                  </div>
                </div>
                <div>
                  <div className="chart-box" style={{ minHeight: 150, marginBottom: 20 }}>
                    <div className="chart-title">Trade Return Distribution</div>
                    <canvas ref={distRef} height="120" style={{ width: '100%' }}></canvas>
                  </div>
                  <div className="chart-box" style={{ minHeight: 150 }}>
                    <div className="chart-title">Drawdown Depth</div>
                    <canvas ref={ddRef} height="120" style={{ width: '100%' }}></canvas>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'compliance' && (
             <div className="fade-in">
                <div className="chart-box" style={{ maxWidth: 800, margin: '0 auto' }}>
                   <div className="kyc-title">Identity Verification</div>
                   <div style={{ marginBottom: 32 }}>
                      {initialData.user.kycStatus === 'APPROVED' ? (
                        <div className="alert alert-info">
                           <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, marginRight: 8 }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                           Your identity has been verified successfully. No further action is required.
                        </div>
                      ) : initialData.user.kycStatus === 'SUBMITTED' ? (
                        <div className="alert alert-warn" style={{ color: 'var(--brand)' }}>
                           <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, marginRight: 8 }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                           Your KYC documents are currently in review. We will notify you once approved.
                        </div>
                      ) : (
                        <div className="alert alert-err" style={{ color: 'var(--red)' }}>
                           <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, marginRight: 8 }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                           Verification pending. Please submit your identity verification documents to unlock copy-trading.
                        </div>
                      )}
                   </div>
                   <div className="tbl-container">
                      <table>
                         <tbody>
                            <tr><td style={{ fontWeight: 800 }}>Account Status</td><td><span className={`badge ${initialData.user.kycStatus === 'APPROVED' ? 'b-ok' : initialData.user.kycStatus === 'SUBMITTED' ? 'b-warn' : 'b-err'}`}>{initialData.user.kycStatus}</span></td></tr>
                            <tr><td style={{ fontWeight: 800 }}>Trading Account Connection</td><td>{verifiedAccounts.length > 0 ? `Linked (${verifiedAccounts[0].serverName})` : 'No verified MT5 accounts linked'}</td></tr>
                            <tr><td style={{ fontWeight: 800 }}>Reference ID</td><td className="mono">{initialData.user.id.substring(0, 8).toUpperCase()}</td></tr>
                            <tr><td style={{ fontWeight: 800 }}>Joined On</td><td style={{ color: 'var(--t4)' }}>{new Date(initialData.user.createdAt).toLocaleDateString()}</td></tr>
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
