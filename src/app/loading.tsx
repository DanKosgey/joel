// ✅ AGENT: Universal loading state to match branding
export default function Loading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100vw', background: 'var(--bg)', flexDirection: 'column' }}>
      <div className="logo-mark" style={{ marginBottom: 30 }}>
        <div className="logo-icon active">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7l9 5 9-5-9-5z" fill="#05070a"/>
            <path d="M3 17l9 5 9-5M3 12l9 5 9-5" stroke="#05070a" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
      <div style={{ color: 'var(--gold)', fontFamily: 'var(--ff-m)', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase' }}>
        Synthesizing Data...
      </div>
    </div>
  );
}
