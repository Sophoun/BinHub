import { redirect } from 'next/navigation';
import { getSession } from '@/src/lib/auth';

export default async function Home() {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }

  if (session.user.role === 'admin') {
    redirect('/admin');
  } else {
    redirect('/dashboard');
  }
}
