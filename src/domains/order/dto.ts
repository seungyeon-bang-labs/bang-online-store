export type OrderStatus =
  | 'pending_payment'
  | 'payment_completed'
  | 'preparing_shipment'
  | 'shipping'
  | 'delivered'
  | 'cancelled';

export type OrderClaimType = 'cancel' | 'exchange' | 'return';

export type OrderClaimStatus =
  | 'requested'
  | 'processing'
  | 'completed'
  | 'rejected';

export interface OrderDTO {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  ordered_at: string;
  payment_due_at: string | null;
  paid_at: string | null;
  estimated_delivery_at: string | null;
  cancelled_at: string | null;
  subtotal_amount: number;
  discount_amount: number;
  shipping_fee: number;
  total_amount: number;
  recipient_name: string;
  shipping_address_text: string;
  payment_method: string;
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
