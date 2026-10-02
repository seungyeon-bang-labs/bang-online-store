import { useMemo } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/shared/components/ui/carousel';
import { cn } from '@/shared/lib/utils';
import { SectionHeader } from './section-header';

interface SliderProps {
  children: React.ReactNode[];
  rows?: number;
  cols?: number;
  gap?: string;
  title?: string;
  href?: string;
  showButtons?: boolean;
  navigationPosition?: 'outside' | 'edge';
  className?: string;
  contentClassName?: string;
  itemClassName?: string;
  pageClassName?: string;
  incompletePageLayout?: 'start' | 'balanced';
  slidesToScroll?: number | 'auto';
  ariaLabel?: string;
}

export function Slider({
  children,
  rows = 2,
  cols = 6,
  gap = 'gap-4',
  title,
  href,
  className,
  showButtons = true,
  navigationPosition = 'outside',
  itemClassName,
  contentClassName,
  pageClassName,
  incompletePageLayout = 'start',
  slidesToScroll = 1,
  ariaLabel,
}: SliderProps) {
  const itemsPerPage = rows * cols;

  const pages = useMemo(() => {
    return Array.from(
      { length: Math.ceil(children.length / itemsPerPage) },
      (_, i) =>
        children.slice(i * itemsPerPage, i * itemsPerPage + itemsPerPage),
    );
  }, [children, itemsPerPage]);

  return (
    <div>
      {title && (
        <SectionHeader
          title={title}
          viewAllHref={href}
          className="mb-4"
        />
      )}
      <Carousel
        opts={{
          align: 'start',
          loop: false,
          slidesToScroll,
        }}
        className={cn('w-full', className)}
        aria-label={ariaLabel}
      >
        <CarouselContent
          className={cn(itemClassName ? undefined : 'ml-0', contentClassName)}
        >
          {itemClassName
            ? children.map((child, index) => (
                <CarouselItem key={index} className={itemClassName}>
                  {child}
                </CarouselItem>
              ))
            : pages.map((pageItems, pageIndex) => {
                const gridItems = getGridItems({
                  pageItems,
                  rows,
                  cols,
                  itemsPerPage,
                  incompletePageLayout,
                });

                return (
                  <CarouselItem
                    key={pageIndex}
                    className={cn('basis-full pl-0', pageClassName)}
                  >
                    <div
                      className={cn('grid', gap)}
                      style={{
                        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                      }}
                    >
                      {gridItems.map((child, childIndex) => (
                        <div key={childIndex} className="w-full">
                          {child}
                        </div>
                      ))}
                    </div>
                  </CarouselItem>
                );
              })}
        </CarouselContent>

        {showButtons &&
          (itemClassName ? children.length > 1 : pages.length > 1) && (
            <>
              <CarouselPrevious
                className={cn(
                  'flex size-8 transition-colors hover:bg-black hover:text-white disabled:invisible',
                  navigationPosition === 'edge'
                    ? '-left-5'
                    : '-left-5 md:-left-12',
                )}
              />
              <CarouselNext
                className={cn(
                  'flex size-8 transition-colors hover:bg-black hover:text-white disabled:invisible',
                  navigationPosition === 'edge'
                    ? '-right-5'
                    : '-right-5 md:-right-12',
                )}
              />
            </>
          )}
      </Carousel>
    </div>
  );
}

function getGridItems({
  pageItems,
  rows,
  cols,
  itemsPerPage,
  incompletePageLayout,
}: {
  pageItems: React.ReactNode[];
  rows: number;
  cols: number;
  itemsPerPage: number;
  incompletePageLayout: SliderProps['incompletePageLayout'];
}) {
  if (incompletePageLayout !== 'balanced' || pageItems.length === itemsPerPage) {
    return pageItems;
  }

  const itemsPerRow = Math.ceil(pageItems.length / rows);

  return Array.from({ length: itemsPerPage }, (_, index) => {
    const row = Math.floor(index / cols);
    const column = index % cols;
    const itemIndex = row * itemsPerRow + column;

    return column < itemsPerRow ? (pageItems[itemIndex] ?? null) : null;
  });
}
