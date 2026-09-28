import {
  DataIntegrityError,
  requireRelation,
} from '@/shared/lib/data-integrity';
import { toOrderClaimDetailViewModel } from './mapper';
import type { OrderItemRelationsService } from '../order-item-relations.service';
import type {
  OrderProductRepository,
  OrderRepository,
} from '../repository';
import type {
  OrderClaimHistoryRepository,
  OrderClaimRepository,
  OrderClaimSettlementRepository,
} from './repository';
import type { OrderClaimDetailViewModel } from './view-model';

interface ClaimDetailServiceDependencies {
  orderRepository: OrderRepository;
  orderClaimRepository: OrderClaimRepository;
  orderClaimHistoryRepository: OrderClaimHistoryRepository;
  orderClaimSettlementRepository: OrderClaimSettlementRepository;
  orderItemRelationsService: OrderItemRelationsService;
  productRepository: OrderProductRepository;
}

export interface ClaimDetailService {
  getOrderClaimDetailViewModel(
    userId: string,
    claimId: string,
  ): Promise<OrderClaimDetailViewModel | null>;
}

export function createClaimDetailService({
  orderRepository,
  orderClaimRepository,
  orderClaimHistoryRepository,
  orderClaimSettlementRepository,
  orderItemRelationsService,
  productRepository,
}: ClaimDetailServiceDependencies): ClaimDetailService {
  async function getOrderClaimDetailViewModel(
    userId: string,
    claimId: string,
  ): Promise<OrderClaimDetailViewModel | null> {
    const claim = await orderClaimRepository.findById(claimId);

    if (!claim || claim.user_id !== userId) return null;

    const [order, histories, relations, exchangeProducts, settlements] =
      await Promise.all([
      orderRepository.findById(claim.order_id),
      orderClaimHistoryRepository.findByClaimIds([claim.id]),
      orderItemRelationsService.getOrderItemRelations([claim.order_id]),
      claim.exchange_product_id
        ? productRepository.findByIds([claim.exchange_product_id])
        : [],
      claim.claim_type === 'return'
        ? orderClaimSettlementRepository.findByClaimIds([claim.id])
        : [],
    ]);
    if (!order || order.user_id !== userId) return null;

    const item = requireRelation(
      relations.itemById.get(claim.order_item_id),
      'order_claims.order_item_id -> order_items.id',
      claim.id,
    );

    if (item.order_id !== claim.order_id) {
      throw new DataIntegrityError(
        'order_claims order and order_item mismatch',
        claim.id,
      );
    }

    const exchangeProduct = claim.exchange_product_id
      ? requireRelation(
          exchangeProducts[0],
          'order_claims.exchange_product_id -> products.id',
          claim.id,
        )
      : null;

    if (
      claim.claim_type === 'exchange' &&
      (!exchangeProduct ||
        !claim.exchange_variant_id ||
        !exchangeProduct.variants.some(
          variant => variant.id === claim.exchange_variant_id,
        ))
    ) {
      throw new DataIntegrityError(
        'exchange order_claims require target product and variant',
        claim.id,
      );
    }

    return toOrderClaimDetailViewModel(
      claim,
      requireRelation(order, 'order_claims.order_id -> orders.id', claim.id),
      item,
      requireRelation(
        relations.productById.get(item.product_id),
        'order_items.product_id -> products.id',
        item.id,
      ),
      exchangeProduct,
      histories,
      settlements[0] ?? null,
    );
  }

  return { getOrderClaimDetailViewModel };
}
