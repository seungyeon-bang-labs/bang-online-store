import { orderRepository } from '@/domains/order';
import { orderItemRepository } from '@/domains/order';
import { productRepository } from '@/domains/product';
import { fixtureInquiryRepository } from './fixture-repository';
import { createInquiryService } from './service';

export * from './domain';
export * from './dto';
export * from './inquiry-context-resolver';
export * from './mapper';
export * from './repository';
export * from './service';
export * from './view-model';

export const inquiryRepository = fixtureInquiryRepository;

const inquiryService = createInquiryService({
  inquiryRepository,
  orderRepository,
  orderItemRepository,
  productRepository,
});

export const getInquiryPageViewModel =
  inquiryService.getInquiryPageViewModel;
