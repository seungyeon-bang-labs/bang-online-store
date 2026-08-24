import type {
  OrderClaimDTO,
  OrderClaimHistoryDTO,
  OrderClaimSettlementDTO,
} from './dto';

export interface OrderClaimRepository {
  findById(claimId: string): Promise<OrderClaimDTO | null>;
  findByOrderItemIds(orderItemIds: string[]): Promise<OrderClaimDTO[]>;
  findByUserId(userId: string): Promise<OrderClaimDTO[]>;
}

export interface OrderClaimHistoryRepository {
  findByClaimIds(claimIds: string[]): Promise<OrderClaimHistoryDTO[]>;
}

export interface OrderClaimSettlementRepository {
  findByClaimIds(claimIds: string[]): Promise<OrderClaimSettlementDTO[]>;
}
