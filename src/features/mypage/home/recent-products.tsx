import { Eye } from 'lucide-react';
import type { ActivityProductViewModel } from '@/domains/activity';
import { MypageCompactEmptyState } from '../mypage-compact-empty-state';
import { MypageHomeProductPreview } from './product-preview';
import { MypageHomeSectionHeader } from './section-header';

interface MypageHomeRecentProductsProps {
  items: ActivityProductViewModel[];
}

export function MypageHomeRecentProducts({
  items,
}: MypageHomeRecentProductsProps) {
  return (
    <section className="space-y-5">
      <MypageHomeSectionHeader
        title="최근 본 상품"
        icon={<Eye className="size-4" />}
        viewAllHref="/mypage/recent"
      />

      {items.length > 0 ? (
        <MypageHomeProductPreview items={items} ariaLabel="최근 본 상품" />
      ) : (
        <MypageCompactEmptyState
          title="최근 본 상품이 없습니다."
          description="상품을 둘러보면 이곳에서 다시 확인할 수 있습니다."
          action={{ href: '/new', label: '상품 보러 가기' }}
        />
      )}
    </section>
  );
}
