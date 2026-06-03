"use client";

import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100vw', background: 'var(--bg)', flexDirection: 'column', padding: 24 }}>
      <div style={{ fontSize: 72, color: 'var(--t4)', fontFamily: 'var(--ff-d)', lineHeight: 1, fontWeight: 900 }}>404</div>
      <div style={{ fontSize: 22, padding: '14px 0', fontFamily: 'var(--ff-d)', color: 'var(--t1)', fontWeight: 800 }}>Page Not Found</div>
      <div style={{ fontSize: 14, color: 'var(--t3)', maxWidth: 400, textAlign: 'center', marginBottom: 28, lineHeight: 1.6 }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </div>
      <button className="btn btn-ghost" onClick={() => router.push('/')} style={{ width: 'auto' }}>← Back to Home</button>
    </div>
  );
}
