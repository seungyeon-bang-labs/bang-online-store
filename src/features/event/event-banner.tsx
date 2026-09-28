'use client';

import { useEffect, useRef, useState } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import Image from 'next/image';
import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/shared/components/ui/carousel';
import type { EventBannerViewModel } from '@/domains/event';
import { cn } from '@/shared/lib/utils';

interface EventBannerProps {
  eventBannerViewModels: EventBannerViewModel[];
  className?: string;
}

export function EventBanner({
  eventBannerViewModels,
  className,
}: EventBannerProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(eventBannerViewModels.length ? 1 : 0);
  const eventCount = eventBannerViewModels.length;
  const canAutoplay = eventCount > 1;

  const autoplayPlugin = useRef(
    Autoplay({
      delay: 4000,
      stopOnInteraction: true,
    }),
  );

  useEffect(() => {
    setCurrent(eventBannerViewModels.length ? 1 : 0);
  }, [eventBannerViewModels.length]);

  useEffect(() => {
    if (!api) return;

    const handleSelect = () => {
      setCurrent(api.selectedScrollSnap() + 1);
    };

    api.on('select', handleSelect);
    api.on('reInit', handleSelect);

    return () => {
      api.off('select', handleSelect);
      api.off('reInit', handleSelect);
    };
  }, [api]);

  if (!eventCount) return null;

  return (
    <section
      className={cn(
        '-mx-5 w-[calc(100%+2.5rem)] cursor-pointer group relative md:mx-0 md:w-full',
        className,
      )}
      onMouseEnter={() => {
        if (canAutoplay) autoplayPlugin.current.stop();
      }}
      onMouseLeave={() => {
        if (canAutoplay) autoplayPlugin.current.play();
      }}
    >
      <Carousel
        setApi={setApi}
        className="w-full"
        opts={{ loop: canAutoplay }}
        plugins={canAutoplay ? [autoplayPlugin.current] : []}
      >
        <CarouselContent>
          {eventBannerViewModels.map((eventBannerViewModel, index) => (
            <CarouselItem key={eventBannerViewModel.id}>
              <Link
                href={`/event/${eventBannerViewModel.id}`}
                className={cn(
                  'relative block h-60 overflow-hidden sm:h-70 md:aspect-25/9 md:h-auto md:rounded-sm',
                )}
              >
                <Image
                  src={eventBannerViewModel.imgUrl}
                  alt={eventBannerViewModel.title}
                  fill
                  priority={index === 0}
                  className="object-cover object-center transition-transform duration-700"
                />

                <div className="absolute inset-0 z-10 bg-linear-to-t from-black/85 via-black/35 to-black/5 md:bg-linear-to-tr md:from-black/80 md:via-black/0 md:to-transparent" />

                <div className="absolute inset-x-0 bottom-0 z-20 px-5 pb-8 pt-12 text-white sm:px-7 md:px-12 md:py-4">
                  <div className="max-w-[min(100%,28rem)] space-y-2 text-start md:max-w-2xl md:space-y-3">
                    <h2 className="text-xl font-black leading-tight tracking-tighter uppercase sm:text-2xl md:text-4xl">
                      {eventBannerViewModel.title}
                    </h2>
                    <p className="line-clamp-2 text-xs font-medium leading-relaxed text-white/70 sm:text-sm md:text-base">
                      {eventBannerViewModel.subtitle}
                    </p>
                  </div>
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>

        {canAutoplay && (
          <>
            <div className="absolute bottom-3 right-3 z-20 flex items-center justify-center rounded-full bg-black/50 px-2.5 py-1 font-mono text-xs tracking-widest text-white backdrop-blur-md pointer-events-none md:bottom-4 md:right-4 md:px-3 md:py-1.5 md:text-sm">
              <span className="font-bold">{current}</span>
              <span className="mx-1 text-white/30">/</span>
              <span className="text-white/50">{eventCount}</span>
            </div>

            <CarouselPrevious className="left-4 hidden transition-opacity md:flex" />
            <CarouselNext className="right-4 hidden transition-opacity md:flex" />
          </>
        )}
      </Carousel>
    </section>
  );
}
