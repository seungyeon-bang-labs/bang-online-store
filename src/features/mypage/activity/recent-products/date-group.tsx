'use client';

import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import type { RecentProductDateGroupViewModel } from '@/domains/activity';
import {
  MYPAGE_DATE_GROUP_HEADER_CLASS_NAME,
  MYPAGE_DATE_GROUP_TITLE_CLASS_NAME,
} from '@/features/mypage/common/styles';
import { MypageRecentProductItem } from './item';

interface MypageRecentProductDateGroupProps {
  group: RecentProductDateGroupViewModel;
  defaultOpen: boolean;
  className?: string;
}

export function MypageRecentProductDateGroup({
  group,
  defaultOpen,
  className,
}: MypageRecentProductDateGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <section className={className}>
      <header className={isOpen ? 'border-b border-zinc-200' : undefined}>
        <h3>
          <button
            type="button"
            aria-controls={contentId}
            aria-expanded={isOpen}
            className={`flex w-full items-center justify-between gap-4 text-left transition-colors hover:bg-zinc-200 active:bg-zinc-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-black ${MYPAGE_DATE_GROUP_HEADER_CLASS_NAME}`}
            onClick={() => setIsOpen(currentIsOpen => !currentIsOpen)}
          >
            <span className="min-w-0">
              <span className={MYPAGE_DATE_GROUP_TITLE_CLASS_NAME}>
                {group.dateLabel}
              </span>
            </span>
            <ChevronDown
              className={`size-5 shrink-0 text-black transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
              strokeWidth={2.5}
              aria-hidden="true"
            />
          </button>
        </h3>
      </header>
      <div id={contentId} hidden={!isOpen}>
        <div className="divide-y divide-zinc-300">
          {group.items.map(item => (
            <MypageRecentProductItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
