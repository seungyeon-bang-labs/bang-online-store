import 'server-only';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/supabase';
import { readSupabaseEnv } from './env';

const { url, anonKey } = readSupabaseEnv();

export const supabase = createClient<Database>(
  url,
  anonKey,
  {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
  },
);
