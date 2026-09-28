import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import type { UserGender } from '@/domains/member';
import {
  MypageFormCard,
  MypageFormField,
  MypageFormFooter,
  MypageFormLabel,
} from '@/features/mypage/common/form';
import {
  MYPAGE_ACTION_CLASS_NAME,
  MYPAGE_FORM_ACTION_BUTTON_CLASS_NAME,
  MYPAGE_INPUT_CLASS_NAME,
  MYPAGE_SELECTOR_TRIGGER_CLASS_NAME,
} from '@/features/mypage/common/styles';
import { MypageCard } from '@/features/mypage/common/card';
import type {
  EditableProfileField,
  EditableProfileFormValues,
} from './types';

const MIN_BIRTH_YEAR = 1920;
const PHONE_PREFIXES = ['010', '011', '016', '017', '018', '019'] as const;
const GENDER_OPTIONS: ReadonlyArray<{ value: UserGender; label: string }> = [
  { value: 'male', label: '남성' },
  { value: 'female', label: '여성' },
  { value: 'unspecified', label: '선택 안 함' },
];

const formFieldClassName =
  'grid-cols-[4rem_minmax(0,1fr)] items-center gap-3 md:grid-cols-[120px_minmax(0,1fr)]';
const profileInputClassName =
  `${MYPAGE_INPUT_CLASS_NAME} h-9 text-xs md:h-10 md:text-sm`;
const profileSelectTriggerClassName =
  `h-9 w-full rounded-sm border-zinc-300 bg-white text-xs font-medium shadow-none md:h-10 md:data-[size=default]:h-10 md:text-sm ${MYPAGE_SELECTOR_TRIGGER_CLASS_NAME}`;

interface BirthDateParts {
  year: string;
  month: string;
  day: string;
}

interface BasicInformationProps {
  values: EditableProfileFormValues;
  isDirty: boolean;
  isPhoneNumberVerified: boolean;
  hasRequestedPhoneVerification: boolean;
  onFieldChange: (field: EditableProfileField, value: string) => void;
  onPhoneVerification: () => void;
  onReset: () => void;
}

function getBirthDateParts(birthDate: string): BirthDateParts {
  const [year = '', month = '', day = ''] = birthDate.split('-');

  return { year, month, day };
}

function getBirthDateValue({ year, month, day }: BirthDateParts): string {
  if (!year || !month || !day) return '';

  return `${year}-${month}-${day}`;
}

function getDaysInMonth(year: string, month: string): number {
  if (!year || !month) return 31;

  return new Date(Number(year), Number(month), 0).getDate();
}

function getPhoneNumberParts(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, '');
  const prefix = digits.slice(0, 3);

  return {
    prefix: PHONE_PREFIXES.includes(prefix as (typeof PHONE_PREFIXES)[number])
      ? prefix
      : '010',
    suffix: digits.slice(3, 11),
  };
}

function formatPhoneSuffix(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);

  return digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits;
}

