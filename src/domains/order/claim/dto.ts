import type { OrderPaymentMethod } from '../dto';

export type OrderClaimType = 'exchange' | 'return';

export type OrderClaimStatus =
  | 'requested'
  | 'processing'
  | 'completed'
  | 'rejected';

export type OrderClaimProgressStage =
  | 'collection_scheduled'
  | 'collection_completed'
  | 'inspecting'
  | 'exchange_preparing_shipment'
  | 'exchange_shipping'
  | 'refund_processing';

export type OrderClaimHistoryEvent =
  | 'requested'
  | OrderClaimProgressStage
  | 'completed'
  | 'rejected';

export type OrderClaimSettlementType =
  | 'additional_payment'
  | 'refund'
  | 'none';

export type OrderClaimSettlementStatus =
  | 'pending'
  | 'completed'
  | 'unavailable';

export interface OrderClaimDTO {
  id: string;
  user_id: string;
  order_id: string;
  order_item_id: string;
  claim_type: OrderClaimType;
  status: OrderClaimStatus;
  progress_stage: OrderClaimProgressStage | null;
  reason: string;
  description: string | null;
  rejection_reason: string | null;
  exchange_product_id: number | null;
  exchange_variant_id: string | null;
  requested_at: string;
  completed_at: string | null;
}

export interface OrderClaimHistoryDTO {
  id: string;
  claim_id: string;
  event: OrderClaimHistoryEvent;
  occurred_at: string;
}

export interface OrderClaimSettlementDTO {
  id: string;
  claim_id: string;
  type: OrderClaimSettlementType;
  amount: number;
  status: OrderClaimSettlementStatus;
  payment_method: OrderPaymentMethod | null;
  expected_at: string | null;
  completed_at: string | null;
}
