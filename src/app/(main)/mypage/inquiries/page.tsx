import { MessageSquare } from 'lucide-react';
import { DynamicPagination } from '@/components/common/dynamic-pagination';
import { ButtonLink } from '@/components/ui/button';
import { getInquiryPageViewModel } from '@/domains/inquiry';
import { currentUserRepository } from '@/domains/member';
import {
  MypageEmptyState,
  MypageFilterCard,
  MypageSectionHeader,
} from '@/features/mypage/common';
import { MypageInquiryList } from '@/features/mypage/inquiries';
import {
  buildInquiryListFilterHref,
  buildInquiryListHref,
  INQUIRY_LIST_FILTERS,
  parseInquiryListQuery,
  type InquiriesPageSearchParams,
} from './query';

interface InquiriesPageProps {
  searchParams: Promise<InquiriesPageSearchParams>;
}

async function InquiriesPage({ searchParams }: InquiriesPageProps) {
  const user = await currentUserRepository.findCurrent();
  const query = parseInquiryListQuery(await searchParams);
  const inquiryPageViewModel = user
    ? await getInquiryPageViewModel(user.id, query)
    : { items: [], currentPage: 1, totalPages: 1, totalItems: 0 };
  const { items: inquiries, currentPage, totalPages } = inquiryPageViewModel;

  return (
    <div className="space-y-8">
      <MypageSectionHeader
        title="1:1 문의 내역"
        action={
          <ButtonLink
            href="/cs/inquiry"
            size="lg"
            className="w-full bg-black font-bold text-white hover:bg-zinc-800 md:w-auto"
          >
            문의 작성
          </ButtonLink>
        }
      />
      <ButtonLink
        href="/cs/inquiry"
        size="lg"
        className="w-full bg-black font-bold text-white hover:bg-zinc-800 md:hidden"
      >
        문의 작성
      </ButtonLink>
      <MypageFilterCard
        filters={INQUIRY_LIST_FILTERS}
        values={{ type: query.type, status: query.status }}
        getHref={buildInquiryListFilterHref}
      />
      {inquiries.length > 0 ? (
        <MypageInquiryList inquiries={inquiries} />
      ) : (
        <MypageEmptyState
          icon={MessageSquare}
          title="문의 내역이 없습니다."
          description="상품, 주문, 배송과 관련해 궁금한 내용을 1:1 문의로 남겨보세요."
        />
      )}
      <DynamicPagination
        currentPage={currentPage}
        totalPages={totalPages}
        getPageHref={({ page }) =>
          buildInquiryListHref({ ...query, page })
        }
      />
    </div>
  );
}

export default InquiriesPage;
