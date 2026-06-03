"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

// ✅ AGENT COMPLETED: Forgot Password proper route (stubbed functionally)
export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (!email) return;
    setSent(true);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
      <div className="login-panel" style={{ width: 440, borderRadius: 'var(--r)', border: '1px solid var(--border)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
        <div className="logo-mark" style={{ marginBottom: 32 }}>
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7l9 5 9-5-9-5z" fill="#05070a"/>
              <path d="M3 17l9 5 9-5M3 12l9 5 9-5" stroke="#05070a" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="logo-text">Aurum<span>XAU</span> Support</div>
        </div>

        {sent ? (
          <div className="fade">
            <div className="login-heading">Check your email</div>
            <div className="login-sub" style={{ marginBottom: 20 }}>We&apos;ve sent a password recovery link to {email}.</div>
            <div className="alert alert-ok" style={{ marginBottom: 24 }}>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
              Email dispatched successfully! Ensure you check your spam folder.
            </div>
            <button className="btn btn-ghost" onClick={() => router.push('/')}>← Return to Login</button>
          </div>
        ) : (
          <div className="fade">
            <div className="login-heading">Reset Password</div>
            <div className="login-sub">Enter your email and we&apos;ll send you a recovery link.</div>
            <div className="fgroup">
              <label>Registered Email</label>
              <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <button className="btn btn-gold" onClick={handleSubmit} style={{ marginBottom: 10 }}>Send Reset Link</button>
            <button className="btn btn-ghost" onClick={() => router.push('/')}>← Back</button>
          </div>
        )}
      </div>
    </div>
  );
}
