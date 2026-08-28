import { paginate, type PageSlice } from '@/shared/lib/pagination';
import type {
  OrderItemRepository,
  OrderRepository,
} from '@/domains/order/repository';
import type { Product } from '@/domains/product/product.dto';
import {
  filterInquiries,
  INQUIRY_PAGE_SIZE,
  isVisibleInquiryStatus,
  type InquiryListQuery,
} from './domain';
import { createInquiryContextResolver } from './inquiry-context-resolver';
import { toInquiryViewModel } from './mapper';
import type { InquiryRepository } from './repository';
import type { InquiryViewModel } from './view-model';

interface InquiryProductRepository {
  findByIds(ids: number[]): Promise<Product[]>;
}

export interface InquiryServiceDependencies {
  inquiryRepository: InquiryRepository;
  orderRepository: OrderRepository;
  orderItemRepository: OrderItemRepository;
  productRepository: InquiryProductRepository;
}

export interface InquiryService {
  getInquiryPageViewModel(
    userId: string,
    query: InquiryListQuery,
  ): Promise<PageSlice<InquiryViewModel>>;
}

export function createInquiryService({
  inquiryRepository,
  orderRepository,
  orderItemRepository,
  productRepository,
}: InquiryServiceDependencies): InquiryService {
  async function getInquiryPageViewModel(
    userId: string,
    query: InquiryListQuery,
  ): Promise<PageSlice<InquiryViewModel>> {
    const [inquiries, orders] = await Promise.all([
      inquiryRepository.findByUserId(userId),
      orderRepository.findByUserId(userId),
    ]);
    const page = paginate(
      filterInquiries(
        inquiries.filter(inquiry => isVisibleInquiryStatus(inquiry.status)),
        query,
      ),
      query.page,
      INQUIRY_PAGE_SIZE,
    );
    const orderItems = await orderItemRepository.findByOrderIds(
      orders.map(order => order.id),
    );
    const products = await productRepository.findByIds(
      Array.from(
        new Set([
          ...page.items.flatMap(inquiry =>
            inquiry.product_id === null ? [] : [inquiry.product_id],
          ),
          ...orderItems.map(item => item.product_id),
        ]),
      ),
    );
    const orderById = new Map(orders.map(order => [order.id, order]));
    const productById = new Map(products.map(product => [product.id, product]));
    const itemById = new Map(orderItems.map(item => [item.id, item]));
    const itemsByOrderId = new Map<string, typeof orderItems>();

    for (const item of orderItems) {
      const items = itemsByOrderId.get(item.order_id) ?? [];
      items.push(item);
      itemsByOrderId.set(item.order_id, items);
    }

    const contextResolver = createInquiryContextResolver({
      orderById,
      itemById,
      itemsByOrderId,
      productById,
    });

    return {
      ...page,
      items: page.items.map(inquiry =>
        toInquiryViewModel(inquiry, contextResolver.resolve(inquiry)),
      ),
    };
  }

  return { getInquiryPageViewModel };
}
