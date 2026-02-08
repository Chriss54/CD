import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Header } from '@/components/layout/header';
import { TopNav } from '@/components/layout/top-nav';
import { StickyHeaderWrapper } from '@/components/layout/sticky-header-wrapper';
import { PaywallModal } from '@/components/paywall/paywall-modal';
import { Toaster } from 'sonner';
import { canEditSettings } from '@/lib/permissions';
import { getMessages } from '@/lib/i18n';
import { getUserLanguage } from '@/lib/translation/helpers';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Get user's language preference (now includes IP geolocation detection)
  const userLanguage = await getUserLanguage();

  // Get translated messages
  const messages = getMessages(userLanguage);

  // Users without session are redirected by middleware to /login
  // Paywall only affects authenticated users without active membership
  const showPaywall = session?.user && !session.user.hasMembership;
  const userRole = session?.user?.role;
  const showAdminLink = userRole && canEditSettings(userRole);

  return (
    <div className="min-h-screen bg-gray-50">
      <StickyHeaderWrapper
        header={<Header messages={messages} />}
        nav={<TopNav showAdminLink={showAdminLink} messages={messages} />}
      />
      <main className="py-6 px-4 md:px-8">{children}</main>
      <Toaster position="top-center" richColors />
      <PaywallModal isOpen={!!showPaywall} />
    </div>
  );
}
