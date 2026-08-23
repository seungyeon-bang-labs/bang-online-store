'use client';

import { ChevronDown } from 'lucide-react';
import { type ReactNode, useId, useState } from 'react';

interface MypageClaimDetailCollapsibleCardProps {
  title: string;
  children: ReactNode;
}

export function MypageClaimDetailCollapsibleCard({
  title,
  children,
}: MypageClaimDetailCollapsibleCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const contentId = useId();

  return (
    <section className="overflow-hidden rounded-md border border-zinc-300 bg-white">
      <header className={isOpen ? 'border-b border-zinc-200' : undefined}>
        <h3>
          <button
            type="button"
            aria-controls={contentId}
            aria-expanded={isOpen}
            className="flex min-h-11 w-full items-center justify-between gap-4 p-4 text-left font-black text-black transition-colors hover:bg-zinc-50 active:bg-zinc-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-black md:p-5"
            onClick={() => setIsOpen(currentIsOpen => !currentIsOpen)}
          >
            <span>{title}</span>
            <ChevronDown
              className={`size-5 shrink-0 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
              strokeWidth={2.5}
              aria-hidden="true"
            />
          </button>
        </h3>
      </header>
      <div id={contentId} hidden={!isOpen}>
        {children}
      </div>
    </section>
  );
}
