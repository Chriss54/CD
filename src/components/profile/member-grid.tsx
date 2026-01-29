import { MemberCard } from './member-card';

interface Member {
  id: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  level: number;
}

interface MemberGridProps {
  members: Member[];
}

export function MemberGrid({ members }: MemberGridProps) {
  if (members.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
        No members yet
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {members.map((member) => (
        <MemberCard key={member.id} member={member} />
      ))}
    </div>
  );
}
