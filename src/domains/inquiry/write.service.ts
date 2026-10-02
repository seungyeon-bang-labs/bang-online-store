import type {
  OrderItemRepository,
  OrderRepository,
} from '@/domains/order/repository';
import type { ProductModel } from '@/domains/product';
import {
  getInquiryContextRequirement,
  hasValidInquiryWriteEntryContext,
  validateInquiryTextInput,
  type InquiryWriteEntryContext,
} from './domain';
import type { InquiryDTO, InquiryType } from './dto';
import { toInquiryWriteViewModel } from './write.mapper';
import type { InquiryWriteViewModel } from './write.view-model';
import type { InquiryRepository } from './repository';

interface InquiryWriteProductRepository {
  findMany(): Promise<ProductModel[]>;
}

interface InquiryWriteCategoryRepository {
  findMany(): Promise<
    readonly { id: string; parent_id: string | null }[]
  >;
}

interface InquiryWriteServiceDependencies {
  inquiryRepository: InquiryRepository;
  orderRepository: OrderRepository;
  orderItemRepository: OrderItemRepository;
  productRepository: InquiryWriteProductRepository;
  categoryRepository: InquiryWriteCategoryRepository;
}

export interface InquiryWriteService {
  getInquiryWriteViewModel(
    userId: string,
    entryContext: InquiryWriteEntryContext | null,
  ): Promise<InquiryWriteViewModel | null>;
  createInquiry(
    userId: string,
    input: {
      type: InquiryType;
      title: string;
      content: string;
      orderId: string;
      orderItemId: string;
      productId: string;
    },
  ): Promise<boolean>;
}

export function createInquiryWriteService({
  inquiryRepository,
  orderRepository,
  orderItemRepository,
  productRepository,
  categoryRepository,
}: InquiryWriteServiceDependencies): InquiryWriteService {
  async function getInquiryWriteViewModel(
    userId: string,
    entryContext: InquiryWriteEntryContext | null,
  ): Promise<InquiryWriteViewModel | null> {
    const [orders, products, categories] = await Promise.all([
      orderRepository.findByUserId(userId),
      productRepository.findMany(),
      categoryRepository.findMany(),
    ]);
    const items = await orderItemRepository.findByOrderIds(
      orders.map(order => order.id),
    );

    if (!hasValidInquiryWriteEntryContext(entryContext, orders, items, products)) {
      return null;
    }

    return toInquiryWriteViewModel({
      orders,
      items,
      products,
      categories,
      entryContext,
    });
  }

  async function createInquiry(
    userId: string,
    input: {
      type: InquiryType;
      title: string;
      content: string;
      orderId: string;
      orderItemId: string;
      productId: string;
    },
  ): Promise<boolean> {
    const { isTitleValid, isContentValid } = validateInquiryTextInput(input);
    if (!isTitleValid || !isContentValid) return false;

    const requirement = getInquiryContextRequirement(input.type);
    const entryContext: InquiryWriteEntryContext | null =
      requirement === 'product'
        ? input.productId
          ? { productId: Number(input.productId) }
          : null
        : requirement === 'order-item'
          ? input.orderId && input.orderItemId
            ? { orderId: input.orderId, orderItemId: input.orderItemId }
            : null
          : requirement === 'order'
            ? input.orderId
              ? { orderId: input.orderId }
              : null
            : null;
    const viewModel = await getInquiryWriteViewModel(userId, entryContext);
    if (!viewModel || (requirement !== 'none' && !entryContext)) return false;

    const createdAt = new Date().toISOString();
    const inquiry: InquiryDTO = {
      id: crypto.randomUUID(),
      user_id: userId,
      inquiry_type: input.type,
      order_id: input.orderId || null,
      order_item_id: input.orderItemId || null,
      product_id: input.productId ? Number(input.productId) : null,
      title: input.title.trim(),
      content: input.content.trim(),
      status: 'pending',
      answer_content: null,
      answered_at: null,
      created_at: createdAt,
      updated_at: createdAt,
    };
    await inquiryRepository.create(inquiry);
    return true;
  }

  return { getInquiryWriteViewModel, createInquiry };
}
