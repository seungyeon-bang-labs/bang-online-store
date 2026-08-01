import { RotateCcw } from 'lucide-react';
import { DynamicPagination } from '@/components/common/dynamic-pagination';
import { currentUserRepository } from '@/domains/member';
import { getOrderClaimListViewModel } from '@/domains/order';
import {
  MypageEmptyState,
  MypageFilterCard,
  MypageSectionHeader,
} from '@/features/mypage/common';
import { MypageClaimList } from '@/features/mypage/returns';
import {
  buildOrderClaimListFilterHref,
  buildOrderClaimListHref,
  ORDER_CLAIM_LIST_FILTERS,
  parseOrderClaimListQuery,
  type ReturnsPageSearchParams,
} from './query';

interface ReturnsPageProps {
  searchParams: Promise<ReturnsPageSearchParams>;
}

async function ReturnsPage({ searchParams }: ReturnsPageProps) {
  const user = await currentUserRepository.findCurrent();
  const query = parseOrderClaimListQuery(await searchParams);
  const claimListViewModel = user
    ? await getOrderClaimListViewModel(user.id, query)
    : { items: [], currentPage: 1, totalPages: 1, totalItems: 0 };
  const { items, currentPage, totalPages } = claimListViewModel;

  return (
    <div className="space-y-8">
      <MypageSectionHeader title="교환/반품 내역" />
      <MypageFilterCard
        filters={ORDER_CLAIM_LIST_FILTERS}
        values={{ type: query.type, status: query.status }}
        getHref={buildOrderClaimListFilterHref}
      />
      {items.length > 0 ? (
        <MypageClaimList claims={items} />
      ) : (
        <MypageEmptyState
          icon={RotateCcw}
          title="교환/반품 내역이 없습니다."
          description="처리 중인 요청이 생기면 이곳에서 진행 상태를 확인할 수 있습니다."
        />
      )}
      <DynamicPagination
        currentPage={currentPage}
        totalPages={totalPages}
        getPageHref={({ page }) =>
          buildOrderClaimListHref({ ...query, page })
        }
      />
    </div>
  );
}

export default ReturnsPage;
