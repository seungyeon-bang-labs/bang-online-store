import type {
  OrderItemRepository,
  OrderRepository,
} from '@/domains/order/repository';
import type { Product } from '@/domains/product';
import {
  hasValidInquiryWriteEntryContext,
  type InquiryWriteEntryContext,
} from './domain';
import { toInquiryWriteViewModel } from './write.mapper';
import type { InquiryWriteViewModel } from './write.view-model';

interface InquiryWriteProductRepository {
  findMany(): Promise<Product[]>;
}

interface InquiryWriteServiceDependencies {
  orderRepository: OrderRepository;
  orderItemRepository: OrderItemRepository;
  productRepository: InquiryWriteProductRepository;
}

export interface InquiryWriteService {
  getInquiryWriteViewModel(
    userId: string,
    entryContext: InquiryWriteEntryContext | null,
  ): Promise<InquiryWriteViewModel | null>;
}

export function createInquiryWriteService({
  orderRepository,
  orderItemRepository,
  productRepository,
}: InquiryWriteServiceDependencies): InquiryWriteService {
  async function getInquiryWriteViewModel(
    userId: string,
    entryContext: InquiryWriteEntryContext | null,
  ): Promise<InquiryWriteViewModel | null> {
    const [orders, products] = await Promise.all([
      orderRepository.findByUserId(userId),
      productRepository.findMany(),
    ]);
    const items = await orderItemRepository.findByOrderIds(
      orders.map(order => order.id),
    );

    if (!hasValidInquiryWriteEntryContext(entryContext, orders, items, products)) {
      return null;
    }

    return toInquiryWriteViewModel({ orders, items, products, entryContext });
  }

  return { getInquiryWriteViewModel };
}
