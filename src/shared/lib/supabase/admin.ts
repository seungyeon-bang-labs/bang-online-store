import 'server-only';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/supabase';

export async function createAdminClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !key) {
    throw new Error('Supabase 관리자 환경변수가 설정되지 않았습니다.');
  }

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
