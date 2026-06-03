import { redirect } from 'next/navigation';
import { getServerAuthSession } from '@/lib/auth';
import { fetchAdminDashboardData } from '@/app/actions/admin';
import AdminView from '@/components/AdminView';

/**
 * /admin — Server Component
 *
 * Responsibilities:
 *  1. Verify the session JWT
 *  2. If unauthenticated → redirect to /
 *  3. If authenticated but not ADMIN → redirect to /client (defence-in-depth
 *     on top of the middleware role check)
 *  4. Fetch all admin dashboard data server-side
 *  5. Pass hydrated data as props to AdminView
 */
export default async function AdminPage() {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    redirect('/');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/client');
  }

  const data = await fetchAdminDashboardData();

  return <AdminView initialData={data} />;
}
