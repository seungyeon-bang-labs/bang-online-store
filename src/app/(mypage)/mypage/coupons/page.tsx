import { Ticket } from 'lucide-react';
import { DynamicPagination } from '@/shared/components/common/dynamic-pagination';
import { getUserCouponListViewModel } from '@/domains/benefit';
import { currentUserRepository } from '@/domains/member';
import {
  MypageEmptyState,
  MypageFilterCard,
  MypageFilterEmptyState,
  MypagePageLayout,
  MypagePageHeader,
} from '@/features/mypage/common';
import { MypageCouponList } from '@/features/mypage/coupons';
import {
  buildCouponListFilterHref,
  buildCouponListHref,
  parseCouponListQuery,
  USER_COUPON_FILTERS,
  type CouponsPageSearchParams,
} from './query';

interface CouponsPageProps {
  searchParams: Promise<CouponsPageSearchParams>;
}

async function CouponsPage({ searchParams }: CouponsPageProps) {
  const user = await currentUserRepository.findCurrent();
  const query = parseCouponListQuery(await searchParams);
  const couponList = user
    ? await getUserCouponListViewModel(user.id, query)
    : {
        coupons: [],
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        unfilteredItemCount: 0,
      };
  const { coupons, currentPage, totalPages, unfilteredItemCount } = couponList;

  const hasFilteredCoupons = coupons.length > 0;
  const hasAnyCoupons = unfilteredItemCount > 0;
  const isFilterResultEmpty = hasAnyCoupons && !hasFilteredCoupons;

  return (
    <MypagePageLayout fill>
      <MypagePageHeader title="쿠폰함" />
      <MypageFilterCard
        filters={USER_COUPON_FILTERS}
        values={{ tab: query.tab }}
        getHref={buildCouponListFilterHref}
        desktopLayout="chips"
      />
      {hasFilteredCoupons ? (
        <MypageCouponList coupons={coupons} />
      ) : isFilterResultEmpty ? (
        <MypageFilterEmptyState
          resetHref={buildCouponListHref({ tab: 'all', page: 1 })}
        />
      ) : (
        <MypageEmptyState
          icon={Ticket}
          title="보유한 쿠폰이 없습니다."
          description="쿠폰을 발급받으면 이곳에서 쿠폰 내역을 확인할 수 있습니다."
          fill
        />
      )}
      {hasFilteredCoupons && (
        <DynamicPagination
          currentPage={currentPage}
          totalPages={totalPages}
          getPageHref={({ page }) => buildCouponListHref({ ...query, page })}
        />
      )}
    </MypagePageLayout>
  );
}

export default CouponsPage;
