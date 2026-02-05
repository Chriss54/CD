'use client';

import { SessionProvider } from 'next-auth/react';
import { TranslationProvider } from '@/components/translation/TranslationContext';
import { GlobalTranslator } from '@/components/translation/GlobalTranslator';

interface ProvidersProps {
  children: React.ReactNode;
  /** Initial language from server (user's profile preference) */
  initialLanguage?: string;
}

export function Providers({ children, initialLanguage }: ProvidersProps) {
  return (
    <SessionProvider>
      <TranslationProvider initialLanguage={initialLanguage}>
        {children}
        <GlobalTranslator />
      </TranslationProvider>
    </SessionProvider>
  );
}
