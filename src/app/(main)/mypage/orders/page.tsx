import { PackageSearch } from 'lucide-react';
import { DynamicPagination } from '@/components/common/dynamic-pagination';
import { currentUserRepository } from '@/domains/member';
import {
  getOrderListViewModel,
  ORDER_PERIODS,
  ORDER_STATUS_FILTERS,
  toOrderStatusViewModel,
} from '@/domains/order';
import { MypageEmptyState } from '@/features/mypage/mypage-empty-state';
import { MypageFilterLinks } from '@/features/mypage/mypage-filter-links';
import { MypageOrderList } from '@/features/mypage/mypage-order-list';
import { MypageSectionHeader } from '@/features/mypage/mypage-section-header';
import {
  buildQueryHref,
  firstQueryValue,
  parsePositivePage,
  parseQueryOption,
} from '@/shared/lib/query';

interface OrdersPageProps {
  searchParams: Promise<{
    period?: string | string[];
    status?: string | string[];
    page?: string | string[];
  }>;
}

const ORDER_PERIOD_LINKS = [
  { value: '1-month', label: '1개월' },
  { value: '3-months', label: '3개월' },
  { value: '6-months', label: '6개월' },
  { value: '12-months', label: '12개월' },
  { value: 'all', label: '전체' },
] as const;

const ORDER_STATUS_LINKS = ORDER_STATUS_FILTERS.map(value => ({
  value,
  label: value === 'all' ? '전체' : toOrderStatusViewModel(value).label,
}));

async function OrdersPage({ searchParams }: OrdersPageProps) {
  const user = await currentUserRepository.findCurrent();
  const search = await searchParams;
  const period = parseQueryOption({
    value: firstQueryValue(search.period),
    options: ORDER_PERIODS,
    fallback: '3-months',
  });
  const status = parseQueryOption({
    value: firstQueryValue(search.status),
    options: ORDER_STATUS_FILTERS,
    fallback: 'all',
  });
  const result = user
    ? await getOrderListViewModel(user.id, {
        period,
        status,
        page: parsePositivePage(search.page),
      })
    : { items: [], currentPage: 1, totalPages: 1, totalItems: 0 };

  return (
    <div className="space-y-8">
      <MypageSectionHeader
        title="주문/배송 조회"
        description="최근 주문 내역과 배송 진행 상태를 확인할 수 있습니다."
      />
      <MypageFilterLinks
        label="조회 기간"
        options={ORDER_PERIOD_LINKS}
        current={period}
        getHref={nextPeriod =>
          buildQueryHref('/mypage/orders', {
            period: nextPeriod,
            status,
            page: 1,
          })
        }
      />
      <MypageFilterLinks
        label="주문 상태"
        options={ORDER_STATUS_LINKS}
        current={status}
        getHref={nextStatus =>
          buildQueryHref('/mypage/orders', {
            period,
            status: nextStatus,
            page: 1,
          })
        }
      />
      {result.items.length > 0 ? (
        <MypageOrderList orders={result.items} />
      ) : (
        <MypageEmptyState
          icon={PackageSearch}
          title="조건에 맞는 주문 내역이 없습니다."
          description="조회 기간과 주문 상태를 변경해 확인해 주세요."
        />
      )}
      <DynamicPagination
        currentPage={result.currentPage}
        totalPages={result.totalPages}
        getPageHref={({ page }) =>
          buildQueryHref('/mypage/orders', { period, status, page })
        }
      />
    </div>
  );
}

export default OrdersPage;
