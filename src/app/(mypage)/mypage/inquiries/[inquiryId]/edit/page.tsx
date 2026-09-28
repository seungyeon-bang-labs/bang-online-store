import { MypageFormCard, MypageFormUnavailable } from '@/features/mypage/common';
import { notFound } from 'next/navigation';
import { getInquiryEditPageViewModel } from '@/domains/inquiry';
import { currentUserRepository } from '@/domains/member';
import { MypageInquiryEditFlow } from '@/features/mypage/inquiries';
import { resolveMypageInquiryEditReturnHref } from '@/shared/lib/mypage-routes';
import { firstQueryValue } from '@/shared/lib/query';
import { updateMypageInquiryAction } from './actions';
import { INQUIRY_EDIT_UNAVAILABLE } from '@/features/mypage/inquiries/edit/constants';

interface InquiryEditPageProps {
  params: Promise<{ inquiryId: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
}

async function InquiryEditPage({
  params,
  searchParams,
}: InquiryEditPageProps) {
  const [{ inquiryId }, user, query] = await Promise.all([
    params,
    currentUserRepository.findCurrent(),
    searchParams,
  ]);
  const inquiryEditPageViewModel = user
    ? await getInquiryEditPageViewModel(user.id, inquiryId)
    : null;
  if (!inquiryEditPageViewModel) notFound();
  const returnHref = resolveMypageInquiryEditReturnHref({
    returnTo: firstQueryValue(query.returnTo),
  });

  return (
    <MypageFormCard title="1:1 문의 수정">
      {inquiryEditPageViewModel.kind === 'editable' ? (
        <MypageInquiryEditFlow
          viewModel={inquiryEditPageViewModel.form}
          returnHref={returnHref}
          updateInquiryAction={updateMypageInquiryAction}
        />
      ) : (
        <MypageFormUnavailable
          {...INQUIRY_EDIT_UNAVAILABLE}
          action={{ href: returnHref, label: '1:1 문의 내역으로' }}
        />
      )}
    </MypageFormCard>
  );
}

export default InquiryEditPage;
