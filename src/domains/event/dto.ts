export interface EventLinkedItemListDTO {
  title?: string;
  items: { id: number }[];
}

export const EVENT_REWARD_COLORS = [
  'black',
  'bronze',
  'silver',
  'gold',
  'platinum',
] as const;

export type EventRewardColor = (typeof EVENT_REWARD_COLORS)[number];

export interface EventRewardItemDTO {
  title: string;
  description: string;
  valueLabel: string;
  color?: EventRewardColor;
}

export interface EventRewardListDTO {
  title?: string;
  items: EventRewardItemDTO[];
}

export const EVENT_KINDS = ['sale', 'promotion', 'coupon', 'reward'] as const;

export type EventKind = (typeof EVENT_KINDS)[number];

export interface EventDTO {
  id: number;
  kind: EventKind;
  title: string;
  subtitle: string;
  description: string;
  startDate: Date;
  endDate: Date | null;
  imgUrl: string;
  productList?: EventLinkedItemListDTO;
  couponList?: EventLinkedItemListDTO;
  rewardList?: EventRewardListDTO;
}

export type EventDisplayStatus =
  | '진행중'
  | '상시 진행'
  | '종료'
  | `D-${1 | 2 | 3 | 4 | 5 | 6 | 7}`
  | '오늘 종료';

export type EventViewDTO = EventDTO & {
  status: EventDisplayStatus;
  isExpired: boolean;
};

export type Event = EventDTO;
export type EventView = EventViewDTO;
