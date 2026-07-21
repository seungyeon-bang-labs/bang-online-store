import {
  MypageDataIntegrityError,
  requireMypageRelation,
} from '@/domains/mypage/mypage-data-integrity.error';
import { paginate } from '@/domains/mypage/mypage-pagination';
import { filterOrderClaims, filterOrders } from './order.domain';
import type { OrderClaimListQuery, OrderListQuery } from './order.domain';
import type { OrderItemDTO } from './order.dto';
import {
  toOrderClaimViewModel,
  toOrderListItemViewModel,
} from './order.mapper';
import type {
  OrderClaimRepository,
  OrderItemRepository,
  OrderProductRepository,
  OrderRepository,
} from './order.repository';
import type {
  OrderClaimPageViewModel,
  OrderListItemViewModel,
  OrderListPageViewModel,
} from './order.view-model';

export interface OrderServiceDependencies {
  orderRepository: OrderRepository;
  orderItemRepository: OrderItemRepository;
  orderClaimRepository: OrderClaimRepository;
  productRepository: OrderProductRepository;
}

export interface OrderService {
  getOrderItemsByUserId(
    userId: string,
  ): Promise<OrderListItemViewModel[]>;
  getOrderListViewModel(
    userId: string,
    query: OrderListQuery,
    now?: Date,
  ): Promise<OrderListPageViewModel>;
  getOrderClaimListViewModel(
    userId: string,
    query: OrderClaimListQuery,
  ): Promise<OrderClaimPageViewModel>;
}

export function createOrderService({
  orderRepository,
  orderItemRepository,
  orderClaimRepository,
  productRepository,
}: OrderServiceDependencies): OrderService {
  async function getOrderItemsByUserId(
    userId: string,
  ): Promise<OrderListItemViewModel[]> {
    const orders = await orderRepository.findByUserId(userId);
    const orderItems = await orderItemRepository.findByOrderIds(
      orders.map(order => order.id),
    );
    const products = await productRepository.findByIds(
      Array.from(new Set(orderItems.map(item => item.product_id))),
    );
    const productById = new Map(
      products.map(product => [product.id, product]),
    );
    const itemsByOrderId = new Map<string, OrderItemDTO[]>();

    orderItems.forEach(item => {
      const bucket = itemsByOrderId.get(item.order_id) ?? [];
      bucket.push(item);
      itemsByOrderId.set(item.order_id, bucket);
    });

    return orders
      .sort((a, b) => b.ordered_at.localeCompare(a.ordered_at))
      .map(order =>
        toOrderListItemViewModel(
          order,
          (itemsByOrderId.get(order.id) ?? []).map(item => ({
            item,
            product: requireMypageRelation(
              productById.get(item.product_id),
              'order_items.product_id -> products.id',
              item.id,
            ),
          })),
        ),
      );
  }

  async function getOrderListViewModel(
    userId: string,
    query: OrderListQuery,
    now = new Date(),
  ): Promise<OrderListPageViewModel> {
    const rows = await orderRepository.findByUserId(userId);
    const allowedIds = new Set(
      filterOrders(rows, query, now).map(order => order.id),
    );
    const items = (await getOrderItemsByUserId(userId)).filter(order =>
      allowedIds.has(order.id),
    );

    return paginate(items, query.page, 3);
  }

  async function getOrderClaimListViewModel(
    userId: string,
    query: OrderClaimListQuery,
  ): Promise<OrderClaimPageViewModel> {
    const [claims, orders] = await Promise.all([
      orderClaimRepository.findByUserId(userId),
      orderRepository.findByUserId(userId),
    ]);
    const orderItems = await orderItemRepository.findByOrderIds(
      orders.map(order => order.id),
    );
    const orderById = new Map(orders.map(order => [order.id, order]));
    const itemById = new Map(orderItems.map(item => [item.id, item]));
    const filtered = filterOrderClaims(claims, query);

    return paginate(
      filtered.map(claim => {
        const order = requireMypageRelation(
          orderById.get(claim.order_id),
          'order_claims.order_id -> orders.id',
          claim.id,
        );
        const item = requireMypageRelation(
          itemById.get(claim.order_item_id),
          'order_claims.order_item_id -> order_items.id',
          claim.id,
        );

        if (item.order_id !== order.id) {
          throw new MypageDataIntegrityError(
            'order_claims order and order_item mismatch',
            claim.id,
          );
        }

        return toOrderClaimViewModel(claim, order, item);
      }),
      query.page,
      3,
    );
  }

  return {
    getOrderItemsByUserId,
    getOrderListViewModel,
    getOrderClaimListViewModel,
  };
}
