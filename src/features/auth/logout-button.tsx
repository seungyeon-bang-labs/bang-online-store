'use client';

import { useActionState, type ComponentProps } from 'react';
import { FormSubmitButton } from '@/shared/components/ui/button';

interface LogoutButtonProps
  extends Pick<ComponentProps<typeof FormSubmitButton>, 'variant' | 'size' | 'className'> {
  logoutAction: (
    previousState: { message: string } | null,
  ) => Promise<{ message: string } | null>;
}

export function LogoutButton({
  logoutAction,
  variant = 'outline',
  size = 'xl',
  className,
}: LogoutButtonProps) {
  const [state, formAction, isPending] = useActionState(logoutAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <FormSubmitButton
        variant={variant}
        size={size}
        className={className}
        isPending={isPending}
      >
        {isPending ? '로그아웃 중…' : '로그아웃'}
      </FormSubmitButton>
      {state && (
        <p role="alert" className="max-w-xs text-sm text-destructive">
          {state.message}
        </p>
      )}
    </form>
  );
}
