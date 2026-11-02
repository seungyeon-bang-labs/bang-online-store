import { Heart } from 'lucide-react';
import { DynamicPagination } from '@/shared/components/common/dynamic-pagination';
import { getWishlistPageViewModel } from '@/domains/activity';
import { currentUserRepository } from '@/domains/member';
import {
  MypagePageLayout,
  MypagePageHeader,
} from '@/features/mypage/common';
import { EmptyState } from '@/shared/components/common/empty-state';
import { WishlistProductGrid } from '@/features/mypage/activity';
import { buildQueryHref, parsePositivePage } from '@/shared/lib/query';

interface WishlistPageProps {
  searchParams: Promise<{
    page?: string | string[];
  }>;
}

async function WishlistPage({ searchParams }: WishlistPageProps) {
  const user = await currentUserRepository.findCurrent();
  const search = await searchParams;
  const wishlistPageViewModel = user
    ? await getWishlistPageViewModel(user.id, {
        page: parsePositivePage(search.page),
      })
    : { items: [], currentPage: 1, totalPages: 1, totalItems: 0 };
  const { items: wishlistProducts, currentPage, totalPages } =
    wishlistPageViewModel;

  const hasWishlistProducts = wishlistProducts.length > 0;

  return (
    <MypagePageLayout mobileSpacing="flush" fill={!hasWishlistProducts}>
      <MypagePageHeader title="관심 상품" />
      {hasWishlistProducts ? (
        <WishlistProductGrid items={wishlistProducts} />
      ) : (
        <EmptyState
          icon={Heart}
          title="관심 상품이 없습니다."
          description="상품의 하트 버튼을 누르면 관심 상품으로 저장됩니다."
          action={{ href: '/best', label: '상품 보러 가기' }}
          fill
        />
      )}
      {hasWishlistProducts && (
        <DynamicPagination
          currentPage={currentPage}
          totalPages={totalPages}
          getPageHref={({ page }) =>
            buildQueryHref('/mypage/wishlist', { page })
          }
        />
      )}
    </MypagePageLayout>
  );
}

export default WishlistPage;
