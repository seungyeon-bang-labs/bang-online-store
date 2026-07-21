export type CouponDiscountType =
  | 'percentage'
  | 'fixed'
  | 'free_shipping';

export interface CouponDTO {
  id: number;
  code: string;
  name: string;
  discount_type: CouponDiscountType;
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  category_label: string | null;
  is_stackable: boolean;
}
