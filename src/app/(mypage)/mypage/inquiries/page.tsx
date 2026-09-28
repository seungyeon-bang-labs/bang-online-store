import { MessageSquare } from 'lucide-react';
import { DynamicPagination } from '@/shared/components/common/dynamic-pagination';
import { getInquiryPageViewModel } from '@/domains/inquiry';
import { currentUserRepository } from '@/domains/member';
import {
  MypageEmptyState,
  MypageFilterCard,
  MypageFilterEmptyState,
  MypagePageLayout,
  MypagePageHeader,
} from '@/features/mypage/common';
import { MypageInquiryList } from '@/features/mypage/inquiries';
import { getMypageInquiryWriteHref } from '@/shared/lib/mypage-routes';
import {
  buildInquiryListFilterHref,
  buildInquiryListHref,
  INQUIRY_LIST_FILTERS,
  parseInquiryListQuery,
  type InquiriesPageSearchParams,
} from './query';
import { cancelMypageInquiryAction } from './actions';

interface InquiriesPageProps {
  searchParams: Promise<InquiriesPageSearchParams>;
}

async function InquiriesPage({ searchParams }: InquiriesPageProps) {
  const user = await currentUserRepository.findCurrent();
  const query = parseInquiryListQuery(await searchParams);
  const inquiryPageViewModel = user
    ? await getInquiryPageViewModel(user.id, query)
    : {
        items: [],
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        unfilteredItemCount: 0,
      };
  const { items: inquiries, currentPage, totalPages, unfilteredItemCount } =
    inquiryPageViewModel;
  const inquiryListHref = buildInquiryListHref(query);

  const hasFilteredInquiries = inquiries.length > 0;
  const hasAnyInquiries = unfilteredItemCount > 0;
  const isFilterResultEmpty = hasAnyInquiries && !hasFilteredInquiries;

  return (
    <MypagePageLayout fill>
      <MypagePageHeader
        title="1:1 문의 내역"
        action={{
          href: getMypageInquiryWriteHref({ returnTo: inquiryListHref }),
          label: '문의 작성',
          mobilePlacement: 'header',
        }}
      />
      <MypageFilterCard
        filters={INQUIRY_LIST_FILTERS}
        values={{ type: query.type, status: query.status }}
        getHref={buildInquiryListFilterHref}
      />
      {hasFilteredInquiries ? (
        <MypageInquiryList
          inquiries={inquiries}
          returnHref={inquiryListHref}
          cancelInquiryAction={cancelMypageInquiryAction}
        />
      ) : isFilterResultEmpty ? (
        <MypageFilterEmptyState
          resetHref={buildInquiryListHref({
            type: 'all',
            status: 'all',
            page: 1,
          })}
        />
      ) : (
        <MypageEmptyState
          icon={MessageSquare}
          title="문의 내역이 없습니다."
          description="상품, 주문, 배송과 관련해 궁금한 내용을 1:1 문의로 남겨보세요."
          fill
        />
      )}
      {hasFilteredInquiries && (
        <DynamicPagination
          currentPage={currentPage}
          totalPages={totalPages}
          getPageHref={({ page }) =>
            buildInquiryListHref({ ...query, page })
          }
        />
      )}
    </MypagePageLayout>
  );
}

export default InquiriesPage;
