import type { RecentProductDateGroupViewModel } from '@/domains/activity';
import { MypageRecentProductItem } from './item';

interface MypageRecentProductListProps {
  groups: readonly RecentProductDateGroupViewModel[];
}

export function MypageRecentProductList({
  groups,
}: MypageRecentProductListProps) {
  return (
    <div className="overflow-hidden rounded-md border border-zinc-300 bg-white">
      {groups.map((group, index) => (
        <section
          key={group.dateKey}
          className={index > 0 ? 'border-t border-zinc-200' : undefined}
        >
          <h3 className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-black text-black md:px-5">
            {group.dateLabel}
          </h3>
          <div className="divide-y divide-zinc-300">
            {group.items.map(item => (
              <MypageRecentProductItem key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
