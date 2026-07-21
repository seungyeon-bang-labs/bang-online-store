export interface RecentProductViewDTO {
  id: string;
  user_id: string;
  product_id: number;
  viewed_at: string;
}

export interface WishlistItemDTO {
  id: string;
  user_id: string;
  product_id: number;
  created_at: string;
}

export interface ReviewDTO {
  id: string;
  user_id: string;
  order_item_id: string;
  product_id: number;
  rating: number;
  content: string;
  created_at: string;
  updated_at: string;
}
