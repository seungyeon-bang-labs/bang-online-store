import type { ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import type {
  EditableProfileField,
  EditableProfileFormValues,
} from './types';

const inputClassName =
  'border-zinc-300 bg-white font-medium shadow-none hover:ring-[3px] hover:ring-black/70 focus-visible:border-zinc-300 focus-visible:ring-black/70';

const fieldLabelClassName = 'text-sm font-black text-black';
const fieldRowClassName = 'grid gap-3 md:grid-cols-[120px_1fr] md:items-center';

interface BasicInformationProps {
  values: EditableProfileFormValues;
  onFieldChange: (field: EditableProfileField, value: string) => void;
  actions: ReactNode;
}

export function BasicInformation({
  values,
  onFieldChange,
  actions,
}: BasicInformationProps) {
  return (
    <section className="overflow-hidden rounded-md border border-zinc-300 bg-white">
      <header className="px-5 py-4 md:px-6">
        <h2 className="text-base font-black text-black">기본 정보</h2>
      </header>
      <div className="space-y-5 border-t border-zinc-300 p-5 md:p-6">
        <div className={fieldRowClassName}>
          <label htmlFor="name" className={fieldLabelClassName}>
            이름
          </label>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={event => onFieldChange('name', event.target.value)}
            className={inputClassName}
          />
        </div>
        <div className={fieldRowClassName}>
          <label htmlFor="phone" className={fieldLabelClassName}>
            휴대폰 번호
          </label>
          <Input
            id="phone"
            name="phone"
            inputMode="tel"
            autoComplete="tel"
            value={values.phoneNumber}
            onChange={event =>
              onFieldChange('phoneNumber', event.target.value)
            }
            placeholder="휴대폰 번호를 입력해 주세요"
            className={inputClassName}
          />
        </div>
        <div className={fieldRowClassName}>
          <label htmlFor="birthDate" className={fieldLabelClassName}>
            생년월일
          </label>
          <Input
            id="birthDate"
            name="birthDate"
            type="date"
            autoComplete="bday"
            value={values.birthDate}
            onChange={event =>
              onFieldChange('birthDate', event.target.value)
            }
            className={inputClassName}
          />
        </div>
      </div>
      {actions}
    </section>
  );
}
