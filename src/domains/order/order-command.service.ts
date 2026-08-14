import { colorMap, getProductSalePrice } from '@/domains/product';
import type { Product } from '@/domains/product';
import {
  calculateCancellationRefundAllocations,
  getOrderActionEligibility,
} from './domain';
import type {
  OrderDTO,
  OrderItemCancellationDTO,
  OrderItemDTO,
  OrderPaymentTransactionDTO,
  OrderStatusHistoryDTO,
} from './dto';
import type {
  OrderItemCancellationRepository,
  OrderItemRepository,
  OrderMutationRepository,
  OrderRepository,
} from './repository';

const FREE_SHIPPING_THRESHOLD = 50_000;
const SHIPPING_FEE = 3_000;

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
  cancelOrderItems(orderId: string, orderItemIds: string[]): Promise<void>;
}

interface ProductLookupRepository {
  findByIds(ids: number[]): Promise<Product[]>;
}

interface OrderCommandServiceDependencies {
  orderRepository: OrderRepository;
  orderItemRepository: OrderItemRepository;
  orderItemCancellationRepository: OrderItemCancellationRepository;
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

function getShippingFee(itemTotalAmount: number): number {
  return itemTotalAmount === 0 || itemTotalAmount >= FREE_SHIPPING_THRESHOLD
    ? 0
    : SHIPPING_FEE;
}

function getOrderLevelDiscountAmount(
  order: OrderDTO,
  items: readonly OrderItemDTO[],
): number {
  const directDiscountAmount = items.reduce(
    (total, item) => total + item.discount_amount,
    0,
  );
  return Math.max(0, order.discount_amount - directDiscountAmount);
}

function getPointUsageAmount(order: OrderDTO, items: readonly OrderItemDTO[]): number {
  const itemTotalAmount = items.reduce(
    (total, item) => total + item.line_total_amount,
    0,
  );
  return Math.max(0, itemTotalAmount + order.shipping_fee - order.total_amount);
}

export function createOrderCommandService({
  orderRepository,
  orderItemRepository,
  orderItemCancellationRepository,
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
    const shippingFee = getShippingFee(itemTotalAmount);
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

  async function cancelOrderItems(
    orderId: string,
    orderItemIds: string[],
  ): Promise<void> {
    const order = await orderRepository.findById(orderId);
    if (!order || !getOrderActionEligibility(order.status).canCancel) {
      throw new Error('현재 취소할 수 없는 주문입니다.');
    }

    const [items, existingCancellations] = await Promise.all([
      orderItemRepository.findByOrderIds([orderId]),
      orderItemCancellationRepository.findByOrderIds([orderId]),
    ]);
    const cancellationByItemId = new Map(
      existingCancellations.map(cancellation => [
        cancellation.order_item_id,
        cancellation,
      ]),
    );
    const targetItems = items.filter(
      item => orderItemIds.includes(item.id) && !cancellationByItemId.has(item.id),
    );
    if (targetItems.length === 0) {
      throw new Error('이미 취소되었거나 선택할 수 없는 상품입니다.');
    }

    const allItemRefundInputs = items.map(item => ({
      itemId: item.id,
      itemAmount: item.line_total_amount,
    }));
    const remainingItemAmount = items
      .filter(item => !cancellationByItemId.has(item.id))
      .filter(item => !orderItemIds.includes(item.id))
      .reduce((total, item) => total + item.line_total_amount, 0);
    const shippingAdjustmentAmount =
      order.shipping_fee === 0 &&
      remainingItemAmount > 0 &&
      remainingItemAmount < FREE_SHIPPING_THRESHOLD
        ? SHIPPING_FEE
        : 0;
    const orderBenefitAllocationByItemId = new Map(
      calculateCancellationRefundAllocations({
        cancelledItems: allItemRefundInputs,
        orderDiscountAmount: getOrderLevelDiscountAmount(order, items),
        pointUsageAmount: getPointUsageAmount(order, items),
      }).map(allocation => [allocation.itemId, allocation]),
    );
    const shippingAdjustmentByItemId = new Map(
      calculateCancellationRefundAllocations({
        cancelledItems: targetItems.map(item => ({
          itemId: item.id,
          itemAmount: item.line_total_amount,
        })),
        orderDiscountAmount: 0,
        pointUsageAmount: 0,
        shippingAdjustmentAmount,
      }).map(allocation => [allocation.itemId, allocation.shippingAdjustmentAmount]),
    );
    const occurredAt = now().toISOString();
    const cancellations: OrderItemCancellationDTO[] = targetItems.map(
      (item, index) => {
        const allocation = orderBenefitAllocationByItemId.get(item.id);
        if (!allocation) throw new Error('환불 금액을 계산할 수 없습니다.');
        const itemShippingAdjustment = shippingAdjustmentByItemId.get(item.id) ?? 0;
        const refundAmount = Math.max(
          0,
          allocation.refundAmount - itemShippingAdjustment,
        );

        return {
          id: createId('order-cancellation', occurredAt, index),
          order_id: orderId,
          order_item_id: item.id,
          cancelled_at: occurredAt,
          refund_amount: refundAmount,
          refund_status: 'completed',
          refund_expected_at: null,
          refunded_at: occurredAt,
          allocation: {
            item_amount: allocation.itemAmount,
            order_discount_amount: allocation.orderDiscountAmount,
            point_usage_amount: allocation.pointUsageAmount,
            shipping_adjustment_amount: itemShippingAdjustment,
          },
        };
      },
    );
    const allItemsCancelled =
      existingCancellations.length + cancellations.length === items.length;
    const updatedOrder: OrderDTO = allItemsCancelled
      ? { ...order, status: 'cancelled', cancelled_at: occurredAt }
      : order;
    const histories: OrderStatusHistoryDTO[] = allItemsCancelled
      ? [
          {
            id: createId('order-history', occurredAt),
            order_id: orderId,
            status: 'cancelled',
            occurred_at: occurredAt,
          },
        ]
      : [];
    const refunds: OrderPaymentTransactionDTO[] = cancellations.map(
      (cancellation, index) => ({
        id: createId('order-refund', occurredAt, index),
        order_id: orderId,
        type: 'refund',
        amount: cancellation.refund_amount,
        payment_method: order.payment_method,
        occurred_at: occurredAt,
        order_item_cancellation_id: cancellation.id,
      }),
    );

    await orderMutationRepository.createOrderItemCancellations(cancellations);
    await orderMutationRepository.replaceOrder(updatedOrder);
    await orderMutationRepository.createOrderStatusHistories(histories);
    await orderMutationRepository.createPaymentTransactions(refunds);
  }

  return { createDemoOrder, cancelOrderItems };
}
