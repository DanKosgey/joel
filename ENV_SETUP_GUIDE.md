# AurumXAU Environment Variables Setup Guide

This guide explains how to obtain and configure every required environment variable for the AurumXAU platform.

## 1. Database (Supabase)

The platform uses **Supabase** (PostgreSQL) for all persistent data.

### `DATABASE_URL` (Pooled Connection)
Used by the application at runtime. It includes `?pgbouncer=true` to handle many concurrent connections.
1.  Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2.  Select your project → **Project Settings** (gear icon) → **Database**.
3.  Scroll to **Connection Pooling** → **Connection String** → **URI**.
4.  Ensure the mode is set to **Transaction** (port 6543) and add `&pgbouncer=true&connection_limit=1` to the end.

### `DIRECT_URL` (Direct Connection)
Used only by Prisma for migrations (`npx prisma migrate`).
1.  In the same **Database** settings page, look for **Connection String** → **URI**.
2.  Ensure the port is **5432** (direct connection).

---

## 2. Authentication (NextAuth)

### `NEXTAUTH_SECRET`
Used to sign and encrypt cookies and tokens.
- **How to get**: Run the following command in your terminal and copy the output:
  ```bash
  openssl rand -base64 32
  ```

### `NEXTAUTH_URL`
The canonical base URL of your site.
- **Local**: `http://localhost:3000`
- **Production**: `https://your-domain.com`

---

## 3. Supabase API Keys

Used for the client-side Supabase client and server-side admin actions.
1.  Go to **Project Settings** → **API**.
2.  **`NEXT_PUBLIC_SUPABASE_URL`**: Found under Project URL.
3.  **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Found under Project API keys (anon public).
4.  **`SUPABASE_SERVICE_ROLE_KEY`**: Found under Project API keys (service_role). 
    > [!CAUTION]
    > **Never ever** share this key or include it in client-side code. It bypasses Row Level Security (RLS).

---

## 4. MT5 Integration

These variables enable communication with your MT5 bridge or webhook listener.

### `MT5_WEBHOOK_URL`
The endpoint where the MT5 Expert Advisor (EA) or Bridge sends trade signals.
- **Example**: `https://api.your-bridge-service.com/hooks/aurum`

### `MT5_WEBHOOK_SECRET`
A shared secret between the MT5 bridge and this Next.js app to verify that incoming requests are authentic.
- **How to get**: Generate any long random string (e.g., `openssl rand -hex 24`).

---

## 5. Monitoring & Maintenance

### `SENTRY_DSN` (Optional)
Used for error tracking and performance monitoring.
1.  Create a project at [Sentry.io](https://sentry.io/).
2.  Go to **Project Settings** → **Client Keys (DSN)** and copy the URL.

### `CRON_SECRET`
Used to secure automated cron jobs (e.g., daily equity snapshots).
- **How to get**: Generate any long random string. When calling the cron route, pass this in the Authorization header.

---

## Summary Table

| Variable | Source | Required |
| :--- | :--- | :--- |
| `DATABASE_URL` | Supabase (Port 6543) | **YES** |
| `DIRECT_URL` | Supabase (Port 5432) | **YES** |
| `NEXTAUTH_SECRET` | Terminal (`openssl`) | **YES** |
| `NEXTAUTH_URL` | Application URL | **YES** |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API Settings | **YES** |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase API Settings | **YES** |
| `MT5_WEBHOOK_SECRET` | Manual Generation | **YES** |
| `CRON_SECRET` | Manual Generation | **YES** |
| `SENTRY_DSN` | Sentry Dashboard | No |
