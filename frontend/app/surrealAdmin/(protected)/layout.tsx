import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_COOKIE_NAME, isAdminSessionCookieValid } from '@/lib/admin-auth';

export const runtime = 'nodejs';

export default async function SurrealAdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!isAdminSessionCookieValid(cookieValue)) {
    redirect('/surrealAdmin/login');
  }
  return <>{children}</>;
}

