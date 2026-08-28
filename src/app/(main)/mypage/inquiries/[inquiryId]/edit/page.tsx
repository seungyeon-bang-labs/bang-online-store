import { notFound } from 'next/navigation';
import { getInquiryEditViewModel } from '@/domains/inquiry';
import { currentUserRepository } from '@/domains/member';
import { MypageInquiryEditFlow } from '@/features/mypage/inquiries';
import { resolveMypageInquiryEditReturnHref } from '@/shared/lib/mypage-routes';
import { firstQueryValue } from '@/shared/lib/query';
import { updateMypageInquiryAction } from './actions';

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
  const inquiryEditViewModel = user
    ? await getInquiryEditViewModel(user.id, inquiryId)
    : null;
  if (!inquiryEditViewModel) notFound();

  return (
    <article className="overflow-hidden rounded-md border border-zinc-300 bg-white">
      <header className="border-b border-zinc-300 px-4 py-4 md:px-5">
        <h2 className="text-xl font-black tracking-tight text-black">
          1:1 문의 수정
        </h2>
      </header>
      <MypageInquiryEditFlow
        viewModel={inquiryEditViewModel}
        returnHref={resolveMypageInquiryEditReturnHref({
          returnTo: firstQueryValue(query.returnTo),
        })}
        updateInquiryAction={updateMypageInquiryAction}
      />
    </article>
  );
}

export default InquiryEditPage;
