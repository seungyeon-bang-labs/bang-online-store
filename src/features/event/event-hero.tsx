import Image from 'next/image';
import { formatPeriod, type EventHeroViewModel } from '@/domains/event';

interface EventHeroProps {
  eventHeroViewModel: EventHeroViewModel;
}

export function EventHero({ eventHeroViewModel }: EventHeroProps) {
  const { imgUrl, title, subtitle, startDate, endDate } = eventHeroViewModel;
  const periodStr = formatPeriod(startDate, endDate);

  return (
    <div className="relative h-[340px] w-full overflow-hidden sm:h-[380px] md:aspect-21/7 md:h-auto">
      <Image src={imgUrl} alt={title} fill priority className="object-cover" />
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 px-5 text-center text-white sm:px-8">
        <h1 className="mb-3 max-w-4xl text-2xl font-extrabold leading-tight sm:text-3xl md:mb-4 md:text-5xl">
          {title}
        </h1>
        <p className="mb-5 max-w-2xl text-sm leading-relaxed opacity-90 sm:text-base md:mb-6 md:text-xl">
          {subtitle}
        </p>

        <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs tracking-tight backdrop-blur-md sm:px-5 sm:text-sm md:px-6 md:text-base">
          {`이벤트 기간: ${periodStr}`}
        </div>
      </div>
    </div>
  );
}
