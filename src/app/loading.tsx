export default function Loading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100vw', background: 'var(--bg)', flexDirection: 'column', gap: 20 }}>
      <div className="logo-mark" style={{ marginBottom: 0 }}>
        <div className="logo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" style={{ width: 20, height: 20 }}>
            <path d="M12 2v20M17 5H7M17 19H7M2 12h20" opacity="0.5"/>
            <rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor"/>
            <circle cx="12" cy="12" r="3" fill="#fff"/>
          </svg>
        </div>
      </div>
      <div className="spinner"></div>
      <div style={{ color: 'var(--t3)', fontFamily: 'var(--ff)', fontSize: 13, fontWeight: 600 }}>
        Loading...
      </div>
    </div>
  );
}
