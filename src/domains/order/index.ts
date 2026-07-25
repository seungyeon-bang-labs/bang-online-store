import { productRepository } from '@/domains/product';
import {
  fixtureOrderClaimRepository,
  fixtureOrderItemRepository,
  fixtureOrderRepository,
} from './fixture-repository';
import { createOrderService } from './service';

export * from './domain';
export * from './dto';
export * from './fixture';
export * from './mapper';
export * from './repository';
export * from './service';
export * from './view-model';

export const orderClaimRepository = fixtureOrderClaimRepository;
export const orderItemRepository = fixtureOrderItemRepository;
export const orderRepository = fixtureOrderRepository;

const orderService = createOrderService({
  orderRepository,
  orderItemRepository,
  orderClaimRepository,
  productRepository,
});

export const getOrderItemsByUserId =
  orderService.getOrderItemsByUserId;
export const getOrderListViewModel =
  orderService.getOrderListViewModel;
export const getOrderClaimListViewModel =
  orderService.getOrderClaimListViewModel;
