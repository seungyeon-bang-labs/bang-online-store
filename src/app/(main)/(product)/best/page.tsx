import { PageTitle } from '@/components/common/page-title';
import { toProductCardViewModel } from '@/domains/product';
import { ProductItem } from '@/features/product/product-item';
import { BEST_TABS } from '@/lib/navigation';
import { products } from '@/lib/products-data';
import { Tabs } from '@/components/common/tabs';
import { Container } from '@/components/layout/container';

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
    <Container>
      <PageTitle current="BEST" className='mb-0' />

      <Tabs
        tabs={BEST_TABS}
        queryKey="period"
        currentTab={currentPeriod}
        className="mb-12 py-4 sticky top-24 z-20 -mx-0.5 px-0.5 bg-white border-b border-gray-200"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
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
