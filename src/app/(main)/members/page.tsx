import db from '@/lib/db';
import { MemberGrid } from '@/components/profile/member-grid';
import { Pagination } from '@/components/ui/pagination';

const ITEMS_PER_PAGE = 12;

interface MembersPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || '1', 10) || 1);
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  const [members, total] = await Promise.all([
    db.user.findMany({
      skip,
      take: ITEMS_PER_PAGE,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        level: true,
      },
    }),
    db.user.count(),
  ]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Members</h1>
        <p className="text-muted-foreground mt-1">
          {total} {total === 1 ? 'member' : 'members'} in the community
        </p>
      </div>

      <MemberGrid members={members} />

      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      )}
    </div>
  );
}
