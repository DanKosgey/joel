import { redirect } from 'next/navigation';
import { getServerAuthSession } from '@/lib/auth';
import { fetchClientDashboardData } from '@/app/actions/client';
import ClientView from '@/components/ClientView';

/**
 * /client — Server Component
 *
 * Responsibilities:
 *  1. Verify the session JWT (getServerAuthSession)
 *  2. If unauthenticated → redirect to /
 *  3. Fetch all dashboard data server-side (no client-side loading state needed)
 *  4. Pass the hydrated data as props to ClientView
 */
export default async function ClientPage() {
  const session = await getServerAuthSession();

  // Middleware already handles the redirect, but a server-side guard is
  // good defence-in-depth so the page is never rendered without a session.
  if (!session?.user?.id) {
    redirect('/');
  }

  const data = await fetchClientDashboardData(session.user.id);

  return <ClientView initialData={data} userId={session.user.id} />;
}
