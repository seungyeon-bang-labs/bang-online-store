'use client';

import { useActionState, useEffect, type ComponentProps } from 'react';
import { useCartCommands } from '@/features/cart/use-cart';
import { FormSubmitButton } from '@/shared/components/ui/button';

interface LogoutButtonProps
  extends Pick<ComponentProps<typeof FormSubmitButton>, 'variant' | 'size' | 'className'> {
  logoutAction: (
    previousState: { message: string } | null,
  ) => Promise<{ message: string } | null>;
}

export function LogoutButton({
  logoutAction,
  size = 'xl',
  variant = 'default',
  className,
}: LogoutButtonProps) {
  const { beginAuthTransition, recheck } = useCartCommands();
  const [state, formAction, isPending] = useActionState(logoutAction, null);

  useEffect(() => {
    if (state) { try { void recheck('auth').catch(() => {}); } catch { /* Keep the original logout failure visible. */ } }
  }, [state, recheck]);

  return (
    <form action={formAction} onSubmit={() => { try { beginAuthTransition(); } catch { /* Cart storage failure must not block logout. */ } }} className="flex flex-col gap-2">
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
