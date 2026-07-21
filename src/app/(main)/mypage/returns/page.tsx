import { RotateCcw } from 'lucide-react';
import { DynamicPagination } from '@/components/common/dynamic-pagination';
import { currentUserRepository } from '@/domains/member';
import {
  getOrderClaimListViewModel,
  ORDER_CLAIM_STATUS_FILTERS,
  ORDER_CLAIM_TYPE_FILTERS,
  toOrderClaimStatusViewModel,
  toOrderClaimTypeViewModel,
} from '@/domains/order';
import { MypageClaimList } from '@/features/mypage/mypage-claim-list';
import { MypageEmptyState } from '@/features/mypage/mypage-empty-state';
import { MypageFilterLinks } from '@/features/mypage/mypage-filter-links';
import { MypageSectionHeader } from '@/features/mypage/mypage-section-header';
import {
  buildQueryHref,
  firstQueryValue,
  parsePositivePage,
  parseQueryOption,
} from '@/shared/lib/query';

interface ReturnsPageProps {
  searchParams: Promise<{
    type?: string | string[];
    status?: string | string[];
    page?: string | string[];
  }>;
}

const ORDER_CLAIM_TYPE_LINKS = ORDER_CLAIM_TYPE_FILTERS.map(value => ({
  value,
  label: value === 'all' ? '전체' : toOrderClaimTypeViewModel(value).label,
}));

const ORDER_CLAIM_STATUS_LINKS = ORDER_CLAIM_STATUS_FILTERS.map(value => ({
  value,
  label: value === 'all' ? '전체' : toOrderClaimStatusViewModel(value).label,
}));

async function ReturnsPage({ searchParams }: ReturnsPageProps) {
  const user = await currentUserRepository.findCurrent();
  const search = await searchParams;
  const type = parseQueryOption({
    value: firstQueryValue(search.type),
    options: ORDER_CLAIM_TYPE_FILTERS,
    fallback: 'all',
  });
  const status = parseQueryOption({
    value: firstQueryValue(search.status),
    options: ORDER_CLAIM_STATUS_FILTERS,
    fallback: 'all',
  });
  const result = user
    ? await getOrderClaimListViewModel(user.id, {
        type,
        status,
        page: parsePositivePage(search.page),
      })
    : { items: [], currentPage: 1, totalPages: 1, totalItems: 0 };

  return (
    <div className="space-y-8">
      <MypageSectionHeader
        title="취소/교환/반품 내역"
        description="주문 취소, 교환, 반품 신청 내역과 처리 상태를 확인할 수 있습니다."
      />
      <MypageFilterLinks
        label="요청 유형"
        options={ORDER_CLAIM_TYPE_LINKS}
        current={type}
        getHref={nextType =>
          buildQueryHref('/mypage/returns', {
            type: nextType,
            status,
            page: 1,
          })
        }
      />
      <MypageFilterLinks
        label="처리 상태"
        options={ORDER_CLAIM_STATUS_LINKS}
        current={status}
        getHref={nextStatus =>
          buildQueryHref('/mypage/returns', {
            type,
            status: nextStatus,
            page: 1,
          })
        }
      />
      {result.items.length > 0 ? (
        <MypageClaimList claims={result.items} />
      ) : (
        <MypageEmptyState
          icon={RotateCcw}
          title="취소/교환/반품 내역이 없습니다."
          description="처리 중인 요청이 생기면 이곳에서 진행 상태를 확인할 수 있습니다."
        />
      )}
      <DynamicPagination
        currentPage={result.currentPage}
        totalPages={result.totalPages}
        getPageHref={({ page }) =>
          buildQueryHref('/mypage/returns', { type, status, page })
        }
      />
    </div>
  );
}

export default ReturnsPage;
