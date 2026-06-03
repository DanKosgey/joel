import type { Metadata } from 'next';
import { StoreProvider } from '@/lib/StoreContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aurum Capital — XAUUSD Managed Accounts',
  description: 'Precision trading in XAUUSD Gold',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
