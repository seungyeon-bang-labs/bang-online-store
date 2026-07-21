import type { CouponSectionViewModel } from '@/domains/coupon';
import type { ProductCardViewModel } from '@/domains/product';
import type { EventKind, EventRewardColor, EventView } from './dto';

export interface EventCardViewModel {
  id: number;
  title: string;
  subtitle: string;
  imgUrl: string;
  status: EventView['status'];
  isExpired: boolean;
  startDate: Date;
  endDate: Date | null;
}

export interface EventBannerViewModel {
  id: number;
  title: string;
  subtitle: string;
  imgUrl: string;
  startDate: Date;
  endDate: Date | null;
}

export interface EventDetailViewModel {
  kind: EventKind;
  eventHeroViewModel: EventHeroViewModel;
  isEnded: boolean;
  description: string;
  couponSection: CouponSectionViewModel | null;
  productSection: EventProductSectionViewModel | null;
  rewardSection: EventRewardSectionViewModel | null;
}

export interface EventHeroViewModel {
  title: string;
  subtitle: string;
  imgUrl: string;
  status: 'ongoing' | 'ended';
  startDate: Date;
  endDate: Date | null;
}

export interface EventProductSectionViewModel {
  title?: string;
  products: ProductCardViewModel[];
}

export interface EventRewardCardViewModel {
  title: string;
  description: string;
  valueLabel: string;
  color: EventRewardColor;
}

export interface EventRewardSectionViewModel {
  title: string;
  rewards: EventRewardCardViewModel[];
}
