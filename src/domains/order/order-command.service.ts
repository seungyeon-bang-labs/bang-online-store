import { colorMap, getProductSalePrice } from '@/domains/product';
import type { Product } from '@/domains/product';
import { getOrderShippingFee } from './domain';
import type {
  OrderDTO,
  OrderItemDTO,
  OrderPaymentTransactionDTO,
  OrderStatusHistoryDTO,
} from './dto';
import type {
  OrderMutationRepository,
} from './repository';

export interface DemoOrderCartItem {
  productId: number;
  variantId: string;
  quantity: number;
}

export interface CreateDemoOrderInput {
  userId: string;
  recipientName: string;
  recipientPhone: string;
  postalCode: string;
  shippingAddressText: string;
  items: DemoOrderCartItem[];
}

export interface OrderCommandService {
  createDemoOrder(input: CreateDemoOrderInput): Promise<string>;
}

interface ProductLookupRepository {
  findByIds(ids: number[]): Promise<Product[]>;
}

interface OrderCommandServiceDependencies {
  orderMutationRepository: OrderMutationRepository;
  productRepository: ProductLookupRepository;
  now?: () => Date;
}

function createId(prefix: string, value: string, index = 0): string {
  return `${prefix}-${value.replace(/[^0-9]/g, '').slice(-12)}-${index}`;
}

function getOrderNumber(now: Date): string {
  const date = now.toISOString().slice(0, 10).replaceAll('-', '');
  return `DEMO-${date}-${String(now.getTime()).slice(-6)}`;
}

function toOrderItem(
  orderId: string,
  product: Product,
  variantId: string,
  quantity: number,
  now: string,
  index: number,
): OrderItemDTO {
  const variant = product.variants.find(item => item.id === variantId);
  if (!variant || variant.stock < quantity || quantity <= 0) {
    throw new Error('주문할 수 없는 상품 옵션입니다.');
  }

  const color = colorMap.find(item => item.id === product.colorId);
  const unitPrice = product.price + variant.price_offset;
  const salePrice = getProductSalePrice({
    ...product,
    price: unitPrice,
  });
  const discountAmount = (unitPrice - salePrice) * quantity;

  return {
    id: createId('order-item', now, index),
    order_id: orderId,
    product_id: product.id,
    variant_id: variant.id,
    product_name: product.name,
    option_label: `${color?.label ?? '옵션'} / ${variant.size}`,
    quantity,
    unit_price: unitPrice,
    discount_amount: discountAmount,
    line_total_amount: salePrice * quantity,
    created_at: now,
  };
}

export function createOrderCommandService({
  orderMutationRepository,
  productRepository,
  now = () => new Date(),
}: OrderCommandServiceDependencies): OrderCommandService {
  async function createDemoOrder(input: CreateDemoOrderInput): Promise<string> {
    const timestamp = now();
    const occurredAt = timestamp.toISOString();
    const products = await productRepository.findByIds(
      input.items.map(item => item.productId),
    );
    const productById = new Map(products.map(product => [product.id, product]));
    const orderId = createId('order', occurredAt);
    const items = input.items.map((item, index) => {
      const product = productById.get(item.productId);
      if (!product || product.state !== 'active') {
        throw new Error('주문할 수 없는 상품입니다.');
      }
      return toOrderItem(
        orderId,
        product,
        item.variantId,
        item.quantity,
        occurredAt,
        index,
      );
    });

    if (items.length === 0) {
      throw new Error('주문할 상품을 선택해 주세요.');
    }

    const subtotalAmount = items.reduce(
      (total, item) => total + item.unit_price * item.quantity,
      0,
    );
    const discountAmount = items.reduce(
      (total, item) => total + item.discount_amount,
      0,
    );
    const itemTotalAmount = subtotalAmount - discountAmount;
    const shippingFee = getOrderShippingFee(itemTotalAmount);
    const totalAmount = itemTotalAmount + shippingFee;
    const order: OrderDTO = {
      id: orderId,
      order_number: getOrderNumber(timestamp),
      user_id: input.userId,
      status: 'payment_completed',
      ordered_at: occurredAt,
      payment_due_at: null,
      paid_at: occurredAt,
      estimated_delivery_at: null,
      delivered_at: null,
      cancelled_at: null,
      subtotal_amount: subtotalAmount,
      discount_amount: discountAmount,
      shipping_fee: shippingFee,
      total_amount: totalAmount,
      recipient_name: input.recipientName,
      recipient_phone: input.recipientPhone,
      shipping_address_text: input.shippingAddressText,
      postal_code: input.postalCode,
      payment_method: '신용카드',
    };
    const histories: OrderStatusHistoryDTO[] = [
      {
        id: createId('order-history', occurredAt, 0),
        order_id: orderId,
        status: 'order_received',
        occurred_at: occurredAt,
      },
      {
        id: createId('order-history', occurredAt, 1),
        order_id: orderId,
        status: 'payment_completed',
        occurred_at: occurredAt,
      },
    ];
    const payment: OrderPaymentTransactionDTO = {
      id: createId('order-payment', occurredAt),
      order_id: orderId,
      type: 'payment',
      amount: totalAmount,
      payment_method: order.payment_method,
      occurred_at: occurredAt,
      order_item_cancellation_id: null,
    };

    await orderMutationRepository.createOrder(order);
    await orderMutationRepository.createOrderItems(items);
    await orderMutationRepository.createOrderStatusHistories(histories);
    await orderMutationRepository.createPaymentTransactions([payment]);
    return orderId;
  }

  return { createDemoOrder };
}
