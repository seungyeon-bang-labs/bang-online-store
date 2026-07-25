import { Clock3 } from 'lucide-react';
import { DynamicPagination } from '@/components/common/dynamic-pagination';
import { getRecentProductItems } from '@/domains/activity';
import { currentUserRepository } from '@/domains/member';
import { paginate } from '@/shared/lib/pagination';
import { MypageEmptyState } from '@/features/mypage/mypage-empty-state';
import { MypageSectionHeader } from '@/features/mypage/mypage-section-header';
import { ProductItem } from '@/features/product/product-item';
import { buildQueryHref, parsePositivePage } from '@/shared/lib/query';

interface RecentProductsPageProps {
  searchParams: Promise<{
    page?: string | string[];
  }>;
}

async function RecentProductsPage({
  searchParams,
}: RecentProductsPageProps) {
  const user = await currentUserRepository.findCurrent();
  const search = await searchParams;
  const items = user ? await getRecentProductItems(user.id) : [];
  const result = paginate(items, parsePositivePage(search.page), 10);

  return (
    <div className="space-y-8">
      <MypageSectionHeader
        title="최근 본 상품"
        description="최근 확인한 상품을 다시 찾아볼 수 있습니다."
      />
      {result.items.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {result.items.map(item => (
            <ProductItem
              key={item.id}
              product={item.product}
              showWishlistButton={false}
            />
          ))}
        </div>
      ) : (
        <MypageEmptyState
          icon={Clock3}
          title="최근 본 상품이 없습니다."
          description="상품 상세 페이지를 확인하면 최근 본 상품으로 기록됩니다."
        />
      )}
      <DynamicPagination
        currentPage={result.currentPage}
        totalPages={result.totalPages}
        getPageHref={({ page }) =>
          buildQueryHref('/mypage/recent', { page })
        }
      />
    </div>
  );
}

export default RecentProductsPage;
