import { notFound } from 'next/navigation';
import { currentUserRepository } from '@/domains/member';
import { getInquiryWriteViewModel } from '@/domains/inquiry';
import { MypageInquiryWriteFlow } from '@/features/mypage/inquiries';
import { resolveMypageInquiryWriteReturnHref } from '@/shared/lib/mypage-routes';
import {
  parseInquiryWritePageQuery,
  type InquiryWritePageSearchParams,
} from './query';

interface InquiryWritePageProps {
  searchParams: Promise<InquiryWritePageSearchParams>;
}

async function InquiryWritePage({ searchParams }: InquiryWritePageProps) {
  const [user, query] = await Promise.all([
    currentUserRepository.findCurrent(),
    searchParams.then(parseInquiryWritePageQuery),
  ]);

  if (!user || query.kind === 'invalid') notFound();

  const inquiryWriteViewModel = await getInquiryWriteViewModel(
    user.id,
    query.entryContext,
  );

  if (!inquiryWriteViewModel) notFound();

  return (
    <article className="overflow-hidden rounded-md border border-zinc-300 bg-white">
      <header className="border-b border-zinc-300 px-4 py-4 md:px-5">
        <h2 className="text-xl font-black tracking-tight text-black">
          1:1 문의 작성
        </h2>
      </header>
      <MypageInquiryWriteFlow
        viewModel={inquiryWriteViewModel}
        returnHref={resolveMypageInquiryWriteReturnHref({
          orderId:
            query.entryContext && 'orderId' in query.entryContext
              ? query.entryContext.orderId
              : undefined,
          returnTo: query.returnTo,
        })}
      />
    </article>
  );
}

export default InquiryWritePage;
