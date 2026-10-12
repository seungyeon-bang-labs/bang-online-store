import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/shared/types/supabase';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const client = createServerClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values, headers) => {
          for (const { name, value } of values) {
            request.cookies.set(name, value);
          }

          const previousCookies = response.cookies.getAll();
          const previousHeaders = response.headers;

          response = NextResponse.next({ request });

          for (const cookie of previousCookies) {
            response.cookies.set(cookie);
          }

          for (const key of ['cache-control', 'expires', 'pragma']) {
            const value = previousHeaders.get(key);
            if (value) response.headers.set(key, value);
          }

          for (const { name, value, options } of values) {
            response.cookies.set(name, value, options);
          }

          for (const [name, value] of Object.entries(headers)) {
            response.headers.set(name, value);
          }
        },
      },
    },
  );

  await client.auth.getClaims();

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
