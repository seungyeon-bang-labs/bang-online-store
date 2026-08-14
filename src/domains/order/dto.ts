export type OrderStatus =
  | 'pending_payment'
  | 'payment_completed'
  | 'preparing_shipment'
  | 'shipping'
  | 'delivered'
  | 'cancelled';

export type OrderStatusHistoryStatus = OrderStatus | 'order_received';

export type OrderClaimType = 'exchange' | 'return';

export type OrderClaimStatus =
  | 'requested'
  | 'processing'
  | 'completed'
  | 'rejected';

export type OrderRefundStatus = 'pending' | 'completed';

export const ORDER_PAYMENT_METHODS = ['신용카드', '무통장 입금'] as const;

export type OrderPaymentMethod = (typeof ORDER_PAYMENT_METHODS)[number];

export type OrderPaymentTransactionType = 'payment' | 'refund';

export interface OrderRefundAllocationDTO {
  item_amount: number;
  order_discount_amount: number;
  point_usage_amount: number;
  shipping_adjustment_amount: number;
}

export interface OrderDTO {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  ordered_at: string;
  payment_due_at: string | null;
  paid_at: string | null;
  estimated_delivery_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  subtotal_amount: number;
  discount_amount: number;
  shipping_fee: number;
  total_amount: number;
  recipient_name: string;
  recipient_phone: string;
  shipping_address_text: string;
  postal_code: string;
  payment_method: OrderPaymentMethod;
}

export interface OrderItemDTO {
  id: string;
  order_id: string;
  product_id: number;
  variant_id: string;
  product_name: string;
  option_label: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  line_total_amount: number;
  created_at: string;
}

export interface OrderItemCancellationDTO {
  id: string;
  order_id: string;
  order_item_id: string;
  cancelled_at: string;
  refund_amount: number;
  refund_status: OrderRefundStatus;
  refund_expected_at: string | null;
  refunded_at: string | null;
  allocation?: OrderRefundAllocationDTO;
}

export interface OrderPaymentTransactionDTO {
  id: string;
  order_id: string;
  type: OrderPaymentTransactionType;
  amount: number;
  payment_method: OrderPaymentMethod;
  occurred_at: string;
  order_item_cancellation_id: string | null;
}

export interface OrderStatusHistoryDTO {
  id: string;
  order_id: string;
  status: OrderStatusHistoryStatus;
  occurred_at: string;
}

export interface OrderClaimDTO {
  id: string;
  user_id: string;
  order_id: string;
  order_item_id: string;
  claim_type: OrderClaimType;
  status: OrderClaimStatus;
  reason: string;
  requested_at: string;
  completed_at: string | null;
}
