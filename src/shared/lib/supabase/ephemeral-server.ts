import 'server-only';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/supabase';
import { readSupabaseEnv } from './env';

export function createEphemeralServerClient() {
  const { url, anonKey } = readSupabaseEnv();

  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: 'implicit',
    },
  });
}
