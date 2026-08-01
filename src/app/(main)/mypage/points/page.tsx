import { Wallet } from 'lucide-react';
import { DynamicPagination } from '@/components/common/dynamic-pagination';
import {
  POINT_TYPE_FILTERS,
  pointTransactionRepository,
  toPointPageViewModel,
} from '@/domains/benefit';
import { currentUserRepository } from '@/domains/member';
import {
  MypageEmptyState,
  MypageFilterLinks,
  MypageSectionHeader,
} from '@/features/mypage/common';
import { MypagePointList } from '@/features/mypage/mypage-point-list';
import {
  buildQueryHref,
  firstQueryValue,
  parsePositivePage,
  parseQueryOption,
} from '@/shared/lib/query';

interface PointsPageProps {
  searchParams: Promise<{
    type?: string | string[];
    page?: string | string[];
  }>;
}

const POINT_TYPE_LABELS: Record<
  (typeof POINT_TYPE_FILTERS)[number],
  string
> = {
  all: '전체',
  earn: '적립',
  use: '사용',
  expire: '소멸',
};

const POINT_TYPE_LINKS = POINT_TYPE_FILTERS.map(value => ({
  value,
  label: POINT_TYPE_LABELS[value],
}));

async function PointsPage({ searchParams }: PointsPageProps) {
  const user = await currentUserRepository.findCurrent();
  const search = await searchParams;
  const pointType = parseQueryOption({
    value: firstQueryValue(search.type),
    options: POINT_TYPE_FILTERS,
    fallback: 'all',
  });
  const rows = user
    ? await pointTransactionRepository.findByUserId(user.id)
    : [];
  const result = user
    ? toPointPageViewModel(rows, {
        type: pointType,
        page: parsePositivePage(search.page),
      })
    : {
        items: [],
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        balanceText: '0 P',
        earnedThisMonthText: '0 P',
        expiringText: '0 P',
      };

  return (
    <div className="space-y-8">
      <MypageSectionHeader title="적립금 내역" />
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: '사용 가능 적립금', value: result.balanceText },
          { label: '이번 달 적립', value: result.earnedThisMonthText },
          { label: '소멸 예정', value: result.expiringText },
        ].map(item => (
          <div
            key={item.label}
            className="rounded-md border border-zinc-300 bg-white p-5"
          >
            <p className="text-sm font-bold text-zinc-500">{item.label}</p>
            <p className="mt-3 text-2xl font-black text-black">
              {item.value}
            </p>
          </div>
        ))}
      </section>
      <MypageFilterLinks
        label="적립금 유형"
        options={POINT_TYPE_LINKS}
        current={pointType}
        getHref={nextType =>
          buildQueryHref('/mypage/points', {
            type: nextType,
            page: 1,
          })
        }
      />
      {result.items.length > 0 ? (
        <MypagePointList transactions={result.items} />
      ) : (
        <MypageEmptyState
          icon={Wallet}
          title="조건에 맞는 적립금 내역이 없습니다."
          description="적립금 유형을 변경해 지급, 사용, 소멸 내역을 확인해 주세요."
        />
      )}
      <DynamicPagination
        currentPage={result.currentPage}
        totalPages={result.totalPages}
        getPageHref={({ page }) =>
          buildQueryHref('/mypage/points', { type: pointType, page })
        }
      />
    </div>
  );
}

export default PointsPage;
