import type { ActivityProductViewModel } from '@/domains/activity';
import { SectionHeader } from '@/shared/components/common/section-header';
import { MypageEmptyState } from '../common';
import { MypageHomeProductPreview } from './product-preview';

interface MypageHomeRecentProductsProps {
  items: ActivityProductViewModel[];
}

export function MypageHomeRecentProducts({
  items,
}: MypageHomeRecentProductsProps) {
  const hasRecentProducts = items.length > 0;

  return (
    <section className="space-y-3 md:space-y-5">
      <SectionHeader
        title="최근 본 상품"
        viewAllHref="/mypage/recent"
      />

      {hasRecentProducts ? (
        <MypageHomeProductPreview items={items} ariaLabel="최근 본 상품" />
      ) : (
        <MypageEmptyState
          title="최근 본 상품이 없습니다."
          description="상품을 둘러보면 이곳에서 다시 확인할 수 있습니다."
          action={{ href: '/new', label: '상품 보러 가기' }}
        />
      )}
    </section>
  );
}
