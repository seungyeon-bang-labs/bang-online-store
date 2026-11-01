import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/supabase';
import type {
  OrderDTO,
  OrderItemDTO,
  OrderPaymentMethod,
  OrderStatusHistoryDTO,
} from './dto';
import type {
  OrderItemRepository,
  OrderRepository,
  OrderStatusHistoryRepository,
} from './repository';

type Tables = Database['public']['Tables'];
type OrderRow = Tables['orders']['Row'];
type OrderItemRow = Tables['order_items']['Row'];
type OrderStatusHistoryRow = Tables['order_status_histories']['Row'];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PAYMENT_METHOD_LABELS: Record<
  OrderRow['payment_method'],
  OrderPaymentMethod
> = {
  card: '신용카드',
};

function toOrderDTO(row: OrderRow): OrderDTO {
  return {
    id: row.id,
    order_number: row.order_number,
    user_id: row.user_id,
    status: row.status,
    ordered_at: row.ordered_at,
    payment_due_at: row.payment_due_at,
    paid_at: row.paid_at,
    estimated_delivery_at: row.estimated_delivery_at,
    delivered_at: row.delivered_at,
    cancelled_at: row.cancelled_at,
    subtotal_amount: row.subtotal_amount,
    discount_amount: row.discount_amount,
    shipping_fee: row.shipping_fee,
    total_amount: row.total_amount,
    recipient_name: row.recipient_name,
    recipient_phone: row.recipient_phone,
    shipping_address_text: [
      row.shipping_address_line_1,
      row.shipping_address_line_2,
    ]
      .filter(Boolean)
      .join(' '),
    postal_code: row.postal_code,
    payment_method: PAYMENT_METHOD_LABELS[row.payment_method],
  };
}

function toOrderItemDTO(row: OrderItemRow): OrderItemDTO {
  return {
    id: row.id,
    order_id: row.order_id,
    product_id: row.product_id,
    variant_id: row.product_variant_id,
    product_name: row.product_name,
    option_label: row.option_label,
    quantity: row.quantity,
    unit_price: row.unit_price,
    discount_amount: row.discount_amount,
    line_total_amount: row.line_total_amount,
    created_at: row.created_at,
  };
}

function toOrderStatusHistoryDTO(
  row: OrderStatusHistoryRow,
): OrderStatusHistoryDTO {
  return {
    id: row.id,
    order_id: row.order_id,
    status: row.status,
    occurred_at: row.occurred_at,
  };
}

function readFailed(error: unknown): never {
  throw new Error('주문 정보를 불러오지 못했습니다.', { cause: error });
}

// Reads rely on the owner-only RLS policies; the user filter keeps queries explicit.
export function createOrderRepository(
  client: SupabaseClient<Database>,
): OrderRepository {
  return {
    async findById(orderId) {
      if (!UUID_PATTERN.test(orderId)) return null;

      const { data, error } = await client
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (error) readFailed(error);

      return data ? toOrderDTO(data) : null;
    },
    async findByIdAndUserId(orderId, userId) {
      if (!UUID_PATTERN.test(orderId)) return null;

      const { data, error } = await client
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) readFailed(error);

      return data ? toOrderDTO(data) : null;
    },
    // 목록·홈은 회원 주문 전체를 읽어 메모리에서 거른다. Data API 행 상한(기본 1,000)을 넘으면
    // 오류 없이 잘리므로, 주문이 늘면 기간·상태 필터와 페이지 나누기를 쿼리로 옮긴다.
    async findByUserId(userId) {
      const { data, error } = await client
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('ordered_at', { ascending: false })
        .order('id');

      if (error) readFailed(error);

      return data.map(toOrderDTO);
    },
  };
}

export function createOrderItemRepository(
  client: SupabaseClient<Database>,
): OrderItemRepository {
  async function findWhereIn(column: 'id' | 'order_id', ids: string[]) {
    const validIds = ids.filter(id => UUID_PATTERN.test(id));

    if (validIds.length === 0) return [];

    const { data, error } = await client
      .from('order_items')
      .select('*')
      .in(column, validIds)
      .order('created_at')
      .order('id');

    if (error) readFailed(error);

    return data.map(toOrderItemDTO);
  }

  return {
    async findById(orderItemId) {
      return (await findWhereIn('id', [orderItemId]))[0] ?? null;
    },
    findByIds: orderItemIds => findWhereIn('id', orderItemIds),
    findByOrderIds: orderIds => findWhereIn('order_id', orderIds),
  };
}

export function createOrderStatusHistoryRepository(
  client: SupabaseClient<Database>,
): OrderStatusHistoryRepository {
  return {
    async findByOrderIds(orderIds) {
      const validIds = orderIds.filter(id => UUID_PATTERN.test(id));

      if (validIds.length === 0) return [];

      const { data, error } = await client
        .from('order_status_histories')
        .select('*')
        .in('order_id', validIds)
        .order('occurred_at')
        .order('id');

      if (error) readFailed(error);

      return data.map(toOrderStatusHistoryDTO);
    },
  };
}
