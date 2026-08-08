import { Star } from 'lucide-react';
import { DynamicPagination } from '@/components/common/dynamic-pagination';
import { getReviewPageViewModel } from '@/domains/activity';
import { currentUserRepository } from '@/domains/member';
import {
  MypageEmptyState,
  MypageFilterCard,
  MypageSectionHeader,
} from '@/features/mypage/common';
import { MypageReviewList } from '@/features/mypage/reviews';
import {
  buildReviewListFilterHref,
  buildReviewListHref,
  getReviewListFilters,
  parseReviewListQuery,
  type ReviewsPageSearchParams,
} from './query';

interface ReviewsPageProps {
  searchParams: Promise<ReviewsPageSearchParams>;
}

async function ReviewsPage({ searchParams }: ReviewsPageProps) {
  const user = await currentUserRepository.findCurrent();
  const search = await searchParams;
  const query = parseReviewListQuery(search);
  const reviewPageViewModel = user
    ? await getReviewPageViewModel(user.id, query)
    : {
        items: [],
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        availableCount: 0,
      };
  const { items: reviews, currentPage, totalPages, availableCount } =
    reviewPageViewModel;

  return (
    <div className="space-y-8">
      <MypageSectionHeader title="나의 리뷰" />
      <MypageFilterCard
        filters={getReviewListFilters(availableCount)}
        values={{ tab: query.tab }}
        getHref={buildReviewListFilterHref}
      />
      {reviews.length > 0 ? (
        <MypageReviewList reviews={reviews} />
      ) : (
        <MypageEmptyState
          icon={Star}
          title={
            query.tab === 'available'
              ? '작성 가능한 리뷰가 없습니다.'
              : '작성한 리뷰가 없습니다.'
          }
          description={
            query.tab === 'available'
              ? '배송 완료된 상품이 생기면 리뷰를 작성할 수 있습니다.'
              : '구매한 상품에 리뷰를 남기면 이곳에서 확인할 수 있습니다.'
          }
        />
      )}
      <DynamicPagination
        currentPage={currentPage}
        totalPages={totalPages}
        getPageHref={({ page }) =>
          buildReviewListHref({ tab: query.tab, page })
        }
      />
    </div>
  );
}

export default ReviewsPage;
