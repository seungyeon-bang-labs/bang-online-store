import { productRepository } from '@/domains/product';
import {
  fixtureOrderClaimRepository,
  fixtureOrderItemCancellationRepository,
  fixtureOrderItemRepository,
  fixtureOrderRepository,
  fixtureOrderStatusHistoryRepository,
} from './fixture-repository';
import { createClaimListService } from './claim-list.service';
import { createOrderDetailService } from './order-detail.service';
import { createOrderItemRelationsService } from './order-item-relations.service';
import { createOrderListService } from './order-list.service';

export * from './domain';
export * from './dto';
export * from './fixture';
export * from './mapper';
export * from './repository';
export * from './view-model';

export const orderClaimRepository = fixtureOrderClaimRepository;
export const orderItemCancellationRepository =
  fixtureOrderItemCancellationRepository;
export const orderItemRepository = fixtureOrderItemRepository;
export const orderRepository = fixtureOrderRepository;
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
