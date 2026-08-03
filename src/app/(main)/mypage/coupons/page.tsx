import { Ticket } from 'lucide-react';
import { DynamicPagination } from '@/components/common/dynamic-pagination';
import {
  getUserCouponListViewModel,
} from '@/domains/benefit';
import { currentUserRepository } from '@/domains/member';
import {
  MypageEmptyState,
  MypageFilterCard,
  MypageSectionHeader,
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
    : { coupons: [], currentPage: 1, totalPages: 1, totalItems: 0 };
  const { coupons, currentPage, totalPages } = couponList;

  return (
    <div className="space-y-8">
      <MypageSectionHeader title="쿠폰함" />
      <MypageFilterCard
        filters={USER_COUPON_FILTERS}
        values={{ tab: query.tab }}
        getHref={buildCouponListFilterHref}
      />
      {coupons.length > 0 ? (
        <MypageCouponList coupons={coupons} />
      ) : (
        <MypageEmptyState
          icon={Ticket}
          title="조건에 맞는 쿠폰이 없습니다."
          description="쿠폰 상태를 변경해 보유 쿠폰 내역을 확인해 주세요."
        />
      )}
      <DynamicPagination
        currentPage={currentPage}
        totalPages={totalPages}
        getPageHref={({ page }) => buildCouponListHref({ ...query, page })}
      />
    </div>
  );
}

export default CouponsPage;
