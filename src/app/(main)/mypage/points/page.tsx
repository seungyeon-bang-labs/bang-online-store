import { Wallet } from 'lucide-react';
import { DynamicPagination } from '@/components/common/dynamic-pagination';
import { currentUserRepository } from '@/domains/member';
import { getMypagePointPageViewModel } from '@/domains/mypage';
import {
  MypageEmptyState,
  MypageFilterCard,
  MypageFilterEmptyState,
  MypageSectionHeader,
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
  const hasItems = dateGroups.length > 0;
  const isFilterResultEmpty = !hasItems && unfilteredItemCount > 0;

  return (
    <div
      className={
        isFilterResultEmpty ? 'flex flex-col gap-8 md:h-full' : 'space-y-8'
      }
    >
      <MypageSectionHeader title="적립금 내역" />
      <MypagePointSummary summary={summary} />
      <MypageFilterCard
        filters={POINT_LIST_FILTERS}
        values={{ filter: query.filter }}
        getHref={buildPointListFilterHref}
      />
      {hasItems ? (
        <MypagePointTransactionList dateGroups={dateGroups} />
      ) : isFilterResultEmpty ? (
        <MypageFilterEmptyState
          resetHref={buildPointListHref({ filter: 'all', page: 1 })}
          className="flex-1"
        />
      ) : (
        <MypageEmptyState
          icon={Wallet}
          title="조건에 맞는 적립금 내역이 없습니다."
          description="적립금 유형을 변경해 지급, 사용, 소멸 내역을 확인해 주세요."
        />
      )}
      {hasItems && (
        <DynamicPagination
          currentPage={currentPage}
          totalPages={totalPages}
          getPageHref={({ page }) => buildPointListHref({ ...query, page })}
        />
      )}
    </div>
  );
}

export default PointsPage;
