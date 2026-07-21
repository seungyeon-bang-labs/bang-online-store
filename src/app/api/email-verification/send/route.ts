import { NextResponse } from 'next/server';

const CODE_TTL_MS = 3 * 60 * 1000;

function getStore(): Map<string, { code: string; expiresAt: number }> {
  const globalForStore = globalThis as unknown as {
    __emailVerificationStore?: Map<string, { code: string; expiresAt: number }>;
  };

  if (!globalForStore.__emailVerificationStore) {
    globalForStore.__emailVerificationStore = new Map();
  }

  return globalForStore.__emailVerificationStore;
}

function cleanupExpired(store: Map<string, { code: string; expiresAt: number }>) {
  const now = Date.now();
  for (const [email, record] of store.entries()) {
    if (now > record.expiresAt) {
      store.delete(email);
    }
  }
}

function generateCode(length = 6) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}

export async function POST(request: Request) {
  const { email } = (await request.json()) as { email?: string };

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ message: '이메일을 입력해주세요.' }, { status: 400 });
  }

  const code = generateCode();
  const expiresAt = Date.now() + CODE_TTL_MS;
  const store = getStore();
  cleanupExpired(store);
  store.set(email, { code, expiresAt });

  return NextResponse.json({ ok: true, code, expiresAt });
}
