import type { RecentProductDateGroupViewModel } from '@/domains/activity';
import { MypageCard } from '@/features/mypage/common';
import { MypageRecentProductDateGroup } from './date-group';

interface MypageRecentProductListProps {
  groups: readonly RecentProductDateGroupViewModel[];
}

export function MypageRecentProductList({
  groups,
}: MypageRecentProductListProps) {
  return (
    <MypageCard mobileLayout="full-bleed">
      {groups.map((group, index) => (
        <MypageRecentProductDateGroup
          key={group.dateKey}
          group={group}
          defaultOpen={index < 2}
          className={index > 0 ? 'border-t border-zinc-200' : undefined}
        />
      ))}
    </MypageCard>
  );
}
