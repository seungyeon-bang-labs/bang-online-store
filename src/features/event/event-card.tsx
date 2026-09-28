import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import type { EventCardViewModel } from '@/domains/event';

interface EventCardProps {
  eventCardViewModel: EventCardViewModel;
}

export function EventCard({ eventCardViewModel }: EventCardProps) {
  return (
    <div className="relative">
      <Link
        href={`/event/${eventCardViewModel.id}`}
        className="group block w-full cursor-pointer"
      >
        <div
          className={cn(
            'relative aspect-video w-full overflow-hidden rounded-md border border-zinc-100 transition-all duration-500',
            'bg-zinc-100 group-hover:shadow-xl group-hover:-translate-y-1',
          )}
        >
          <Image
            src={eventCardViewModel.imgUrl}
            alt={eventCardViewModel.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          <div className="absolute inset-0 bg-black/5" />

          <div className="absolute top-4 left-4 z-20">
            <span
              className={cn(
                'px-3 py-1 rounded-md text-xs font-black uppercase tracking-wide shadow-md',
                getEventStatusBadgeClassName(eventCardViewModel),
              )}
            >
              {eventCardViewModel.status}
            </span>
          </div>
        </div>

        <div
          className={cn(
            'mt-4 px-1 flex flex-col gap-2',
            eventCardViewModel.isExpired ? 'opacity-60' : 'opacity-100',
          )}
        >
          <h3 className="text-lg font-black tracking-tighter leading-tight text-zinc-900 transition-colors md:text-xl">
            {eventCardViewModel.title}
          </h3>
          <p className="text-sm font-medium text-zinc-500 line-clamp-1">
            {eventCardViewModel.subtitle}
          </p>
        </div>
      </Link>
    </div>
  );
}

function getEventStatusBadgeClassName(eventCardViewModel: EventCardViewModel) {
  if (eventCardViewModel.isExpired) {
    return 'bg-zinc-500 text-white';
  }

  if (eventCardViewModel.status === '상시 진행') {
    return 'bg-blue-600 text-white';
  }

  if (eventCardViewModel.status !== '진행중') {
    return 'bg-red-600 text-white';
  }

  return 'bg-black text-white';
}
