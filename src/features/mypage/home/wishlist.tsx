import { Heart } from 'lucide-react';
import type { ActivityProductViewModel } from '@/domains/activity';
import { MypageCompactEmptyState } from '../mypage-compact-empty-state';
import { MypageHomeProductPreview } from './product-preview';
import { MypageHomeSectionHeader } from './section-header';

interface MypageHomeWishlistProps {
  items: ActivityProductViewModel[];
}

export function MypageHomeWishlist({ items }: MypageHomeWishlistProps) {
  return (
    <section className="space-y-5">
      <MypageHomeSectionHeader
        title="관심 상품"
        icon={<Heart className="size-4" />}
        viewAllHref="/mypage/wishlist"
      />

      {items.length > 0 ? (
        <MypageHomeProductPreview items={items} ariaLabel="관심 상품" />
      ) : (
        <MypageCompactEmptyState
          title="관심 상품이 없습니다."
          description="관심 있는 상품을 저장하면 이곳에서 확인할 수 있습니다."
          action={{ href: '/best', label: '상품 보러 가기' }}
        />
      )}
    </section>
  );
}
