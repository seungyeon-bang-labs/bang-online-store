import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTermDetailViewModel } from '@/domains/terms';
import { TermContent } from '@/features/terms/term-content';

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
    <main className="mx-auto min-h-dvh max-w-3xl bg-background px-4 py-6 md:my-8 md:min-h-0 md:rounded-xl md:border md:p-8 md:shadow-sm">
      <Link href="/signup" className="text-sm underline">
        회원가입 페이지로 이동
      </Link>
      <h1 className="mt-6 text-2xl font-bold">{termViewModel.title}</h1>
      <div className="mt-4">
        <TermContent term={termViewModel} />
      </div>
    </main>
  );
}

export default TermPage;
