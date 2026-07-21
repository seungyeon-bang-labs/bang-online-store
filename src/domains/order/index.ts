import { productRepository } from '@/domains/product';
import {
  fixtureOrderClaimRepository,
  fixtureOrderItemRepository,
  fixtureOrderRepository,
} from './order.fixture-repository';
import { createOrderService } from './order.service';

export * from './order.domain';
export * from './order.dto';
export * from './order.fixture';
export * from './order.mapper';
export * from './order.repository';
export * from './order.service';
export * from './order.view-model';

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
