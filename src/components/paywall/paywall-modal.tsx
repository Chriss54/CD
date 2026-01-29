'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface PaywallModalProps {
  isOpen: boolean;
}

export function PaywallModal({ isOpen }: PaywallModalProps) {
  const router = useRouter();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" />

      {/* Modal card */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-lg shadow-xl p-8">
        <div className="text-center space-y-6">
          {/* Heading */}
          <h2 className="text-2xl font-bold text-foreground">
            Become a Member
          </h2>

          {/* Description */}
          <p className="text-muted-foreground">
            Join our community to access all content, courses, and events.
          </p>

          {/* Plan display box */}
          <div className="bg-muted rounded-lg p-6 space-y-2">
            <p className="font-semibold text-foreground">
              Community Membership
            </p>
            <p className="text-3xl font-bold text-primary">
              $29<span className="text-lg font-normal text-muted-foreground">/month</span>
            </p>
          </div>

          {/* CTA Button */}
          <Button
            size="lg"
            className="w-full"
            onClick={() => router.push('/register')}
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}
