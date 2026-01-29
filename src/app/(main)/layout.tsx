import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Header } from '@/components/layout/header';
import { TopNav } from '@/components/layout/top-nav';
import { StickyHeaderWrapper } from '@/components/layout/sticky-header-wrapper';
import { PaywallModal } from '@/components/paywall/paywall-modal';
import { Toaster } from 'sonner';
import { canModerateContent } from '@/lib/permissions';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Users without session are redirected by middleware to /login
  // Paywall only affects authenticated users without active membership
  const showPaywall = session?.user && !session.user.hasMembership;
  const userRole = session?.user?.role;
  const showAdminLink = userRole && canModerateContent(userRole);

  return (
    <div className="min-h-screen bg-gray-50">
      <StickyHeaderWrapper
        header={<Header />}
        nav={<TopNav showAdminLink={showAdminLink} />}
      />
      <main className="py-6 px-4 md:px-8">{children}</main>
      <Toaster position="top-center" richColors />
      <PaywallModal isOpen={!!showPaywall} />
    </div>
  );
}
