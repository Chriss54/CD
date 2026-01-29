import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import { OnboardingForm } from '@/components/profile/onboarding-form';

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      bio: true,
      image: true,
    },
  });

  if (!user) {
    redirect('/login');
  }

  // If user already has a bio set, consider profile complete and redirect home
  // We use bio as the indicator since name might be from registration
  if (user.bio) {
    redirect('/');
  }

  return <OnboardingForm user={user} />;
}
