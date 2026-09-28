'use client';

import { useState } from 'react';
import { Button, ButtonLink } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Input, InputError } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  getInquiryContextRequirement,
  INQUIRY_CONTENT_MAX_LENGTH,
  INQUIRY_CONTENT_MIN_LENGTH,
  INQUIRY_TITLE_MAX_LENGTH,
  INQUIRY_TITLE_MIN_LENGTH,
  INQUIRY_TYPE_FILTER_LABELS,
  INQUIRY_TYPES,
  resolveInquiryWriteContext,
  type InquiryType,
  type InquiryWriteViewModel,
  validateInquiryTextInput,
} from '@/domains/inquiry';
import { MypageTextareaCharacterCount } from '@/features/mypage/common';
import { MypageFormFooter, MypageFormLabel } from '@/features/mypage/common/form';
import {
  MYPAGE_INPUT_CLASS_NAME,
  MYPAGE_TEXTAREA_CLASS_NAME,
  MYPAGE_ACTION_CLASS_NAME,
  MYPAGE_FORM_ACTION_BUTTON_CLASS_NAME,
} from '@/features/mypage/common/styles';
import { MypageInquiryWriteContextSelector } from './write/context-selector';

interface InquiryFormErrors {
  type?: string;
  context?: string;
  title?: string;
  content?: string;
  agreement?: string;
  submission?: string;
}

export interface InquiryFormSubmitValues {
  type: InquiryType;
  title: string;
  content: string;
  orderId: string;
  orderItemId: string;
  productId: string;
}

interface MypageInquiryFormProps {
  viewModel: InquiryWriteViewModel;
  returnHref: string;
  mode?: 'write' | 'edit';
  initialValues?: {
    type: InquiryType;
    title: string;
    content: string;
  };
  onSubmitted: (
    values: InquiryFormSubmitValues,
  ) => boolean | Promise<boolean>;
}

