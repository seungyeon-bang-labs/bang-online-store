import { productRepository } from '@/domains/product';
import {
  fixtureOrderClaimRepository,
  fixtureOrderItemCancellationRepository,
  fixtureOrderItemRepository,
  fixtureOrderMutationRepository,
  fixtureOrderPaymentTransactionRepository,
  fixtureOrderRepository,
  fixtureOrderStatusHistoryRepository,
} from './fixture-repository';
import { createOrderCommandService } from './order-command.service';
import { createClaimListService } from './claim-list.service';
import { createOrderDetailService } from './order-detail.service';
import { createOrderItemRelationsService } from './order-item-relations.service';
import { createOrderListService } from './order-list.service';

export * from './domain';
export * from './dto';
export * from './fixture';
export * from './mapper';
export * from './order-command.service';
export * from './repository';
export * from './view-model';

export const orderClaimRepository = fixtureOrderClaimRepository;
export const orderItemCancellationRepository =
  fixtureOrderItemCancellationRepository;
export const orderItemRepository = fixtureOrderItemRepository;
export const orderRepository = fixtureOrderRepository;
export const orderMutationRepository = fixtureOrderMutationRepository;
export const orderPaymentTransactionRepository =
  fixtureOrderPaymentTransactionRepository;
export const orderStatusHistoryRepository =
  fixtureOrderStatusHistoryRepository;

const orderItemRelationsService = createOrderItemRelationsService({
  orderItemRepository,
  productRepository,
});

const orderListService = createOrderListService({
  orderRepository,
  orderItemCancellationRepository,
  orderItemRelationsService,
});

const orderDetailService = createOrderDetailService({
  orderRepository,
  orderItemCancellationRepository,
  orderStatusHistoryRepository,
  orderItemRelationsService,
});

const orderCommandService = createOrderCommandService({
  orderRepository,
  orderItemRepository,
  orderItemCancellationRepository,
  orderMutationRepository,
  productRepository,
});

const claimListService = createClaimListService({
  orderRepository,
  orderClaimRepository,
  orderItemRelationsService,
});

export const getOrderListViewModel =
  orderListService.getOrderListViewModel;
export const getOrderDetailViewModel =
  orderDetailService.getOrderDetailViewModel;
export const getOrderClaimListViewModel =
  claimListService.getOrderClaimListViewModel;
export const createDemoOrder = orderCommandService.createDemoOrder;
export const cancelOrderItems = orderCommandService.cancelOrderItems;
