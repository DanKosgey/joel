"use client";

/**
 * StoreContext — Ephemeral UI State Only
 *
 * This context is intentionally NOT a data layer. It manages:
 *  - Live gold ticker (simulated WebSocket until real feed is built)
 *  - Toast notification system
 *  - Any transient UI state that doesn't belong in a Server Component
 *
 * Real data (user, MT5 accounts, signals, KYC) is fetched server-side
 * in page.tsx files and passed as props to components. It does not live here.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Ticker {
  price: number;
  change: number;
}

interface StoreContextType {
  ticker: Ticker;
  showToast: (msg: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Live gold price simulation — will be replaced by a real WebSocket feed
  const BASE_PRICE = 2318.40;
  const [ticker, setTicker] = useState<Ticker>({ price: BASE_PRICE, change: 0 });

  useEffect(() => {
    let ws: WebSocket | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    const startWebSocket = () => {
      try {
        ws = new WebSocket('wss://stream.binance.com:9443/ws/paxgusdt@ticker');
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && data.c) {
              const price = parseFloat(data.c);
              const change = parseFloat(data.p);
              setTicker({ price, change });
            }
          } catch (e) {
            console.error('Error parsing ticker WebSocket message:', e);
          }
        };

        ws.onerror = (err) => {
          console.warn('Binance ticker WebSocket error, falling back to simulation:', err);
          startSimulation();
        };

        ws.onclose = () => {
          // Attempt simulation if closed unexpectedly
          startSimulation();
        };
      } catch (err) {
        console.warn('Could not instantiate ticker WebSocket, falling back to simulation:', err);
        startSimulation();
      }
    };

    const startSimulation = () => {
      if (fallbackInterval) return; // Already running simulation fallback
      fallbackInterval = setInterval(() => {
        setTicker((prev) => {
          const newPrice = Math.max(
            2300,
            Math.min(2350, prev.price + (Math.random() - 0.48) * 0.8),
          );
          return { price: newPrice, change: newPrice - BASE_PRICE };
        });
      }, 1200);
    };

    startWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
  }, []);

  // ── Toast system ────────────────────────────────────────────────────────────

  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  return (
    <StoreContext.Provider value={{ ticker, showToast }}>
      {children}

      {/* Global toast overlay */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: 30,
            right: 30,
            background: 'var(--green-bg)',
            border: '1px solid var(--green-border)',
            padding: '14px 20px',
            borderRadius: 'var(--r)',
            color: 'var(--green)',
            fontSize: 14,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
            animation: 'fadein 0.3s ease',
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          {toastMsg}
        </div>
      )}
    </StoreContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStore(): StoreContextType {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
}
