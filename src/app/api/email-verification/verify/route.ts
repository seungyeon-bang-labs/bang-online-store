import { NextResponse } from 'next/server';

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

export async function POST(request: Request) {
  const { email, code } = (await request.json()) as {
    email?: string;
    code?: string;
  };

  if (
    !email ||
    !code ||
    typeof email !== 'string' ||
    typeof code !== 'string'
  ) {
    return NextResponse.json(
      { message: '이메일과 인증코드를 입력해주세요.' },
      { status: 400 },
    );
  }

  const store = getStore();
  cleanupExpired(store);
  const record = store.get(email);

  if (!record) {
    return NextResponse.json(
      { message: '인증 요청을 먼저 진행해주세요.' },
      { status: 400 },
    );
  }

  if (Date.now() > record.expiresAt) {
    store.delete(email);
    return NextResponse.json(
      { message: '인증 코드가 만료되었습니다.' },
      { status: 400 },
    );
  }

  if (record.code !== code) {
    return NextResponse.json(
      { message: '인증 코드가 올바르지 않습니다.' },
      { status: 400 },
    );
  }

  store.delete(email);
  return NextResponse.json({ ok: true });
}
