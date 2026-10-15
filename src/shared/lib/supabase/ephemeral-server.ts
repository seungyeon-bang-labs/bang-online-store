import 'server-only';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/supabase';

export function createEphemeralServerClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase 서버 환경변수가 설정되지 않았습니다.');
  }

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: 'implicit',
    },
  });
}
