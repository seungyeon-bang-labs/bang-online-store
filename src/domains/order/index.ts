import { productRepository } from '@/domains/product';
import {
  fixtureOrderItemCancellationRepository,
  fixtureOrderItemRepository,
  fixtureOrderMutationRepository,
  fixtureOrderPaymentReceiptDetailsRepository,
  fixtureOrderPaymentTransactionRepository,
  fixtureOrderRepository,
  fixtureOrderStatusHistoryRepository,
} from './fixture-repository';
import {
  fixtureOrderClaimRepository,
  fixtureOrderClaimHistoryRepository,
  fixtureOrderClaimSettlementRepository,
} from './claim/fixture-repository';
import { createOrderCommandService } from './order-command.service';
import { createOrderCancellationPreviewService } from './cancellation/preview.service';
import { createOrderCancellationSubmitService } from './cancellation/submit.service';
import { createClaimListService } from './claim/list.service';
import { createClaimDetailService } from './claim/detail.service';
import { createClaimRequestService } from './claim/request.service';
import { createClaimCancelService } from './claim/cancel.service';
import { createOrderDetailService } from './order-detail.service';
import { createOrderItemRelationsService } from './order-item-relations.service';
import { createOrderListService } from './order-list.service';

export * from './domain';
export * from './dto';
export * from './claim';
export * from './cancellation';
export * from './mapper';
export * from './order-command.service';
export * from './repository';
export * from './view-model';

export const orderClaimRepository = fixtureOrderClaimRepository;
export const orderClaimHistoryRepository = fixtureOrderClaimHistoryRepository;
export const orderClaimSettlementRepository =
  fixtureOrderClaimSettlementRepository;
export const orderItemCancellationRepository =
  fixtureOrderItemCancellationRepository;
export const orderItemRepository = fixtureOrderItemRepository;
export const orderRepository = fixtureOrderRepository;
export const orderMutationRepository = fixtureOrderMutationRepository;
export const orderPaymentReceiptDetailsRepository =
  fixtureOrderPaymentReceiptDetailsRepository;
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
  orderMutationRepository,
  productRepository,
});

const orderCancellationPreviewService = createOrderCancellationPreviewService({
  orderRepository,
  orderItemRepository,
  orderItemCancellationRepository,
  productRepository,
});
const orderCancellationSubmitService = createOrderCancellationSubmitService({
  orderRepository,
  orderItemRepository,
  orderItemCancellationRepository,
  orderMutationRepository,
});

const claimListService = createClaimListService({
  orderRepository,
  orderClaimRepository,
  orderClaimHistoryRepository,
  orderClaimSettlementRepository,
  orderItemRelationsService,
});

const claimDetailService = createClaimDetailService({
  orderRepository,
  orderClaimRepository,
  orderClaimHistoryRepository,
  orderClaimSettlementRepository,
  orderItemRelationsService,
  productRepository,
});

const claimRequestService = createClaimRequestService({
  orderRepository,
  orderItemRepository,
  orderClaimRepository,
  orderItemCancellationRepository,
  productRepository,
});

const claimCancelService = createClaimCancelService({
  orderClaimRepository,
});

export const getOrderListViewModel =
  orderListService.getOrderListViewModel;
export const getOrderDetailViewModel =
  orderDetailService.getOrderDetailViewModel;
export const getOrderCancellationPreviewViewModel =
  orderCancellationPreviewService.getOrderCancellationPreviewViewModel;
export const getOrderCancellationRequestViewModel =
  orderCancellationPreviewService.getOrderCancellationRequestViewModel;
export const submitOrderCancellation =
  orderCancellationSubmitService.submitOrderCancellation;
export const getOrderClaimListViewModel =
  claimListService.getOrderClaimListViewModel;
export const getOrderClaimDetailViewModel =
  claimDetailService.getOrderClaimDetailViewModel;
export const getOrderClaimRequestViewModel =
  claimRequestService.getOrderClaimRequestViewModel;
export const cancelOrderClaim = claimCancelService.cancelOrderClaim;
export const createDemoOrder = orderCommandService.createDemoOrder;
