import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { canModerateContent } from '@/lib/permissions';
import { AdminTabs } from '@/components/admin/admin-tabs';
import type { Role } from '@/lib/permissions';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const userRole = session.user.role;

  // Only moderator+ can access admin section
  if (!canModerateContent(userRole)) {
    redirect('/feed');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
        </div>
      </div>

      {/* Admin navigation tabs */}
      <AdminTabs role={userRole as Role} />

      {/* Page content - with card styling */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {children}
        </div>
      </main>
    </div>
  );
}
