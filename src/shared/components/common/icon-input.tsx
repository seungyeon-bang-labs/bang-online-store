'use client';

import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from '@/shared/components/ui/input-group';
import type { LucideIcon } from 'lucide-react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/utils';

type BaseInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'placeholder' | 'size'
>;

interface InputProps {
  placeholder: string;
  disabled?: boolean;
  ariaInvalid?: boolean;
  register?: UseFormRegisterReturn;
}

interface IconInputProps extends InputProps, BaseInputProps {
  icon: LucideIcon;
  type?: 'text' | 'email';
  size?: 'lg' | 'xl';
  className?: string;
}

function IconInput({
  placeholder,
  type = 'text',
  icon: Icon,
  disabled,
  ariaInvalid,
  register,
  size = 'xl',
  className,
  ...rest
}: IconInputProps) {
  const sizeClasses = {
    lg: 'h-10',
    xl: 'h-12',
  };

  const iconSizeClasses = {
    lg: 'size-4',
    xl: 'size-5',
  };

  return (
    <InputGroup className={cn(sizeClasses[size], className)}>
      <InputGroupInput
        placeholder={placeholder}
        type={type}
        {...rest}
        {...(register || {})}
        disabled={disabled}
        aria-invalid={ariaInvalid}
      />
      <InputGroupAddon>
        <Icon className={iconSizeClasses[size]} />
      </InputGroupAddon>
    </InputGroup>
  );
}

export { IconInput };