export function MypageInquiryForm({
  viewModel,
  returnHref,
  mode = 'write',
  initialValues,
  onSubmitted,
}: MypageInquiryFormProps) {
  const { entryContext, selectionOptions } = viewModel;
  const isEditMode = mode === 'edit';
  const [type, setType] = useState<InquiryType | ''>(
    initialValues?.type ?? '',
  );
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [content, setContent] = useState(initialValues?.content ?? '');
  const [agreed, setAgreed] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(
    entryContext.orderId,
  );
  const [selectedOrderItemId, setSelectedOrderItemId] = useState(
    entryContext.orderItemId,
  );
  const [selectedProductId, setSelectedProductId] = useState(
    entryContext.productId,
  );
  const [errors, setErrors] = useState<InquiryFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const contextRequirement = type ? getInquiryContextRequirement(type) : null;
  const resolvedContext = resolveInquiryWriteContext({
    state: {
      orderId: selectedOrderId,
      orderItemId: selectedOrderItemId,
      productId: selectedProductId,
    },
    orders: selectionOptions.orders,
  });
  const isContextValid =
    !contextRequirement ||
    contextRequirement === 'none' ||
    (contextRequirement === 'order' && Boolean(resolvedContext.orderId)) ||
    (contextRequirement === 'order-item' &&
      Boolean(resolvedContext.orderId) &&
      Boolean(resolvedContext.orderItemId)) ||
    (contextRequirement === 'product' && Boolean(resolvedContext.productId));
  const { isTitleValid, isContentValid } = validateInquiryTextInput({
    title,
    content,
  });
  const requiresAgreement = !isEditMode;
  const isDirty =
    !isEditMode ||
    title !== (initialValues?.title ?? '') ||
    content !== (initialValues?.content ?? '');

  async function submitInquiry() {
    if (isSubmitting) return;
    if (isEditMode && !isDirty) return;

    const nextErrors: InquiryFormErrors = {
      ...(type ? {} : { type: '문의 유형을 선택해 주세요.' }),
      ...(isContextValid
        ? {}
        : { context: '문의 대상 정보를 선택해 주세요.' }),
      ...(isTitleValid
        ? {}
        : {
          title: `제목은 ${INQUIRY_TITLE_MIN_LENGTH}자 이상 ${INQUIRY_TITLE_MAX_LENGTH}자 이하로 입력해 주세요.`,
        }),
      ...(isContentValid
        ? {}
        : {
          content: `문의 내용은 ${INQUIRY_CONTENT_MIN_LENGTH}자 이상 ${INQUIRY_CONTENT_MAX_LENGTH}자 이하로 입력해 주세요.`,
        }),
      ...(requiresAgreement && !agreed
        ? { agreement: '개인정보 수집 및 이용에 동의해 주세요.' }
        : {}),
    };

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    let isSubmitted = false;

    try {
      isSubmitted = await onSubmitted({
        type: type as InquiryType,
        title: title.trim(),
        content: content.trim(),
        orderId: resolvedContext.orderId,
        orderItemId: resolvedContext.orderItemId,
        productId: resolvedContext.productId,
      });
    } catch {
      isSubmitted = false;
    } finally {
      setIsSubmitting(false);
    }

    if (!isSubmitted) {
      setErrors({
        submission: isEditMode
          ? '문의 내용을 수정하지 못했습니다. 다시 시도해 주세요.'
          : '문의 등록을 완료하지 못했습니다. 다시 시도해 주세요.',
      });
    }
  }

  return (
    <form
      noValidate
      onSubmit={event => {
        event.preventDefault();
        void submitInquiry();
      }}
    >
      <section className="p-4 md:p-5" aria-label="문의 유형">
        <MypageFormLabel htmlFor="inquiry-type" requirement="required">
          문의 유형
        </MypageFormLabel>
        {isEditMode ? (
          <p className="mt-2 flex h-10 items-center rounded-sm border border-zinc-300 bg-zinc-50 px-3 text-sm font-medium text-zinc-700">
            {type ? INQUIRY_TYPE_FILTER_LABELS[type] : null}
          </p>
        ) : (
          <>
            <Select
              value={type}
              onValueChange={value => {
                setType(value as InquiryType);
                setErrors(currentErrors => ({
                  ...currentErrors,
                  type: undefined,
                  context: undefined,
                  submission: undefined,
                }));
              }}
            >
              <SelectTrigger
                id="inquiry-type"
                aria-invalid={Boolean(errors.type)}
                aria-describedby={errors.type ? 'inquiry-type-error' : undefined}
                className={`mt-2 w-full ${MYPAGE_INPUT_CLASS_NAME}`}
              >
                <SelectValue placeholder="문의 유형을 선택해 주세요" />
              </SelectTrigger>
              <SelectContent className="border-zinc-300 bg-white">
                {INQUIRY_TYPES.map(inquiryType => (
                  <SelectItem key={inquiryType} value={inquiryType}>
                    {INQUIRY_TYPE_FILTER_LABELS[inquiryType]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <InputError id="inquiry-type-error" message={errors.type} />
          </>
        )}
      </section>

      <MypageInquiryWriteContextSelector
        requirement={contextRequirement}
        selectionOptions={selectionOptions}
        resolvedContext={resolvedContext}
        error={errors.context}
        errorId="inquiry-context-error"
        isReadOnly={isEditMode}
        onOrderChange={orderId => {
          setSelectedOrderId(orderId);
          setSelectedOrderItemId('');
          setSelectedProductId('');
          setErrors(currentErrors => ({
            ...currentErrors,
            context: undefined,
            submission: undefined,
          }));
        }}
        onOrderItemContextChange={({ orderId, orderItemId }) => {
          setSelectedOrderId(orderId);
          setSelectedOrderItemId(orderItemId);
          setSelectedProductId('');
          setErrors(currentErrors => ({
            ...currentErrors,
            context: undefined,
            submission: undefined,
          }));
        }}
        onProductChange={productId => {
          setSelectedOrderId('');
          setSelectedOrderItemId('');
          setSelectedProductId(productId);
          setErrors(currentErrors => ({
            ...currentErrors,
            context: undefined,
            submission: undefined,
          }));
        }}
      />

      <section className="px-4 md:px-5" aria-label="문의 내용">
        <div>
          <MypageFormLabel htmlFor="inquiry-title" requirement="required">
            제목
          </MypageFormLabel>
          <Input
            id="inquiry-title"
            value={title}
            onChange={event => {
              const nextTitle = event.target.value;
              setTitle(nextTitle);
              setErrors(currentErrors => ({
                ...currentErrors,
                title: validateInquiryTextInput({ title: nextTitle, content }).isTitleValid
                  ? undefined
                  : currentErrors.title,
                submission: undefined,
              }));
            }}
            maxLength={INQUIRY_TITLE_MAX_LENGTH}
            placeholder="제목을 입력해 주세요."
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? 'inquiry-title-error' : undefined}
            className={`mt-2 ${MYPAGE_INPUT_CLASS_NAME}`}
          />
          <InputError id="inquiry-title-error" message={errors.title} className="mt-2" />
        </div>

        <div className="mt-6">
          <MypageFormLabel htmlFor="inquiry-content" requirement="required">
            문의 내용
          </MypageFormLabel>
          <div className="relative mt-2">
            <Textarea
              id="inquiry-content"
              value={content}
              onChange={event => {
                const nextContent = event.target.value;
                setContent(nextContent);
              setErrors(currentErrors => ({
                ...currentErrors,
                content: validateInquiryTextInput({ title, content: nextContent }).isContentValid
                  ? undefined
                  : currentErrors.content,
                submission: undefined,
              }));
              }}
              maxLength={INQUIRY_CONTENT_MAX_LENGTH}
              placeholder="문의 내용을 입력해 주세요."
              aria-invalid={Boolean(errors.content)}
              aria-describedby={errors.content ? 'inquiry-content-error' : undefined}
              className={`min-h-40 resize-y pb-10 ${MYPAGE_TEXTAREA_CLASS_NAME}`}
            />
            <MypageTextareaCharacterCount
              current={content.length}
              max={INQUIRY_CONTENT_MAX_LENGTH}
            />
          </div>
          <InputError id="inquiry-content-error" message={errors.content} className="mt-2" />
        </div>
      </section>

      {requiresAgreement ? (
        <section
          className="px-4 pt-0 md:px-5 md:pt-0"
          aria-label="개인정보 수집 및 이용 동의"
        >
          <div className="mt-4 flex items-start gap-3 md:mt-5">
            <Checkbox
              id="inquiry-agreement"
              checked={agreed}
              aria-describedby={errors.agreement ? 'inquiry-agreement-error' : undefined}
              onCheckedChange={value => {
                const isAgreed = value === true;
                setAgreed(isAgreed);
                if (isAgreed) {
                  setErrors(currentErrors => ({
                    ...currentErrors,
                    agreement: undefined,
                    submission: undefined,
                  }));
                  return;
                }
                setErrors(currentErrors => ({
                  ...currentErrors,
                  submission: undefined,
                }));
              }}
              className="mt-1.5 cursor-pointer rounded-sm md:mt-1"
            />
            <label
              htmlFor="inquiry-agreement"
              className="cursor-pointer text-sm leading-6 text-zinc-700"
            >
              <strong className="mr-1 text-black">[필수]</strong>
              개인정보 수집 및 이용에 동의합니다.
            </label>
          </div>
          <InputError id="inquiry-agreement-error" message={errors.agreement} />
        </section>
      ) : null}
      <MypageFormFooter errorMessage={errors.submission}>
        <ButtonLink
          href={returnHref}
          variant="outline"
          size="lg"
          className={`${MYPAGE_FORM_ACTION_BUTTON_CLASS_NAME} ${MYPAGE_ACTION_CLASS_NAME.outline}`}
        >
          취소
        </ButtonLink>
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting || (isEditMode && !isDirty)}
          className={`${MYPAGE_FORM_ACTION_BUTTON_CLASS_NAME} ${MYPAGE_ACTION_CLASS_NAME.primary}`}
        >
          {isSubmitting ? (isEditMode ? '수정 중' : '등록 중') : isEditMode ? '수정 완료' : '문의 등록'}
        </Button>
      </MypageFormFooter>
    </form>
  );
}
