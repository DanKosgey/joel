"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

export default function LandingView() {
  const router = useRouter();

  return (
    <div id="view-login" className="fade-in" style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div className="login-header-fixed" style={{ background: 'transparent', borderBottom: 'none', backdropFilter: 'none' }}>
        <div className="logo-mark" style={{ marginBottom: 0, cursor: 'pointer' }} onClick={() => router.push('/')}>
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <path d="M12 2v20M17 5H7M17 19H7M2 12h20" opacity="0.5"/>
              <rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor"/>
              <circle cx="12" cy="12" r="3" fill="#fff"/>
            </svg>
          </div>
          <div className="logo-text">Nexus<span>FX</span></div>
        </div>
        <div>
          <button className="btn btn-gold" onClick={() => router.push('/login')} style={{ width: 'auto', padding: '10px 24px' }}>Sign In</button>
        </div>
      </div>

      <div className="hero-grid"></div>
      <div className="hero-glow"></div>
      <div className="hero-content-wrapper" style={{ zIndex: 10, padding: '0 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="hero-headline" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', lineHeight: '1.1', marginBottom: '24px' }}>
          Precision Trading.<br/>Elevated <em>Experience.</em>
        </div>
        <div className="hero-tagline" style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 40px auto' }}>
          Access institutional-grade XAU/USD signals instantly. A modern, lightning-fast platform built for high-performance trading.
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className="btn btn-gold" style={{ padding: '16px 40px', fontSize: '16px', width: 'auto' }} onClick={() => router.push('/register')}>
            Create Account
          </button>
          <button className="btn btn-ghost" style={{ padding: '16px 40px', fontSize: '16px', width: 'auto' }} onClick={() => router.push('/login')}>
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
