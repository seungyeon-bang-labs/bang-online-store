import { NextResponse } from 'next/server';
import { getTermDetailViewModel } from '@/domains/terms';

interface TermRouteContext {
  params: Promise<{ termId: string }>;
}

export async function GET(_request: Request, { params }: TermRouteContext) {
  const { termId } = await params;
  const headers = { 'Cache-Control': 'no-store' };

  try {
    const term = await getTermDetailViewModel(termId);

    if (!term) {
      return NextResponse.json(
        { message: '현재 확인할 수 없는 약관입니다.' },
        { status: 404, headers },
      );
    }

    return NextResponse.json({ term }, { headers });
  } catch {
    return NextResponse.json(
      { message: '약관을 불러오지 못했습니다. 다시 시도해주세요.' },
      { status: 500, headers },
    );
  }
}
