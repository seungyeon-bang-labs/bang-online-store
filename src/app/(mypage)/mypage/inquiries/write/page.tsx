import { MypageFormCard } from '@/features/mypage/common/form';
import { MypagePageLayout } from '@/features/mypage/common';
import { notFound } from 'next/navigation';
import { currentUserRepository } from '@/domains/member';
import { getInquiryWriteViewModel } from '@/domains/inquiry';
import { MypageInquiryWriteFlow } from '@/features/mypage/inquiries';
import { resolveMypageInquiryWriteReturnHref } from '@/shared/lib/mypage-routes';
import {
  parseInquiryWritePageQuery,
  type InquiryWritePageSearchParams,
} from './query';
import { createMypageInquiryAction } from '../actions';

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
    <MypagePageLayout mobileSpacing="flush">
      <MypageFormCard
        title="1:1 문의 작성"
        mobileHeader="hide"
        mobileLayout="full-bleed"
      >
        <MypageInquiryWriteFlow
          viewModel={inquiryWriteViewModel}
          returnHref={resolveMypageInquiryWriteReturnHref({
            orderId:
              query.entryContext && 'orderId' in query.entryContext
                ? query.entryContext.orderId
                : undefined,
            returnTo: query.returnTo,
          })}
          onCreateInquiry={createMypageInquiryAction}
        />
      </MypageFormCard>
    </MypagePageLayout>
  );
}

export default InquiryWritePage;
