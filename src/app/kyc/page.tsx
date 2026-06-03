import { redirect } from 'next/navigation';
import { getServerAuthSession } from '@/lib/auth';
import KycView from '@/components/KycView';

export default async function KycPage() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect('/');
  }

  return <KycView userId={session.user.id} />;
}
