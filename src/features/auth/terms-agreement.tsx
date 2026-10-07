'use client';

import { useMemo } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Label } from '@/shared/components/ui/label';
import { Separator } from '@/shared/components/ui/separator';
import Link from 'next/link';
import {
  Field,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from '@/shared/components/ui/field';
import { FileCheck } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
  Controller,
  type Control,
  type UseFormSetValue,
  type UseFormTrigger,
  useWatch,
} from 'react-hook-form';
import type { SignupFormValues } from './signup-form-schema';
import type { SignupTermViewModel } from '@/domains/terms/view-model';
import { getAgreementState } from '@/domains/terms/domain';

type TermsPath = `agreements.${string}`;

type TermsAgreementProps = {
  termsViewModel: readonly SignupTermViewModel[];
  control: Control<SignupFormValues>;
  setValue: UseFormSetValue<SignupFormValues>;
  trigger: UseFormTrigger<SignupFormValues>;
  ariaInvalid?: boolean;
  errorId?: string;
  disabled?: boolean;
};

export function TermsAgreement({
  termsViewModel,
  control,
  setValue,
  trigger,
  ariaInvalid,
  errorId,
  disabled,
}: TermsAgreementProps) {
  const termsKeys = useMemo<readonly TermsPath[]>(
    () => termsViewModel.map(item => `agreements.${item.code}` as TermsPath),
    [termsViewModel],
  );

  const termsValuesArray = useWatch({ control, name: termsKeys });
  const agreements = Object.fromEntries(
    termsViewModel.map((term, index) => [
      term.code,
      termsValuesArray?.[index] === true,
    ]),
  );
  const { allChecked, essentialOnlyChecked } = getAgreementState(
    termsViewModel,
    agreements,
  );

  const setChecked = (key: TermsPath, value: boolean) => {
    setValue(key, value, {
      shouldValidate: false,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handleToggleAll = (value: boolean) => {
    termsKeys.forEach(key => {
      setChecked(key, value);
    });
    void trigger('agreements');
  };

  const handleToggleEssentialOnly = (value: boolean) => {
    termsViewModel.forEach(item => {
      setChecked(`agreements.${item.code}`, item.required ? value : false);
    });
    void trigger('agreements');
  };

  return (
    <Card
      className={cn('p-3 rounded-md', ariaInvalid && 'border border-red-500')}
    >
      <FieldSet className="flex gap-4" aria-describedby={errorId}>
        <FieldLegend variant="legend" className="flex items-center gap-2 mb-4">
          <FileCheck className="size-5 text-muted-foreground" />
          약관 동의
        </FieldLegend>

        <FieldGroup className="flex-1 gap-4 pl-4 pr-0 md:px-4">
          {termsViewModel.map(({ code, label, href, required }) => (
            <Field orientation="horizontal" key={code}>
              <Controller
                control={control}
                name={`agreements.${code}`}
                render={({ field, fieldState }) => (
                  <>
                    <Checkbox
                      id={`signup-term-${code}`}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      aria-describedby={fieldState.error ? errorId : undefined}
                      checked={Boolean(field.value)}
                      onCheckedChange={value => field.onChange(value === true)}
                      aria-invalid={!!fieldState.error}
                      disabled={disabled}
                    />
                    <Label
                      htmlFor={`signup-term-${code}`}
                      className={cn('min-w-0 flex-1 font-semibold', fieldState.error && 'text-destructive')}
                    >
                      <span className={!required ? 'text-muted-foreground' : ''}>
                        ({required ? '필수' : '선택'})
                      </span>{' '}
                      {label}
                    </Label>
                  </>
                )}
              />
              {href && (
                <Link
                  href={href}
                  target="_blank"
                  aria-label={`${label} 자세히 보기 (새 창)`}
                  className="ml-auto shrink-0 text-sm underline"
                >
                  <span className="md:hidden">보기</span>
                  <span className="hidden md:inline">자세히 보기</span>
                </Link>
              )}
            </Field>
          ))}
        </FieldGroup>

        <Separator />

        <FieldGroup className="gap-4 px-4 mb-2">
          <Field orientation="horizontal">
            <Checkbox
              id="terms-checkbox1"
              name="terms-checkbox1"
              checked={allChecked}
              onCheckedChange={value => handleToggleAll(value === true)}
              disabled={disabled}
            />
            <Label htmlFor="terms-checkbox1" className="font-semibold">
              모든 약관 동의하기
            </Label>
          </Field>
          <Field orientation="horizontal">
            <Checkbox
              id="terms-checkbox2"
              name="terms-checkbox2"
              checked={essentialOnlyChecked}
              onCheckedChange={value =>
                handleToggleEssentialOnly(value === true)
              }
              disabled={disabled}
            />
            <Label htmlFor="terms-checkbox2" className="font-semibold">
              필수 약관만 동의하기
            </Label>
          </Field>
        </FieldGroup>
      </FieldSet>
    </Card>
  );
}
