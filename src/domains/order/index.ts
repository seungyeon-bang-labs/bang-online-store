import { productRepository } from '@/domains/product';
import {
  fixtureOrderClaimRepository,
  fixtureOrderItemCancellationRepository,
  fixtureOrderItemRepository,
  fixtureOrderRepository,
} from './fixture-repository';
import { createClaimListService } from './claim-list.service';
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

const orderItemRelationsService = createOrderItemRelationsService({
  orderItemRepository,
  productRepository,
});

const orderListService = createOrderListService({
  orderRepository,
  orderItemCancellationRepository,
  orderItemRelationsService,
});

const claimListService = createClaimListService({
  orderRepository,
  orderClaimRepository,
  orderItemRelationsService,
});

export const getOrderListViewModel =
  orderListService.getOrderListViewModel;
export const getOrderClaimListViewModel =
  claimListService.getOrderClaimListViewModel;
