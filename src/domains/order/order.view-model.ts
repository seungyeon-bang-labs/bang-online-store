import type { PageSlice } from '@/domains/mypage/mypage-pagination';
import type { StatusViewModel } from '@/domains/mypage/mypage-status.view-model';
import type { ProductCardViewModel } from '@/domains/product';
import type { OrderStatus } from './order.dto';

export interface OrderItemViewModel {
  id: string;
  product: ProductCardViewModel;
  productName: string;
  optionLabel: string;
  quantity: number;
  lineTotalText: string;
}

export interface OrderListItemViewModel {
  id: string;
  orderNumber: string;
  orderedAt: string;
  statusCode: OrderStatus;
  status: StatusViewModel;
  totalAmountText: string;
  items: OrderItemViewModel[];
}

export type OrderListPageViewModel = PageSlice<OrderListItemViewModel>;

export interface OrderClaimViewModel {
  id: string;
  orderNumber: string;
  productName: string;
  optionLabel: string;
  type: StatusViewModel;
  status: StatusViewModel;
  reason: string;
  requestedAt: string;
  completedAt: string | null;
}

export type OrderClaimPageViewModel = PageSlice<OrderClaimViewModel>;
