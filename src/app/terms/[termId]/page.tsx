import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTermDetailViewModel } from '@/domains/terms';

interface TermPageProps {
  params: Promise<{ termId: string }>;
}

async function TermPage({ params }: TermPageProps) {
  const { termId } = await params;

  const termViewModel = await getTermDetailViewModel(termId);

  if (!termViewModel) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/signup" className="text-sm underline">
        회원가입으로 돌아가기
      </Link>
      <h1 className="mt-6 text-2xl font-bold">{termViewModel.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        버전 {termViewModel.version} · 시행일 {termViewModel.effectiveDateLabel}
      </p>
      <div className="mt-8 whitespace-pre-wrap wrap-break-word leading-7">
        {termViewModel.content}
      </div>
    </main>
  );
}

export default TermPage;
