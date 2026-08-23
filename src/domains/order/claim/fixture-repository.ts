import {
  ORDER_CLAIMS,
  ORDER_CLAIM_HISTORIES,
  ORDER_CLAIM_SETTLEMENTS,
} from '../fixture';
import type {
  OrderClaimDTO,
  OrderClaimHistoryDTO,
  OrderClaimSettlementDTO,
} from './dto';
import type {
  OrderClaimHistoryRepository,
  OrderClaimRepository,
  OrderClaimSettlementRepository,
} from './repository';

const cloneClaim = (claim: OrderClaimDTO): OrderClaimDTO => ({ ...claim });
const cloneClaimHistory = (
  history: OrderClaimHistoryDTO,
): OrderClaimHistoryDTO => ({ ...history });
const cloneClaimSettlement = (
  settlement: OrderClaimSettlementDTO,
): OrderClaimSettlementDTO => ({ ...settlement });

export const fixtureOrderClaimRepository: OrderClaimRepository = {
  async findById(claimId) {
    const claim = ORDER_CLAIMS.find(item => item.id === claimId);
    return claim ? cloneClaim(claim) : null;
  },
  async findByOrderItemIds(orderItemIds) {
    const orderItemIdSet = new Set(orderItemIds);

    return ORDER_CLAIMS.filter(claim =>
      orderItemIdSet.has(claim.order_item_id),
    ).map(cloneClaim);
  },
  async findByUserId(userId) {
    return ORDER_CLAIMS.filter(claim => claim.user_id === userId).map(
      cloneClaim,
    );
  },
};

export const fixtureOrderClaimHistoryRepository: OrderClaimHistoryRepository =
  {
    async findByClaimIds(claimIds) {
      const claimIdSet = new Set(claimIds);

      return ORDER_CLAIM_HISTORIES.filter(history =>
        claimIdSet.has(history.claim_id),
      ).map(cloneClaimHistory);
    },
  };

export const fixtureOrderClaimSettlementRepository: OrderClaimSettlementRepository =
  {
    async findByClaimIds(claimIds) {
      const claimIdSet = new Set(claimIds);

      return ORDER_CLAIM_SETTLEMENTS.filter(settlement =>
        claimIdSet.has(settlement.claim_id),
      ).map(cloneClaimSettlement);
    },
  };
