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
import type { OrderClaimRepository } from './repository';
import type { OrderClaimPageViewModel } from './view-model';

interface ClaimListServiceDependencies {
  orderRepository: OrderRepository;
  orderClaimRepository: OrderClaimRepository;
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
    const relations = await orderItemRelationsService.getOrderItemRelations(
      orders.map(order => order.id),
    );
    const orderById = new Map(orders.map(order => [order.id, order]));
    const filteredClaims = filterOrderClaims(claims, query);

    return paginate(
      filteredClaims.map(claim => {
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
        );
      }),
      query.page,
      10,
    );
  }

  return { getOrderClaimListViewModel };
}
