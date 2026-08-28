import {
  getInquiryActionEligibility,
  validateInquiryTextInput,
  type InquiryTextInput,
} from './domain';
import {
  toInquiryEditEntryContext,
  toInquiryEditViewModel,
} from './edit.mapper';
import type { InquiryEditViewModel } from './edit.view-model';
import type { InquiryRepository } from './repository';
import type { InquiryWriteService } from './write.service';

export interface InquiryEditServiceDependencies {
  inquiryRepository: InquiryRepository;
  inquiryWriteService: InquiryWriteService;
}

export interface InquiryEditService {
  getInquiryEditViewModel(
    userId: string,
    inquiryId: string,
  ): Promise<InquiryEditViewModel | null>;
  updateInquiry(
    userId: string,
    inquiryId: string,
    input: InquiryTextInput,
  ): Promise<boolean>;
}

export function createInquiryEditService({
  inquiryRepository,
  inquiryWriteService,
}: InquiryEditServiceDependencies): InquiryEditService {
  async function getInquiryEditViewModel(
    userId: string,
    inquiryId: string,
  ): Promise<InquiryEditViewModel | null> {
    const inquiry = await inquiryRepository.findByIdAndUserId(inquiryId, userId);
    if (!inquiry || !getInquiryActionEligibility(inquiry.status).canEdit) {
      return null;
    }

    const writeViewModel = await inquiryWriteService.getInquiryWriteViewModel(
      userId,
      toInquiryEditEntryContext(inquiry),
    );
    if (!writeViewModel) return null;

    return toInquiryEditViewModel(inquiry, writeViewModel);
  }

  async function updateInquiry(
    userId: string,
    inquiryId: string,
    input: InquiryTextInput,
  ): Promise<boolean> {
    const inquiry = await inquiryRepository.findByIdAndUserId(inquiryId, userId);
    if (!inquiry || !getInquiryActionEligibility(inquiry.status).canEdit) {
      return false;
    }

    const { isTitleValid, isContentValid } = validateInquiryTextInput(input);
    if (!isTitleValid || !isContentValid) return false;

    return true;
  }

  return { getInquiryEditViewModel, updateInquiry };
}
