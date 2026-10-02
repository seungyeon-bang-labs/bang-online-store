import type { EventDTO } from './dto';
import { toProductCardViewModel, type ProductModel } from '@/domains/product';
import type {
  EventBannerViewModel,
  EventCardViewModel,
  EventHeroViewModel,
  EventProductSectionViewModel,
  EventRewardSectionViewModel,
} from './view-model';
import { buildEventView, getEventStatus } from './domain';

function toEventCardViewModel(
  event: EventDTO,
  now = new Date(),
): EventCardViewModel {
  const eventView = buildEventView(event, now);

  return {
    id: eventView.id,
    title: eventView.title,
    subtitle: eventView.subtitle,
    imgUrl: eventView.imgUrl,
    status: eventView.status,
    isExpired: eventView.isExpired,
    startDate: eventView.startDate,
    endDate: eventView.endDate,
  };
}

export function toEventCardViewModels(
  events: EventDTO[],
  now = new Date(),
): EventCardViewModel[] {
  return events.map(event => toEventCardViewModel(event, now));
}

function toEventBannerViewModel(event: EventDTO): EventBannerViewModel {
  return {
    id: event.id,
    title: event.title,
    subtitle: event.subtitle,
    imgUrl: event.imgUrl,
    startDate: event.startDate,
    endDate: event.endDate,
  };
}

export function toEventBannerViewModels(
  events: EventDTO[],
): EventBannerViewModel[] {
  return events.map(toEventBannerViewModel);
}

export function toEventHeroViewModel(event: EventDTO): EventHeroViewModel {
  return {
    title: event.title,
    subtitle: event.subtitle,
    imgUrl: event.imgUrl,
    status: getEventStatus(event),
    startDate: event.startDate,
    endDate: event.endDate,
  };
}

export function toEventProductSectionViewModel({
  title,
  products,
}: {
  title?: string;
  products: ProductModel[];
}): EventProductSectionViewModel {
  return {
    title,
    products: products.map(toProductCardViewModel),
  };
}

export function toEventRewardSectionViewModel(
  event: EventDTO,
): EventRewardSectionViewModel | null {
  if (!event.rewardList?.items.length) {
    return null;
  }

  return {
    title: event.rewardList.title ?? 'REWARD BENEFITS',
    rewards: event.rewardList.items.map(item => ({
      title: item.title,
      description: item.description,
      valueLabel: item.valueLabel,
      color: item.color ?? 'black',
    })),
  };
}
