import { Wallet } from 'lucide-react';
import { DynamicPagination } from '@/shared/components/common/dynamic-pagination';
import { currentUserRepository } from '@/domains/member';
import { getMypagePointPageViewModel } from '@/domains/mypage';
import {
  MypageEmptyState,
  MypageFilterCard,
  MypageFilterEmptyState,
  MypagePageLayout,
  MypagePageHeader,
} from '@/features/mypage/common';
import {
  MypagePointSummary,
  MypagePointTransactionList,
} from '@/features/mypage/points';
import {
  buildPointListFilterHref,
  buildPointListHref,
  parsePointListQuery,
  POINT_LIST_FILTERS,
  type PointsPageSearchParams,
} from './query';

interface PointsPageProps {
  searchParams: Promise<PointsPageSearchParams>;
}

async function PointsPage({ searchParams }: PointsPageProps) {
  const user = await currentUserRepository.findCurrent();
  const query = parsePointListQuery(await searchParams);
  const pointPage = user
    ? await getMypagePointPageViewModel(user, {
        filter: query.filter,
        page: query.page,
      })
    : {
        summary: {
          balanceText: '0 P',
          earnedThisMonthText: '0 P',
          expiringDateText: null,
          expiringText: '0 P',
        },
        transactionList: {
          dateGroups: [],
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          unfilteredItemCount: 0,
        },
      };
  const { summary, transactionList } = pointPage;
  const { dateGroups, currentPage, totalPages, unfilteredItemCount } =
    transactionList;

  const hasFilteredPointTransactions = dateGroups.length > 0;
  const hasAnyPointTransactions = unfilteredItemCount > 0;
  const isFilterResultEmpty =
    hasAnyPointTransactions && !hasFilteredPointTransactions;

  return (
    <MypagePageLayout fill>
      <MypagePageHeader title="적립금 내역" />
      <div className="-mt-5 md:mt-0">
        <MypagePointSummary summary={summary} />
      </div>
      <MypageFilterCard
        filters={POINT_LIST_FILTERS}
        values={{ filter: query.filter }}
        getHref={buildPointListFilterHref}
        desktopLayout="chips"
      />
      {hasFilteredPointTransactions ? (
        <MypagePointTransactionList dateGroups={dateGroups} />
      ) : isFilterResultEmpty ? (
        <MypageFilterEmptyState
          resetHref={buildPointListHref({ filter: 'all', page: 1 })}
        />
      ) : (
        <MypageEmptyState
          icon={Wallet}
          title="적립금 내역이 없습니다."
          description="적립금이 지급되거나 사용되면 이곳에서 내역을 확인할 수 있습니다."
          fill
        />
      )}
      {hasFilteredPointTransactions && (
        <DynamicPagination
          currentPage={currentPage}
          totalPages={totalPages}
          getPageHref={({ page }) => buildPointListHref({ ...query, page })}
        />
      )}
    </MypagePageLayout>
  );
}

export default PointsPage;
