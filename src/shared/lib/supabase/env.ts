const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

// The dev server talks only to the local Supabase, so a stray production URL can never take test writes.
export function readSupabaseEnv(env: NodeJS.ProcessEnv = process.env) {
  const url = env.SUPABASE_URL;
  const anonKey = env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error('Supabase 서버 환경변수가 설정되지 않았습니다.');
  if (env.NODE_ENV === 'development' && !LOCAL_HOSTS.has(new URL(url).hostname)) {
    throw new Error('개발 서버는 로컬 Supabase에만 연결합니다. SUPABASE_URL을 확인하세요.');
  }

  return { url, anonKey };
}
