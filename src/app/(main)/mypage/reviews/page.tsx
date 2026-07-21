import { Star } from 'lucide-react';
import { DynamicPagination } from '@/components/common/dynamic-pagination';
import {
  getReviewPageViewModel,
  REVIEW_TABS,
} from '@/domains/activity';
import { currentUserRepository } from '@/domains/member';
import { MypageEmptyState } from '@/features/mypage/mypage-empty-state';
import { MypageFilterLinks } from '@/features/mypage/mypage-filter-links';
import { MypageReviewList } from '@/features/mypage/mypage-review-list';
import { MypageSectionHeader } from '@/features/mypage/mypage-section-header';
import {
  buildQueryHref,
  firstQueryValue,
  parsePositivePage,
  parseQueryOption,
} from '@/shared/lib/query';

interface ReviewsPageProps {
  searchParams: Promise<{
    tab?: string | string[];
    page?: string | string[];
  }>;
}

const REVIEW_TAB_LABELS: Record<(typeof REVIEW_TABS)[number], string> = {
  available: '작성 가능',
  completed: '작성 완료',
};

const REVIEW_TAB_LINKS = REVIEW_TABS.map(value => ({
  value,
  label: REVIEW_TAB_LABELS[value],
}));

async function ReviewsPage({ searchParams }: ReviewsPageProps) {
  const user = await currentUserRepository.findCurrent();
  const search = await searchParams;
  const tab = parseQueryOption({
    value: firstQueryValue(search.tab),
    options: REVIEW_TABS,
    fallback: 'available',
  });
  const result = user
    ? await getReviewPageViewModel(user.id, {
        tab,
        page: parsePositivePage(search.page),
      })
    : { items: [], currentPage: 1, totalPages: 1, totalItems: 0 };

  return (
    <div className="space-y-8">
      <MypageSectionHeader
        title="나의 리뷰"
        description="작성한 리뷰와 작성 가능한 리뷰를 확인할 수 있습니다."
      />
      <MypageFilterLinks
        label="리뷰 상태"
        options={REVIEW_TAB_LINKS}
        current={tab}
        getHref={nextTab =>
          buildQueryHref('/mypage/reviews', {
            tab: nextTab,
            page: 1,
          })
        }
      />
      {result.items.length > 0 ? (
        <MypageReviewList reviews={result.items} />
      ) : (
        <MypageEmptyState
          icon={Star}
          title={
            tab === 'available'
              ? '작성 가능한 리뷰가 없습니다.'
              : '작성한 리뷰가 없습니다.'
          }
          description={
            tab === 'available'
              ? '배송 완료된 상품이 생기면 리뷰를 작성할 수 있습니다.'
              : '구매한 상품에 리뷰를 남기면 이곳에서 확인할 수 있습니다.'
          }
        />
      )}
      <DynamicPagination
        currentPage={result.currentPage}
        totalPages={result.totalPages}
        getPageHref={({ page }) =>
          buildQueryHref('/mypage/reviews', { tab, page })
        }
      />
    </div>
  );
}

export default ReviewsPage;
