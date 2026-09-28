import {
  getInquiryActionEligibility,
  validateInquiryTextInput,
  type InquiryTextInput,
} from './domain';
import {
  toInquiryEditEntryContext,
  toInquiryEditViewModel,
} from './edit.mapper';
import type {
  InquiryEditPageViewModel,
  InquiryEditViewModel,
  InquiryUpdateResult,
} from './edit.view-model';
import type { InquiryRepository } from './repository';
import type { InquiryWriteService } from './write.service';

export interface InquiryEditServiceDependencies {
  inquiryRepository: InquiryRepository;
  inquiryWriteService: InquiryWriteService;
}

export interface InquiryEditService {
  getInquiryEditPageViewModel(
    userId: string,
    inquiryId: string,
  ): Promise<InquiryEditPageViewModel | null>;
  getInquiryEditViewModel(
    userId: string,
    inquiryId: string,
  ): Promise<InquiryEditViewModel | null>;
  updateInquiry(
    userId: string,
    inquiryId: string,
    input: InquiryTextInput,
  ): Promise<InquiryUpdateResult>;
}

export function createInquiryEditService({
  inquiryRepository,
  inquiryWriteService,
}: InquiryEditServiceDependencies): InquiryEditService {
  async function getInquiryEditPageViewModel(
    userId: string,
    inquiryId: string,
  ): Promise<InquiryEditPageViewModel | null> {
    const inquiry = await inquiryRepository.findByIdAndUserId(inquiryId, userId);
    if (!inquiry || inquiry.status === 'cancelled') return null;

    if (!getInquiryActionEligibility(inquiry.status).canEdit) {
      return { kind: 'answered' };
    }

    const writeViewModel = await inquiryWriteService.getInquiryWriteViewModel(
      userId,
      toInquiryEditEntryContext(inquiry),
    );
    if (!writeViewModel) return null;

    return {
      kind: 'editable',
      form: toInquiryEditViewModel(inquiry, writeViewModel),
    };
  }

  async function getInquiryEditViewModel(
    userId: string,
    inquiryId: string,
  ): Promise<InquiryEditViewModel | null> {
    const pageViewModel = await getInquiryEditPageViewModel(
      userId,
      inquiryId,
    );

    return pageViewModel?.kind === 'editable' ? pageViewModel.form : null;
  }

  async function updateInquiry(
    userId: string,
    inquiryId: string,
    input: InquiryTextInput,
  ): Promise<InquiryUpdateResult> {
    const inquiry = await inquiryRepository.findByIdAndUserId(inquiryId, userId);
    if (!inquiry || inquiry.status === 'cancelled') return 'invalid';
    if (!getInquiryActionEligibility(inquiry.status).canEdit) return 'answered';

    const { isTitleValid, isContentValid } = validateInquiryTextInput(input);
    if (!isTitleValid || !isContentValid) return 'invalid';

    return 'updated';
  }

  return {
    getInquiryEditPageViewModel,
    getInquiryEditViewModel,
    updateInquiry,
  };
}
