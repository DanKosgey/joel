import Link from 'next/link';
import styles from './landing.module.css';

export default function LandingPage() {
  return (
    <div className={styles.landingContainer}>
      {/* Top Navigation */}
      <nav className={styles.topNav}>
        <div className={styles.logo}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Nexus<span>FX</span>
        </div>
        
        {/* Top Right Login Button */}
        <Link href="/login" className={styles.loginBtn}>
          Sign In
        </Link>
      </nav>

      {/* Hero Content */}
      <main className={styles.heroSection}>
        <h1 className={styles.title}>
          Precision Trading.<br/>
          <span>Elevated Experience.</span>
        </h1>
        
        <p className={styles.subtitle}>
          Access institutional-grade XAU/USD signals instantly. A modern, lightning-fast platform built for high-performance trading.
        </p>
      </main>
    </div>
  );
}
