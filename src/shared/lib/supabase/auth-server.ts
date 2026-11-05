import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/shared/types/supabase';
import { readSupabaseEnv } from './env';

export async function createAuthClient() {
  const { url, anonKey } = readSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: values => {
          try {
            for (const { name, value, options } of values) {
              cookieStore.set(name, value, options);
            }
          } catch {}
        },
      },
    },
  );
}
