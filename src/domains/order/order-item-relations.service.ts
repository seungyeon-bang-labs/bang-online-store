import type { Product } from '@/domains/product/product.dto';
import type { OrderItemDTO } from './dto';
import type {
  OrderItemRepository,
  OrderProductRepository,
} from './repository';

export interface OrderItemRelations {
  itemsByOrderId: ReadonlyMap<string, OrderItemDTO[]>;
  itemById: ReadonlyMap<string, OrderItemDTO>;
  productById: ReadonlyMap<number, Product>;
}

interface OrderItemRelationsServiceDependencies {
  orderItemRepository: OrderItemRepository;
  productRepository: OrderProductRepository;
}

export interface OrderItemRelationsService {
  getOrderItemRelations(orderIds: string[]): Promise<OrderItemRelations>;
}

export function createOrderItemRelationsService({
  orderItemRepository,
  productRepository,
}: OrderItemRelationsServiceDependencies): OrderItemRelationsService {
  async function getOrderItemRelations(
    orderIds: string[],
  ): Promise<OrderItemRelations> {
    const orderItems = await orderItemRepository.findByOrderIds(orderIds);
    const products = await productRepository.findByIds(
      Array.from(new Set(orderItems.map(item => item.product_id))),
    );
    const itemsByOrderId = new Map<string, OrderItemDTO[]>();

    orderItems.forEach(item => {
      const items = itemsByOrderId.get(item.order_id) ?? [];
      items.push(item);
      itemsByOrderId.set(item.order_id, items);
    });

    return {
      itemsByOrderId,
      itemById: new Map(orderItems.map(item => [item.id, item])),
      productById: new Map(products.map(product => [product.id, product])),
    };
  }

  return { getOrderItemRelations };
}
