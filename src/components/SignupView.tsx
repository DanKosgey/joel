"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/app/actions/auth';
import { signIn } from 'next-auth/react';
import { useStore } from '../lib/StoreContext';

export default function SignupView() {
  const router = useRouter();
  const { ticker } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const priceStr = ticker.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const chgStr = `${ticker.change >= 0 ? '▲ +' : '▼ '}${Math.abs(ticker.change).toFixed(2)} (${Math.abs((ticker.change / 2318.40) * 100).toFixed(2)}%)`;
  const up = ticker.change >= 0;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    
    if (!name || !email || !password) {
      setErr("Please fill out all fields.");
      return;
    }

    if (password.length < 8) {
      setErr("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set('name', name);
      formData.set('email', email);
      formData.set('password', password);

      const res = await registerUser(formData);

      if (res.success) {
        const authRes = await signIn('credentials', {
            email,
            password,
            redirect: false,
        });

        if (authRes?.error) {
            router.push('/');
        } else {
            router.push('/kyc');
        }
      } else {
        setErr(res.error || "Failed to create account.");
      }
    } catch (e: any) {
      setErr(e.message || "An unexpected error occurred.");
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
          <span style={{ color: 'var(--t4)', fontWeight: 700 }}>XAU/USD</span>
          <span style={{ fontWeight: 800 }}>{priceStr}</span>
          <span style={{ color: up ? 'var(--green)' : 'var(--red)' }}>{chgStr}</span>
        </div>
      </div>

      <div className="login-panel">
        <div className="logo-mark" style={{ display: 'none' }}>
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="8" rx="2" stroke="none" fill="rgba(255,255,255,0.2)"/>
              <path d="M12 2v20M17 5H7M17 19H7M2 12h20" opacity="0.5"/>
              <circle cx="12" cy="12" r="3" fill="#fff"/>
            </svg>
          </div>
          <div className="logo-text">Nexus<span>FX</span></div>
        </div>

        <form onSubmit={handleSignup}>
          <div className="login-heading">Create Account</div>
          <div className="login-sub">Sign up to track trading signals and view live performance metrics.</div>
          
          {err && <div className="alert alert-err" style={{ marginBottom: 20 }}>{err}</div>}
          
          <div className="fgroup">
            <label>Full Name</label>
            <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} disabled={loading} />
          </div>
          
          <div className="fgroup">
            <label>Email Address</label>
            <input type="email" placeholder="name@email.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
          </div>
          
          <div className="fgroup" style={{ marginBottom: 24 }}>
            <label>Password</label>
            <input type="password" placeholder="Minimum 8 characters" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
            <div style={{ fontSize: 11, color: 'var(--t4)', marginTop: 8 }}>Choose a secure password of 8 or more characters.</div>
          </div>
          
          <button type="submit" className="btn btn-gold" disabled={loading} style={{ marginBottom: 20 }}>
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
          
          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--t3)' }}>
            Already have an account? <a onClick={() => router.push('/')} className="link" style={{ fontWeight: 600 }}>Sign In</a>
          </div>
        </form>

        <div style={{ flex: 1 }}></div>
        <div style={{ fontSize: 11, color: 'var(--t4)', textAlign: 'center', marginTop: 40, lineHeight: 1.8 }}>
          © 2026 NexusFX. All rights reserved.<br/>
          Secure User Registration
        </div>
      </div>

      <div className="login-hero">
        <div className="hero-grid"></div>
        <div className="hero-glow"></div>
        <div className="hero-content-wrapper">
          <div className="hero-headline">Simple Signals.<br/>Real <em>Results.</em></div>
          <div className="hero-tagline">Get real-time gold (XAU/USD) signals placed by experienced administrators. Follow trades and track your account performance easily.</div>
        </div>
      </div>
    </div>
  );
}
