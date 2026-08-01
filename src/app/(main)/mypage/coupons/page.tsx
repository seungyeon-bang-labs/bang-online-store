import { Ticket } from 'lucide-react';
import { DynamicPagination } from '@/components/common/dynamic-pagination';
import {
  getUserCouponPageViewModel,
  USER_COUPON_TABS,
} from '@/domains/benefit';
import { currentUserRepository } from '@/domains/member';
import { MypageCouponList } from '@/features/mypage/mypage-coupon-list';
import {
  MypageEmptyState,
  MypageFilterLinks,
  MypageSectionHeader,
} from '@/features/mypage/common';
import {
  buildQueryHref,
  firstQueryValue,
  parsePositivePage,
  parseQueryOption,
} from '@/shared/lib/query';

interface CouponsPageProps {
  searchParams: Promise<{
    tab?: string | string[];
    page?: string | string[];
  }>;
}

const USER_COUPON_TAB_LABELS: Record<
  (typeof USER_COUPON_TABS)[number],
  string
> = {
  available: '사용 가능',
  used: '사용 완료',
  expired: '기간 만료',
};

const USER_COUPON_TAB_LINKS = USER_COUPON_TABS.map(value => ({
  value,
  label: USER_COUPON_TAB_LABELS[value],
}));

async function CouponsPage({ searchParams }: CouponsPageProps) {
  const user = await currentUserRepository.findCurrent();
  const search = await searchParams;
  const tab = parseQueryOption({
    value: firstQueryValue(search.tab),
    options: USER_COUPON_TABS,
    fallback: 'available',
  });
  const result = user
    ? await getUserCouponPageViewModel(user.id, {
        tab,
        page: parsePositivePage(search.page),
      })
    : { items: [], currentPage: 1, totalPages: 1, totalItems: 0 };

  return (
    <div className="space-y-8">
      <MypageSectionHeader title="쿠폰함" />
      <MypageFilterLinks
        label="쿠폰 상태"
        options={USER_COUPON_TAB_LINKS}
        current={tab}
        getHref={nextTab =>
          buildQueryHref('/mypage/coupons', {
            tab: nextTab,
            page: 1,
          })
        }
      />
      {result.items.length > 0 ? (
        <MypageCouponList coupons={result.items} />
      ) : (
        <MypageEmptyState
          icon={Ticket}
          title="조건에 맞는 쿠폰이 없습니다."
          description="쿠폰 상태를 변경해 보유 쿠폰 내역을 확인해 주세요."
        />
      )}
      <DynamicPagination
        currentPage={result.currentPage}
        totalPages={result.totalPages}
        getPageHref={({ page }) =>
          buildQueryHref('/mypage/coupons', { tab, page })
        }
      />
    </div>
  );
}

export default CouponsPage;
