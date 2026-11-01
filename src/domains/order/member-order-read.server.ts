import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { productService } from '@/domains/product';
import type { Database } from '@/shared/types/supabase';
import { createOrderDetailService } from './order-detail.service';
import { createOrderItemRelationsService } from './order-item-relations.service';
import { createOrderListService } from './order-list.service';
import type { OrderItemCancellationRepository } from './repository';
import {
  createOrderItemRepository,
  createOrderRepository,
  createOrderStatusHistoryRepository,
} from './supabase-repository.server';

// DB 주문 취소는 다음 작업에서 연결한다. 그 전까지 DB 주문에는 취소 내역이 없다.
const noOrderItemCancellations: OrderItemCancellationRepository = {
  findByOrderIds: async () => [],
  findByOrderItemIds: async () => [],
};

/** 요청한 회원의 세션으로 DB 주문을 읽는 서비스. 소유권은 RLS가 보장한다. */
export function createMemberOrderReadServices(
  client: SupabaseClient<Database>,
) {
  const orderRepository = createOrderRepository(client);
  const orderItemRelationsService = createOrderItemRelationsService({
    orderItemRepository: createOrderItemRepository(client),
    productRepository: productService,
  });
  const { getOrderListViewModel } = createOrderListService({
    orderRepository,
    orderItemCancellationRepository: noOrderItemCancellations,
    orderItemRelationsService,
  });
  const { getOrderDetailViewModel } = createOrderDetailService({
    orderRepository,
    orderItemCancellationRepository: noOrderItemCancellations,
    orderStatusHistoryRepository: createOrderStatusHistoryRepository(client),
    orderItemRelationsService,
  });

  return {
    orderRepository,
    orderItemRelationsService,
    getOrderListViewModel,
    getOrderDetailViewModel,
  };
}
