import { createBrowserClient } from '@supabase/ssr';

const supabaseClientSingleton = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

declare const globalThis: {
  supabaseGlobal: ReturnType<typeof supabaseClientSingleton>;
} & typeof global;

export const createClient = () => {
  return globalThis.supabaseGlobal ?? supabaseClientSingleton();
};

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  globalThis.supabaseGlobal = supabaseClientSingleton();
}
