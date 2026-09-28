'use client';

import { useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { Button } from '@/shared/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/shared/components/ui/input-group';
import { cn } from '@/shared/lib/utils';

type PasswordInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'placeholder' | 'size'
> & {
  placeholder: string;
  disabled?: boolean;
  ariaInvalid?: boolean;
  register?: UseFormRegisterReturn;
  size?: 'lg' | 'xl';
};

export function PasswordInput({
  placeholder,
  disabled,
  ariaInvalid,
  register,
  size = 'xl',
  ...rest
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const sizeClasses = { lg: 'h-10', xl: 'h-12' };
  const iconSizeClasses = { lg: 'size-4', xl: 'size-5' };

  return (
    <InputGroup className={cn(sizeClasses[size])}>
      <InputGroupInput
        placeholder={placeholder}
        type={showPassword ? 'text' : 'password'}
        {...rest}
        {...register}
        disabled={disabled}
        aria-invalid={ariaInvalid}
      />
      <InputGroupAddon>
        <LockKeyhole className={iconSizeClasses[size]} />
      </InputGroupAddon>
      <InputGroupAddon align="inline-end">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="hover:bg-transparent focus-visible:ring-foreground focus-visible:ring-0 focus-visible:text-black"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
        >
          {showPassword ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
        </Button>
      </InputGroupAddon>
    </InputGroup>
  );
}
