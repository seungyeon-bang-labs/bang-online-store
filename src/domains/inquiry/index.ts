import { orderRepository } from '@/domains/order';
import { orderItemRepository } from '@/domains/order';
import { productService } from '@/domains/product';
import { categoryRepository } from '@/domains/category';
import { fixtureInquiryRepository } from './fixture-repository';
import { createInquiryCancelService } from './cancel.service';
import { createInquiryEditService } from './edit.service';
import { createInquiryService } from './service';
import { createInquiryWriteService } from './write.service';

export * from './domain';
export * from './dto';
export * from './cancel.service';
export * from './edit.service';
export * from './edit.view-model';
export * from './inquiry-context-resolver';
export * from './mapper';
export * from './repository';
export * from './service';
export * from './view-model';
export * from './write.service';
export * from './write.view-model';

export const inquiryRepository = fixtureInquiryRepository;

const inquiryService = createInquiryService({
  inquiryRepository,
  orderRepository,
  orderItemRepository,
  productRepository: productService,
});

const inquiryWriteService = createInquiryWriteService({
  inquiryRepository,
  orderRepository,
  orderItemRepository,
  productRepository: productService,
  categoryRepository,
});

const inquiryEditService = createInquiryEditService({
  inquiryRepository,
  inquiryWriteService,
});

const inquiryCancelService = createInquiryCancelService({
  inquiryRepository,
});

export const getInquiryPageViewModel =
  inquiryService.getInquiryPageViewModel;
export const getInquiryWriteViewModel =
  inquiryWriteService.getInquiryWriteViewModel;
export const createInquiry = inquiryWriteService.createInquiry;
export const getInquiryEditViewModel =
  inquiryEditService.getInquiryEditViewModel;
export const getInquiryEditPageViewModel =
  inquiryEditService.getInquiryEditPageViewModel;
export const updateInquiry = inquiryEditService.updateInquiry;
export const cancelInquiry = inquiryCancelService.cancelInquiry;
