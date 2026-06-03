"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, getSession } from 'next-auth/react';
import { useStore } from '../lib/StoreContext';

export default function LoginView() {
  const router = useRouter();
  const { ticker } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const priceStr = ticker.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const chgStr = `${ticker.change >= 0 ? '▲ +' : '▼ '}${Math.abs(ticker.change).toFixed(2)} (${Math.abs((ticker.change / 2318.40) * 100).toFixed(2)}%)`;
  const up = ticker.change >= 0;

  const [loading, setLoading] = useState(false);
  const [lockout, setLockout] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (lockout > 0) {
      timer = setInterval(() => setLockout((p) => p - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [lockout]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockout > 0) return;
    
    setErr('');
    if (!email || !password) {
      setErr("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setErr("Invalid email or password.");
        setLockout(prev => (prev === 0 ? 30 : prev + 30));
      } else {
        const session = await getSession();
        const role = session?.user?.role;
        router.push(role === 'ADMIN' ? '/admin' : '/client');
      }
    } catch (e) {
      setErr("Connection error. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="view-login" className="fade-in">
      <div className="login-header-fixed">
        <div className="logo-mark" style={{ marginBottom: 0 }}>
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <path d="M12 2v20M17 5H7M17 19H7M2 12h20" opacity="0.5"/>
              <rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor"/>
              <circle cx="12" cy="12" r="3" fill="#fff"/>
            </svg>
          </div>
          <div className="logo-text">Nexus<span>FX</span></div>
        </div>
        <div className="top-bar-ticker">
          <div className="ticker-pulse"></div>
          <span style={{ color: 'var(--t4)', fontWeight: 700 }}>XAU/USD SPOT</span>
          <span style={{ fontWeight: 800 }}>{priceStr}</span>
          <span style={{ color: up ? 'var(--green)' : 'var(--red)' }}>{chgStr}</span>
        </div>
      </div>

      <div className="login-panel">
        <form onSubmit={handleLogin} style={{ marginTop: '40px' }}>
          <div className="login-heading">Sign In to NexusFX</div>
          <div className="login-sub">
            Securely access your trading dashboard, view real-time signals, and manage your account.
          </div>
          
          {err && <div className="alert alert-err" style={{ marginBottom: 32 }}>{err}</div>}
          {lockout > 0 && <div className="alert alert-warn" style={{ marginBottom: 32 }}>Locked out: {lockout}s remaining</div>}
          
          <div className="fgroup">
            <label>Email Address</label>
            <input type="email" placeholder="name@email.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading || lockout > 0} />
          </div>
          <div className="fgroup" style={{ marginBottom: 32 }}>
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} disabled={loading || lockout > 0} />
          </div>
          
          <button type="submit" className="btn btn-gold" disabled={loading || lockout > 0} style={{ marginBottom: 20 }}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
          
          <button type="button" className="btn btn-ghost" onClick={() => router.push('/register')}>Create an Account →</button>

          <div style={{ textAlign: 'center', marginTop: 40 }}>
             <div style={{ fontSize: 13, color: 'var(--t4)', fontWeight: 500 }}>
               © 2026 NexusFX. All rights reserved.<br/>
               Real-Time Trading Signal Platform
             </div>
          </div>
        </form>
      </div>

      <div className="login-hero">
        <div className="hero-grid"></div>
        <div className="hero-glow"></div>
        <div className="hero-content-wrapper">
          <div className="hero-headline">Precision Trading.<br/>Elevated <em>Experience.</em></div>
          <div className="hero-tagline">Access institutional-grade XAU/USD signals instantly. A modern, lightning-fast platform built for high-performance trading.</div>
        </div>
      </div>
    </div>
  );
}