export function BasicInformation({
  values,
  isDirty,
  isPhoneNumberVerified,
  hasRequestedPhoneVerification,
  onFieldChange,
  onPhoneVerification,
  onReset,
}: BasicInformationProps) {
  const birthDateParts = getBirthDateParts(values.birthDate);
  const phoneNumberParts = getPhoneNumberParts(values.phoneNumber);
  const currentYear = new Date().getFullYear();
  const birthYears = Array.from(
    { length: currentYear - MIN_BIRTH_YEAR + 1 },
    (_, index) => String(currentYear - index),
  );
  const birthMonths = Array.from({ length: 12 }, (_, index) =>
    String(index + 1).padStart(2, '0'),
  );
  const birthDays = Array.from(
    { length: getDaysInMonth(birthDateParts.year, birthDateParts.month) },
    (_, index) => String(index + 1).padStart(2, '0'),
  );
  const isPhoneNumberComplete = phoneNumberParts.suffix.length === 8;

  const handleBirthDatePartChange = (
    part: keyof BirthDateParts,
    value: string,
  ) => {
    const nextBirthDateParts = { ...birthDateParts, [part]: value };
    const maxDay = getDaysInMonth(
      nextBirthDateParts.year,
      nextBirthDateParts.month,
    );

    if (Number(nextBirthDateParts.day) > maxDay) {
      nextBirthDateParts.day = String(maxDay).padStart(2, '0');
    }

    onFieldChange('birthDate', getBirthDateValue(nextBirthDateParts));
  };

  const handlePhonePrefixChange = (prefix: string) => {
    onFieldChange(
      'phoneNumber',
      `${prefix}-${formatPhoneSuffix(phoneNumberParts.suffix)}`,
    );
  };

  const handlePhoneSuffixChange = (value: string) => {
    onFieldChange(
      'phoneNumber',
      `${phoneNumberParts.prefix}-${formatPhoneSuffix(value)}`,
    );
  };

  return (
    <MypageFormCard
      title="기본 정보"
      as="section"
      titleSize="card"
      mobileLayout="full-bleed"
    >
      <MypageCard.Body className="space-y-5">
        <MypageFormField layout="horizontal" className={formFieldClassName}>
          <MypageFormLabel
            htmlFor="name"
            className="text-xs leading-4 font-medium text-zinc-600 md:text-sm md:leading-5 md:font-bold md:text-black"
          >
            이름 <span aria-hidden="true" className="text-red-600">*</span>
          </MypageFormLabel>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            required
            value={values.name}
            onChange={event => onFieldChange('name', event.target.value)}
            className={profileInputClassName}
          />
        </MypageFormField>

        <MypageFormField layout="horizontal" className={formFieldClassName}>
          <MypageFormLabel
            as="p"
            className="text-xs leading-4 font-medium text-zinc-600 md:text-sm md:leading-5 md:font-bold md:text-black"
          >
            휴대폰 번호 <span aria-hidden="true" className="text-red-600">*</span>
          </MypageFormLabel>
          <div className="grid min-w-0 grid-cols-[4rem_minmax(0,1fr)_auto] gap-2">
            <Select value={phoneNumberParts.prefix} onValueChange={handlePhonePrefixChange}>
              <SelectTrigger className={`${profileSelectTriggerClassName} gap-1 px-2`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-zinc-300 bg-white">
                {PHONE_PREFIXES.map(prefix => (
                  <SelectItem key={prefix} value={prefix}>{prefix}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id="phone"
              name="phone"
              inputMode="tel"
              autoComplete="tel-national"
              aria-label="휴대폰 번호"
              value={formatPhoneSuffix(phoneNumberParts.suffix)}
              onChange={event => handlePhoneSuffixChange(event.target.value)}
              placeholder="1234-5678"
              className={profileInputClassName}
            />
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={!isPhoneNumberComplete || hasRequestedPhoneVerification}
              onClick={onPhoneVerification}
              className={`h-9 px-2 text-xs md:h-10 md:px-4 md:text-sm ${MYPAGE_ACTION_CLASS_NAME.outline}`}
            >
              {hasRequestedPhoneVerification ? (
                <>
                  <span className="md:hidden">완료</span>
                  <span className="hidden md:inline">인증 완료</span>
                </>
              ) : (
                <>
                  <span className="md:hidden">인증</span>
                  <span className="hidden md:inline">인증하기</span>
                </>
              )}
            </Button>
          </div>
        </MypageFormField>

        <MypageFormField layout="horizontal" className={formFieldClassName}>
          <MypageFormLabel
            as="p"
            className="text-xs leading-4 font-medium text-zinc-600 md:text-sm md:leading-5 md:font-bold md:text-black"
          >
            생년월일
          </MypageFormLabel>
          <div className="grid min-w-0 grid-cols-[1.3fr_0.85fr_0.85fr] gap-2 md:grid-cols-[7rem_6rem_6rem]">
            <Select value={birthDateParts.year || undefined} onValueChange={value => handleBirthDatePartChange('year', value)}>
              <SelectTrigger className={`${profileSelectTriggerClassName} gap-1 px-2 md:gap-2 md:px-3`}>
                <SelectValue placeholder="연도" />
              </SelectTrigger>
              <SelectContent className="border-zinc-300 bg-white">
                {birthYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={birthDateParts.month || undefined} onValueChange={value => handleBirthDatePartChange('month', value)}>
              <SelectTrigger className={`${profileSelectTriggerClassName} gap-1 px-2 md:gap-2 md:px-3`}>
                <SelectValue placeholder="월" />
              </SelectTrigger>
              <SelectContent className="border-zinc-300 bg-white">
                {birthMonths.map(month => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={birthDateParts.day || undefined} onValueChange={value => handleBirthDatePartChange('day', value)}>
              <SelectTrigger className={`${profileSelectTriggerClassName} gap-1 px-2 md:gap-2 md:px-3`}>
                <SelectValue placeholder="일" />
              </SelectTrigger>
              <SelectContent className="border-zinc-300 bg-white">
                {birthDays.map(day => (
                  <SelectItem key={day} value={day}>{day}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </MypageFormField>

        <MypageFormField layout="horizontal" className={formFieldClassName}>
          <MypageFormLabel
            as="p"
            className="text-xs leading-4 font-medium text-zinc-600 md:text-sm md:leading-5 md:font-bold md:text-black"
          >
            성별
          </MypageFormLabel>
          <fieldset className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <legend className="sr-only">성별</legend>
            {GENDER_OPTIONS.map(option => (
              <label
                key={option.value}
                className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-zinc-700 md:text-sm"
              >
                <input
                  type="radio"
                  name="gender"
                  value={option.value}
                  checked={values.gender === option.value}
                  onChange={() => onFieldChange('gender', option.value)}
                  className="size-4 accent-blue-600"
                />
                {option.label}
              </label>
            ))}
          </fieldset>
        </MypageFormField>
      </MypageCard.Body>
      <MypageFormFooter>
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={!isDirty}
          onClick={onReset}
          className={`${MYPAGE_FORM_ACTION_BUTTON_CLASS_NAME} ${MYPAGE_ACTION_CLASS_NAME.outline}`}
        >
          변경 취소
        </Button>
        <Button
          type="submit"
          size="lg"
          disabled={!isDirty || !isPhoneNumberVerified}
          className={`${MYPAGE_FORM_ACTION_BUTTON_CLASS_NAME} ${MYPAGE_ACTION_CLASS_NAME.primary}`}
        >
          저장
        </Button>
      </MypageFormFooter>
    </MypageFormCard>
  );
}
