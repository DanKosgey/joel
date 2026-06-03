"use client";

import React from 'react';
import type { LiveSignal } from '@/types';

export default function SignalCard({ s }: { s: LiveSignal }) {
  const buy = s.direction === 'BUY';
  const closed = s.status !== 'ACTIVE';
  const statusColor = buy ? 'var(--green)' : 'var(--red)';

  return (
    <div className={`sig-card ${s.direction.toLowerCase()}${closed ? ' closed' : ''} fade-in`}>
      <div className="sig-top">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="sig-pair">{s.instrument}</span>
          <span className={`badge ${buy ? 'b-ok' : 'b-sell'}`} style={{ fontWeight: 800 }}>{s.direction}</span>
          {closed && <span className="badge b-info">ARCHIVED</span>}
        </div>
        <span className="sig-time">
          {new Date(s.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
        </span>
      </div>

      <div className="sig-main">
        <div className="sig-entry-box">
          <div className="sig-entry-lbl">Threshold Entry</div>
          <div className="sig-entry-val" style={{ color: statusColor }}>{s.entryPrice.toFixed(2)}</div>
        </div>
      </div>

      <div className="sig-levels">
        <div className="sig-level-item">
          <div className="sig-level-lbl">Stop Loss</div>
          <div className="sig-level-val" style={{ color: 'var(--red)' }}>{s.stopLoss.toFixed(2)}</div>
        </div>
        <div className="sig-level-item">
          <div className="sig-level-lbl">Take Profit</div>
          <div className="sig-level-val" style={{ color: 'var(--green)' }}>{s.takeProfit.toFixed(2)}</div>
        </div>
        <div className="sig-level-item">
          <div className="sig-level-lbl">Execution</div>
          <div className="sig-level-val">Active</div>
        </div>
      </div>

      {!closed && (
        <div style={{ marginTop: 20 }}>
          <div className="metric-bar"><div className="metric-bar-fill" style={{ width: `25%`, background: statusColor }}></div></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--t4)', fontWeight: 700, marginTop: 8 }}>
            <span>Market Alignment: 25%</span>
            <span>0.10 Standard</span>
          </div>
        </div>
      )}
      
      <div className="sig-note">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 8, opacity: 0.6 }}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span>Secure Nexus Link Active</span>
      </div>
    </div>
  );
}
