'use client';

import { useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input, InputError } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
  title: string;
  content: string;
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
  const canSubmit =
    Boolean(type) &&
    isContextValid &&
    isTitleValid &&
    isContentValid &&
    agreed;

  async function submitInquiry() {
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
      ...(agreed ? {} : { agreement: '개인정보 수집 및 이용에 동의해 주세요.' }),
    };

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    let isSubmitted = false;

    try {
      isSubmitted = await onSubmitted({
        title: title.trim(),
        content: content.trim(),
      });
    } catch {
      isSubmitted = false;
    } finally {
      setIsSubmitting(false);
    }

    if (!isSubmitted) {
      setErrors({
        submission: '문의 내용을 수정하지 못했습니다. 다시 시도해 주세요.',
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
        <label htmlFor="inquiry-type" className="font-bold text-black">
          문의 유형{' '}
          <span className="ml-1 text-sm font-medium text-zinc-500">(필수)</span>
        </label>
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
                }));
              }}
            >
              <SelectTrigger
                id="inquiry-type"
                aria-invalid={Boolean(errors.type)}
                className="mt-2 h-10 w-full rounded-sm border-zinc-300 bg-white font-medium shadow-none focus-visible:border-black focus-visible:ring-0"
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
            <InputError message={errors.type} />
          </>
        )}
      </section>

      <MypageInquiryWriteContextSelector
        requirement={contextRequirement}
        selectionOptions={selectionOptions}
        resolvedContext={resolvedContext}
        error={errors.context}
        isReadOnly={isEditMode}
        onOrderChange={orderId => {
          setSelectedOrderId(orderId);
          setSelectedOrderItemId('');
          setSelectedProductId('');
          setErrors(currentErrors => ({ ...currentErrors, context: undefined }));
        }}
        onOrderItemContextChange={({ orderId, orderItemId }) => {
          setSelectedOrderId(orderId);
          setSelectedOrderItemId(orderItemId);
          setSelectedProductId('');
          setErrors(currentErrors => ({ ...currentErrors, context: undefined }));
        }}
        onProductChange={productId => {
          setSelectedOrderId('');
          setSelectedOrderItemId('');
          setSelectedProductId(productId);
          setErrors(currentErrors => ({ ...currentErrors, context: undefined }));
        }}
      />

      <section className="px-4 md:px-5" aria-label="문의 내용">
        <div>
          <label htmlFor="inquiry-title" className="font-bold text-black">
            제목{' '}
            <span className="ml-1 text-sm font-medium text-zinc-500">(필수)</span>
          </label>
          <Input
            id="inquiry-title"
            value={title}
            onChange={event => {
              const nextTitle = event.target.value;
              setTitle(nextTitle);
              if (validateInquiryTextInput({ title: nextTitle, content }).isTitleValid) {
                setErrors(currentErrors => ({
                  ...currentErrors,
                  title: undefined,
                }));
              }
            }}
            maxLength={INQUIRY_TITLE_MAX_LENGTH}
            placeholder="제목을 입력해 주세요."
            aria-invalid={Boolean(errors.title)}
            className="mt-2 h-10 rounded-sm border-zinc-300 bg-white text-sm font-medium shadow-none focus-visible:border-black focus-visible:ring-0"
          />
          <InputError message={errors.title} className="mt-2" />
        </div>

        <div className="mt-6">
          <label htmlFor="inquiry-content" className="font-bold text-black">
            문의 내용{' '}
            <span className="ml-1 text-sm font-medium text-zinc-500">(필수)</span>
          </label>
          <Textarea
            id="inquiry-content"
            value={content}
            onChange={event => {
              const nextContent = event.target.value;
              setContent(nextContent);
              if (validateInquiryTextInput({ title, content: nextContent }).isContentValid) {
                setErrors(currentErrors => ({
                  ...currentErrors,
                  content: undefined,
                }));
              }
            }}
            maxLength={INQUIRY_CONTENT_MAX_LENGTH}
            placeholder="문의 내용을 입력해 주세요."
            aria-invalid={Boolean(errors.content)}
            className="mt-2 min-h-40 resize-y rounded-sm border-zinc-300 bg-white text-sm shadow-none focus-visible:border-black focus-visible:ring-0"
          />
          <div className="mt-2 flex justify-between text-sm font-medium">
            <InputError message={errors.content} className="mt-0" />
            <span className="ml-auto text-zinc-400">
              {content.length} / {INQUIRY_CONTENT_MAX_LENGTH}자
            </span>
          </div>
        </div>
      </section>

      <section className="p-4 pt-0 md:p-5 md:pt-0" aria-label="개인정보 수집 및 이용 동의">
        <div className="mt-6 flex items-start gap-3">
          <Checkbox
            id="inquiry-agreement"
            checked={agreed}
            onCheckedChange={value => {
              const isAgreed = value === true;
              setAgreed(isAgreed);
              if (isAgreed) {
                setErrors(currentErrors => ({
                  ...currentErrors,
                  agreement: undefined,
                }));
              }
            }}
            className="mt-0.5 rounded-sm"
          />
          <label
            htmlFor="inquiry-agreement"
            className="text-sm leading-6 text-zinc-700"
          >
            <strong className="mr-1 text-black">[필수]</strong>
            개인정보 수집 및 이용에 동의합니다.
          </label>
        </div>
        <InputError message={errors.agreement} />
        <InputError message={errors.submission} />

        <div className="mt-5 grid grid-cols-2 gap-2">
          <ButtonLink
            href={returnHref}
            variant="outline"
            className="w-full rounded-sm border-zinc-300 font-bold shadow-none hover:border-black hover:bg-white hover:text-black"
          >
            취소
          </ButtonLink>
          <Button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-full rounded-sm bg-black font-bold text-white hover:bg-zinc-800"
          >
            {isEditMode ? '수정 완료' : '문의 등록'}
          </Button>
        </div>
      </section>
    </form>
  );
}
