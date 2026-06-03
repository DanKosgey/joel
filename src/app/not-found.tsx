"use client";

import { useRouter } from 'next/navigation';

// ✅ AGENT: Universal 404 state 
export default function NotFound() {
  const router = useRouter();

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100vw', background: 'var(--bg)', flexDirection: 'column' }}>
      <div style={{ fontSize: 90, color: 'var(--t4)', fontFamily: 'var(--ff-d)', lineHeight: 1 }}>404</div>
      <div style={{ fontSize: 24, padding: '16px 0', fontFamily: 'var(--ff-d)', color: 'var(--t1)' }}>Coordinate not found.</div>
      <div style={{ fontSize: 13, color: 'var(--t3)', maxWidth: 400, textAlign: 'center', marginBottom: 30 }}>
        The data node or view you are trying to reach does not exist within the AurumXAU system parameters.
      </div>
      <button className="btn btn-ghost" onClick={() => router.push('/')}>← Return to Platform</button>
    </div>
  );
}
