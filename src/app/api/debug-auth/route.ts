import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getServerAuthSession();
  
  // Extract headers
  const headersObj: Record<string, string> = {};
  request.headers.forEach((val, key) => {
    headersObj[key] = val;
  });

  // Extract cookies
  const cookiesHeader = request.headers.get('cookie') || '';
  const cookieNames = cookiesHeader.split(';').map(c => c.split('=')[0].trim()).filter(Boolean);

  return NextResponse.json({
    message: "NextAuth Debug Info",
    environment: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || "NOT_SET (NextAuth will auto-detect)",
      NEXTAUTH_SECRET_STATUS: process.env.NEXTAUTH_SECRET ? "DEFINED (Good)" : "NOT_DEFINED (Error in production)",
      NODE_ENV: process.env.NODE_ENV
    },
    request: {
      url: request.url,
      method: request.method,
      headers: {
        host: headersObj['host'],
        'x-forwarded-host': headersObj['x-forwarded-host'],
        'x-forwarded-proto': headersObj['x-forwarded-proto'],
      }
    },
    cookiesReceived: cookieNames,
    sessionState: session ? {
      authenticated: true,
      user: {
        id: session.user?.id,
        name: session.user?.name,
        role: session.user?.role
      }
    } : {
      authenticated: false,
      reason: "getServerAuthSession returned null"
    }
  });
}
