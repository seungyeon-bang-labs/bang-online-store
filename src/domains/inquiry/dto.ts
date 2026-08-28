export type InquiryType =
  | 'order'
  | 'delivery'
  | 'return'
  | 'product'
  | 'coupon'
  | 'account'
  | 'etc';

export type InquiryStatus = 'pending' | 'answered' | 'cancelled';

export interface InquiryDTO {
  id: string;
  user_id: string;
  inquiry_type: InquiryType;
  order_id: string | null;
  order_item_id?: string | null;
  product_id: number | null;
  title: string;
  content: string;
  status: InquiryStatus;
  answer_content: string | null;
  answered_at: string | null;
  created_at: string;
  updated_at: string;
}
