'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import {
  Field,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { FileCheck } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
  Controller,
  type Control,
  type Path,
  type PathValue,
  type UseFormSetValue,
  useWatch,
} from 'react-hook-form';
import type { z } from 'zod';
import { signupFormSchema } from '@/lib/form-schemas';
import { termsAcceptedData, type TermsKey } from '@/lib/terms';

type SignupFormValues = z.infer<typeof signupFormSchema>;
type TermsPath = Extract<Path<SignupFormValues>, TermsKey>;

type TermsAgreementProps = {
  control: Control<SignupFormValues>;
  setValue: UseFormSetValue<SignupFormValues>;
  ariaInvalid?: boolean;
  disabled?: boolean;
};

export function TermsAgreement({
  control,
  setValue,
  ariaInvalid,
  disabled,
}: TermsAgreementProps) {
  const termsKeys = useMemo<readonly TermsPath[]>(
    () => termsAcceptedData.map(item => item.id as TermsPath),
    [],
  );

  const termsValuesArray = useWatch({ control, name: termsKeys });
  const checkedState = termsKeys.reduce(
    (acc, key, index) => {
      acc[key as TermsKey] = Boolean(termsValuesArray?.[index]);
      return acc;
    },
    {} as Record<TermsKey, boolean>,
  );

  const allChecked = termsAcceptedData.every(item => checkedState[item.id]);
  const essentialOnlyChecked = termsAcceptedData.every(item =>
    item.type === 'essential' ? checkedState[item.id] : !checkedState[item.id],
  );

  const setChecked = (key: TermsKey, value: boolean) => {
    setValue(
      key as TermsPath,
      value as PathValue<SignupFormValues, TermsPath>,
      {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      },
    );
  };

  const handleToggleAll = (value: boolean) => {
    termsKeys.forEach(key => {
      setChecked(key, value);
    });
  };

  const handleToggleEssentialOnly = (value: boolean) => {
    termsAcceptedData.forEach(item => {
      setChecked(item.id, item.type === 'essential' ? value : false);
    });
  };

  return (
    <Card
      className={cn('p-3 rounded-md', ariaInvalid && 'border border-red-500')}
    >
      <FieldSet className="flex gap-4">
        <FieldLegend variant="legend" className="flex items-center gap-2 mb-4">
          <FileCheck className="size-5 text-muted-foreground" />
          약관 동의
        </FieldLegend>

        <FieldGroup className="gap-4 px-4 flex-1">
          {termsAcceptedData.map(({ id, label, link, type }) => (
            <Field orientation="horizontal" key={id}>
              <Controller
                control={control}
                name={id as TermsPath}
                render={({ field }) => (
                  <Checkbox
                    id={id}
                    checked={Boolean(field.value)}
                    onCheckedChange={value => field.onChange(Boolean(value))}
                    aria-invalid={ariaInvalid && type === 'essential'}
                    disabled={disabled}
                  />
                )}
              />
              <Label
                htmlFor={id}
                className={cn(
                  'font-semibold',
                  ariaInvalid &&
                    !checkedState[id] &&
                    type === 'essential' &&
                    'text-destructive',
                )}
              >
                <span
                  className={type === 'optional' ? 'text-muted-foreground' : ''}
                >
                  ({type === 'essential' ? '필수' : '선택'})
                </span>{' '}
                {label}
              </Label>
              {link && (
                <Link href={link} target="_blank" className="text-sm underline">
                  자세히 보기
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
              onCheckedChange={value => handleToggleAll(Boolean(value))}
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
                handleToggleEssentialOnly(Boolean(value))
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
