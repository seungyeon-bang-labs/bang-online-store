import { Heart } from 'lucide-react';
import { DynamicPagination } from '@/components/common/dynamic-pagination';
import { getWishlistProductItems } from '@/domains/activity';
import { currentUserRepository } from '@/domains/member';
import { paginate } from '@/shared/lib/pagination';
import { MypageEmptyState } from '@/features/mypage/mypage-empty-state';
import { MypageSectionHeader } from '@/features/mypage/mypage-section-header';
import { ProductItem } from '@/features/product/product-item';
import { buildQueryHref, parsePositivePage } from '@/shared/lib/query';

interface WishlistPageProps {
  searchParams: Promise<{
    page?: string | string[];
  }>;
}

async function WishlistPage({ searchParams }: WishlistPageProps) {
  const user = await currentUserRepository.findCurrent();
  const search = await searchParams;
  const items = user ? await getWishlistProductItems(user.id) : [];
  const result = paginate(items, parsePositivePage(search.page), 10);

  return (
    <div className="space-y-8">
      <MypageSectionHeader
        title="관심 상품"
        description="관심 상품으로 저장한 상품을 모아볼 수 있습니다."
      />
      {result.items.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {result.items.map(item => (
            <ProductItem
              key={item.id}
              product={item.product}
              isWishlisted
            />
          ))}
        </div>
      ) : (
        <MypageEmptyState
          icon={Heart}
          title="관심 상품이 없습니다."
          description="상품의 하트 버튼을 누르면 관심 상품으로 저장됩니다."
        />
      )}
      <DynamicPagination
        currentPage={result.currentPage}
        totalPages={result.totalPages}
        getPageHref={({ page }) =>
          buildQueryHref('/mypage/wishlist', { page })
        }
      />
    </div>
  );
}

export default WishlistPage;
