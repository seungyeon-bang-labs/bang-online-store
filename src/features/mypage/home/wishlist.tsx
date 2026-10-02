import type { ActivityProductViewModel } from '@/domains/activity';
import { SectionHeader } from '@/shared/components/common/section-header';
import { MypageEmptyState } from '../common';
import { MypageHomeProductPreview } from './product-preview';

interface MypageHomeWishlistProps {
  items: ActivityProductViewModel[];
}

export function MypageHomeWishlist({ items }: MypageHomeWishlistProps) {
  const hasWishlistProducts = items.length > 0;

  return (
    <section className="space-y-3 md:space-y-5">
      <SectionHeader
        title="관심 상품"
        viewAllHref="/mypage/wishlist"
      />

      {hasWishlistProducts ? (
        <MypageHomeProductPreview
          items={items}
          ariaLabel="관심 상품"
          isWishlisted
        />
      ) : (
        <MypageEmptyState
          title="관심 상품이 없습니다."
          description="관심 있는 상품을 저장하면 이곳에서 확인할 수 있습니다."
          action={{ href: '/best', label: '상품 보러 가기' }}
        />
      )}
    </section>
  );
}
