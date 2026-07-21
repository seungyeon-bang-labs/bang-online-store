import { useMemo } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { cn } from '@/shared/lib/utils';
import Link from 'next/link';

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
  itemClassName?: string;
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
      <div className="flex items-center justify-between">
        {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}
        {href && (
          <Link href={href} className="text-sm text-gray-500 hover:underline">
            전체보기
          </Link>
        )}
      </div>
      <Carousel
        opts={{
          align: 'start',
          loop: false,
          slidesToScroll: 1,
        }}
        className={cn('w-full', className)}
      >
        <CarouselContent className={itemClassName ? undefined : 'ml-0'}>
          {itemClassName
            ? children.map((child, index) => (
                <CarouselItem key={index} className={itemClassName}>
                  {child}
                </CarouselItem>
              ))
            : pages.map((pageItems, pageIndex) => (
                <CarouselItem key={pageIndex} className="basis-full pl-0">
                  <div
                    className={cn('grid', gap)}
                    style={{
                      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                      gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                    }}
                  >
                    {pageItems.map((child, childIndex) => (
                      <div key={childIndex} className="w-full">
                        {child}
                      </div>
                    ))}
                  </div>
                </CarouselItem>
              ))}
        </CarouselContent>

        {showButtons &&
          (itemClassName ? children.length > cols : pages.length > 1) && (
          <>
            <CarouselPrevious
              className={cn(
                'hidden md:flex hover:bg-black hover:text-white transition-colors',
                navigationPosition === 'edge' ? '-left-5' : '-left-12',
              )}
            />
            <CarouselNext
              className={cn(
                'hidden md:flex hover:bg-black hover:text-white transition-colors',
                navigationPosition === 'edge' ? '-right-5' : '-right-12',
              )}
            />
          </>
          )}
      </Carousel>
    </div>
  );
}
