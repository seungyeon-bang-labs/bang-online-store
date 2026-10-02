import {
  couponRepository,
  toCouponSectionViewModel,
} from '@/domains/coupon';
import { productService } from '@/domains/product';
import { eventRepository } from './repository';
import {
  toEventHeroViewModel,
  toEventProductSectionViewModel,
  toEventRewardSectionViewModel,
} from './mapper';
import type { EventDetailViewModel } from './view-model';
import type { EventDTO } from './dto';

export async function getEventDetailViewModel(
  id: string,
): Promise<EventDetailViewModel | null> {
  const eventId = parseEventId(id);

  if (!eventId) {
    return null;
  }

  const event = await eventRepository.findById(eventId);

  if (!event) {
    return null;
  }

  const eventHeroViewModel = toEventHeroViewModel(event);
  const isEnded = eventHeroViewModel.status === 'ended';
  const shouldLoadProducts = shouldShowEventProducts(event, isEnded);

  const [coupons, products] = await Promise.all([
    event.couponList
      ? couponRepository.findByIds(event.couponList.items.map(item => item.id))
      : [],
    shouldLoadProducts && event.productList
      ? productService.findByIds(
          event.productList.items.map(item => item.id),
        )
      : [],
  ]);

  return {
    kind: event.kind,
    eventHeroViewModel,
    isEnded,
    description: event.description,
    couponSection: event.couponList
      ? toCouponSectionViewModel({
          title: event.couponList.title,
          coupons,
        })
      : null,
    productSection: shouldLoadProducts && event.productList
      ? toEventProductSectionViewModel({
          title: event.productList.title,
          products,
        })
      : null,
    rewardSection: toEventRewardSectionViewModel(event),
  };
}

function parseEventId(id: string) {
  if (!/^[1-9]\d*$/.test(id)) {
    return null;
  }

  const eventId = Number(id);

  return Number.isSafeInteger(eventId) ? eventId : null;
}

function shouldShowEventProducts(event: EventDTO, isEnded: boolean): boolean {
  if (!event.productList) {
    return false;
  }

  if (!isEnded) {
    return true;
  }

  return event.kind !== 'sale';
}
