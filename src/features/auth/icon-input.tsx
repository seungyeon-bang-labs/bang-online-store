'use client';

import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from '@/components/ui/input-group';
import { LucideIcon, LockKeyhole, Eye, EyeOff } from 'lucide-react';
import { UseFormRegisterReturn } from 'react-hook-form';
import { useState, type InputHTMLAttributes } from 'react';
import { Button } from '@/components/ui/button';
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

function PasswordInput({
  placeholder,
  disabled,
  ariaInvalid,
  register,
  size = 'xl',
  ...rest
}: InputProps & BaseInputProps & { size?: 'lg' | 'xl' }) {
  const [showPassword, setShowPassword] = useState(false);

  const sizeClasses = {
    lg: 'h-10',
    xl: 'h-12',
  };

  const iconSizeClasses = {
    lg: 'size-4',
    xl: 'size-5',
  };

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
          {showPassword ? (
            <Eye className="size-5" />
          ) : (
            <EyeOff className="size-5" />
          )}
        </Button>
      </InputGroupAddon>
    </InputGroup>
  );
}

export { IconInput, PasswordInput };
