import { PackageSearch } from 'lucide-react';
import { DynamicPagination } from '@/shared/components/common/dynamic-pagination';
import { currentUserRepository } from '@/domains/member';
import { getMypageOrderListViewModel } from '@/domains/mypage';
import {
  MypageEmptyState,
  MypageFilterCard,
  MypageFilterEmptyState,
  MypagePageLayout,
  MypagePageHeader,
} from '@/features/mypage/common';
import {
  MypageOrderCardList,
  MypageOrderPartialCancellationToggle,
} from '@/features/mypage/orders';
import { waitForMypageLoadingForDevelopment } from '@/shared/lib/development';
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
  await waitForMypageLoadingForDevelopment();

  const user = await currentUserRepository.findCurrent();
  const query = parseOrderListQuery(await searchParams);

  const orderListViewModel = user
    ? await getMypageOrderListViewModel(user.id, query)
    : {
        items: [],
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        unfilteredItemCount: 0,
      };

  const { items, currentPage, totalPages, unfilteredItemCount } =
    orderListViewModel;

  const hasFilteredOrders = items.length > 0;
  const hasAnyOrders = unfilteredItemCount > 0;
  const isFilterResultEmpty = hasAnyOrders && !hasFilteredOrders;

  return (
    <MypagePageLayout fill>
      <MypagePageHeader title="주문 내역" />
      <MypageFilterCard
        filters={ORDER_LIST_FILTERS}
        values={{
          period: query.period,
          status: query.status,
          includePartialCancellation: String(query.includePartialCancellation),
        }}
        getHref={buildOrderListFilterHref}
        mobileToggles={[
          {
            id: 'includePartialCancellation',
            label: '주문한 상품 중 취소한 상품이 있는 주문도 보기',
            visibleWhen: { filterId: 'status', value: 'cancelled' },
          },
        ]}
      >
        {query.status === 'cancelled' ? (
          <MypageOrderPartialCancellationToggle
            checked={query.includePartialCancellation}
            href={buildOrderListHref({
              ...query,
              includePartialCancellation: !query.includePartialCancellation,
              page: 1,
            })}
          />
        ) : null}
      </MypageFilterCard>
      {hasFilteredOrders ? (
        <MypageOrderCardList orders={items} />
      ) : isFilterResultEmpty ? (
        <MypageFilterEmptyState
          resetHref={buildOrderListHref({
            period: 'all',
            status: 'all',
            includePartialCancellation: false,
            page: 1,
          })}
        />
      ) : (
        <MypageEmptyState
          icon={PackageSearch}
          title="주문 내역이 없습니다."
          description="상품을 주문하면 이곳에서 주문 및 배송 상태를 확인할 수 있습니다."
          action={{ href: '/new', label: '상품 보러 가기' }}
          fill
        />
      )}
      {hasFilteredOrders && (
        <DynamicPagination
          currentPage={currentPage}
          totalPages={totalPages}
          getPageHref={({ page }) => buildOrderListHref({ ...query, page })}
        />
      )}
    </MypagePageLayout>
  );
}

export default OrdersPage;
