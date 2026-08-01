import { PackageSearch } from 'lucide-react';
import { DynamicPagination } from '@/components/common/dynamic-pagination';
import { currentUserRepository } from '@/domains/member';
import { getOrderListViewModel } from '@/domains/order';
import {
  MypageEmptyState,
  MypageFilterCard,
  MypageSectionHeader,
} from '@/features/mypage/common';
import { MypageOrderList } from '@/features/mypage/orders';
import {
  buildOrderListFilterHref,
  buildOrderListHref,
  ORDER_LIST_FILTERS,
  parseOrderListQuery,
  type OrdersPageSearchParams,
} from './query';

interface OrdersPageProps {
  searchParams: Promise<OrdersPageSearchParams>;
}

async function OrdersPage({ searchParams }: OrdersPageProps) {
  const user = await currentUserRepository.findCurrent();
  const query = parseOrderListQuery(await searchParams);

  const orderListViewModel = user
    ? await getOrderListViewModel(user.id, query)
    : { items: [], currentPage: 1, totalPages: 1, totalItems: 0 };

  const { items, currentPage, totalPages } = orderListViewModel;

  return (
    <div className="space-y-8">
      <MypageSectionHeader title="주문 내역" />
      <MypageFilterCard
        filters={ORDER_LIST_FILTERS}
        values={{ period: query.period, status: query.status }}
        getHref={buildOrderListFilterHref}
      />
      {items.length > 0 ? (
        <MypageOrderList orders={items} />
      ) : (
        <MypageEmptyState
          icon={PackageSearch}
          title="조건에 맞는 주문 내역이 없습니다."
          description="조회 기간과 주문 상태를 변경해 확인해 주세요."
        />
      )}
      <DynamicPagination
        currentPage={currentPage}
        totalPages={totalPages}
        getPageHref={({ page }) => buildOrderListHref({ ...query, page })}
      />
    </div>
  );
}

export default OrdersPage;
