import { PageTitle } from '@/shared/components/common/page-title';
import { toProductCardViewModel } from '@/domains/product';
import { ProductItem } from '@/features/product/product-item';
import { BEST_TABS } from '@/shared/lib/navigation';
import { products } from '@/domains/product';
import { Tabs } from '@/shared/components/common/tabs';
import { Container } from '@/shared/components/layout/container';

interface BestPageProps {
  searchParams: Promise<{
    period?: string;
  }>;
}

async function BestPage({ searchParams }: BestPageProps) {
  const { period } = await searchParams;
  const currentPeriod = period || 'daily';

  const sortKeyMap: Record<
    string,
    keyof (typeof products)[number]['productStats']
  > = {
    daily: 'toDaySales',
    weekly: 'weeklySales',
    monthly: 'monthlySales',
    total: 'totalSales',
  };

  const sortKey = sortKeyMap[currentPeriod] ?? 'totalSales';

  // 선택된 기간 기준 내림차순 정렬 (Top 20개만 노출)
  const bestProducts = [...products].sort(
    (a, b) => b.productStats[sortKey] - a.productStats[sortKey],
  );

  return (
    <Container className="mb-20 py-6 pt-28 md:py-10 md:pt-10">
      <PageTitle current="BEST" className="mb-0 hidden md:flex" />

      <Tabs
        tabs={BEST_TABS}
        queryKey="period"
        currentTab={currentPeriod}
        mobileLayout="fill"
        className="hidden md:sticky md:top-24 md:z-20 md:mb-12 md:flex md:border-b md:border-gray-200 md:bg-white md:px-0.5 md:py-4"
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5">
        {bestProducts.map((product, index) => {
          const rank = index + 1;

          return (
            <ProductItem
              key={product.id}
              product={toProductCardViewModel(product)}
              rank={rank}
            />
          );
        })}
      </div>
    </Container>
  );
}

export default BestPage;
