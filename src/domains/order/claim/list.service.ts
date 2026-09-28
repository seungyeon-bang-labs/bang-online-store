import {
  DataIntegrityError,
  requireRelation,
} from '@/shared/lib/data-integrity';
import { paginate } from '@/shared/lib/pagination';
import { filterOrderClaims } from './domain';
import type { OrderClaimListQuery } from './domain';
import { toOrderClaimViewModel } from './mapper';
import type { OrderItemRelationsService } from '../order-item-relations.service';
import type { OrderRepository } from '../repository';
import type {
  OrderClaimHistoryRepository,
  OrderClaimRepository,
  OrderClaimSettlementRepository,
} from './repository';
import type { OrderClaimPageViewModel } from './view-model';

interface ClaimListServiceDependencies {
  orderRepository: OrderRepository;
  orderClaimRepository: OrderClaimRepository;
  orderClaimHistoryRepository: OrderClaimHistoryRepository;
  orderClaimSettlementRepository: OrderClaimSettlementRepository;
  orderItemRelationsService: OrderItemRelationsService;
}

export interface ClaimListService {
  getOrderClaimListViewModel(
    userId: string,
    query: OrderClaimListQuery,
  ): Promise<OrderClaimPageViewModel>;
}

export function createClaimListService({
  orderRepository,
  orderClaimRepository,
  orderClaimHistoryRepository,
  orderClaimSettlementRepository,
  orderItemRelationsService,
}: ClaimListServiceDependencies): ClaimListService {
  async function getOrderClaimListViewModel(
    userId: string,
    query: OrderClaimListQuery,
  ): Promise<OrderClaimPageViewModel> {
    const [claims, orders] = await Promise.all([
      orderClaimRepository.findByUserId(userId),
      orderRepository.findByUserId(userId),
    ]);
    const orderById = new Map(orders.map(order => [order.id, order]));
    const filteredClaims = filterOrderClaims(claims, query);
    const [relations, histories, settlements] = await Promise.all([
      orderItemRelationsService.getOrderItemRelations(
        orders.map(order => order.id),
      ),
      orderClaimHistoryRepository.findByClaimIds(
        filteredClaims.map(claim => claim.id),
      ),
      orderClaimSettlementRepository.findByClaimIds(
        filteredClaims.map(claim => claim.id),
      ),
    ]);
    const settlementByClaimId = new Map(
      settlements.map(settlement => [settlement.claim_id, settlement]),
    );
    const historiesByClaimId = new Map<string, typeof histories>();

    histories.forEach(history => {
      const claimHistories = historiesByClaimId.get(history.claim_id) ?? [];
      claimHistories.push(history);
      historiesByClaimId.set(history.claim_id, claimHistories);
    });

    const items = filteredClaims.map(claim => {
      const order = requireRelation(
        orderById.get(claim.order_id),
        'order_claims.order_id -> orders.id',
        claim.id,
      );
      const item = requireRelation(
        relations.itemById.get(claim.order_item_id),
        'order_claims.order_item_id -> order_items.id',
        claim.id,
      );

      if (item.order_id !== order.id) {
        throw new DataIntegrityError(
          'order_claims order and order_item mismatch',
          claim.id,
        );
      }

      return toOrderClaimViewModel(
        claim,
        order,
        item,
        requireRelation(
          relations.productById.get(item.product_id),
          'order_items.product_id -> products.id',
          item.id,
        ),
        settlementByClaimId.get(claim.id) ?? null,
        historiesByClaimId.get(claim.id) ?? [],
      );
    });

    return {
      ...paginate(items, query.page, 10),
      unfilteredItemCount: claims.length,
    };
  }

  return { getOrderClaimListViewModel };
}
