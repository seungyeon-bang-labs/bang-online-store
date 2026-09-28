import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { InputError } from '@/shared/components/ui/input';
import { cn } from '@/shared/lib/utils';
import { MypageCard, type MypageCardMobileLayout } from './card';
import { MYPAGE_FORM_ACTIONS_CLASS_NAME, MYPAGE_TYPOGRAPHY } from './styles';

interface MypageFormCardProps {
  children: ReactNode;
  title: ReactNode;
  as?: 'article' | 'section';
  mobileLayout?: MypageCardMobileLayout;
  mobileHeader?: 'show' | 'hide';
  titleSize?: 'card' | 'section';
}

export function MypageFormCard({
  children,
  title,
  as = 'article',
  mobileLayout,
  mobileHeader = 'show',
  titleSize = 'section',
}: MypageFormCardProps) {
  return (
    <MypageCard as={as} mobileLayout={mobileLayout}>
      <MypageCard.Header className={mobileHeader === 'hide' ? 'hidden md:flex' : undefined}>
        <MypageCard.Title as="h2" size={titleSize}>{title}</MypageCard.Title>
      </MypageCard.Header>
      {children}
    </MypageCard>
  );
}

interface MypageFormFieldProps extends ComponentPropsWithoutRef<'div'> {
  layout?: 'horizontal' | 'vertical';
}

export function MypageFormField({
  layout = 'vertical',
  className,
  ...props
}: MypageFormFieldProps) {
  return (
    <div
      className={cn(
        'grid gap-2',
        layout === 'horizontal' && 'gap-3 md:grid-cols-[120px_minmax(0,1fr)] md:items-start [&>label]:md:pt-2 [&>p]:md:pt-2',
        className,
      )}
      {...props}
    />
  );
}

interface MypageFormLabelProps {
  children: ReactNode;
  className?: string;
  id?: string;
  htmlFor?: string;
  as?: 'label' | 'p' | 'legend';
  requirement?: 'required' | 'optional';
}

export function MypageFormLabel({
  as: Component = 'label',
  children,
  requirement,
  className,
  ...props
}: MypageFormLabelProps) {
  return (
    <Component className={cn(MYPAGE_TYPOGRAPHY.fieldLabel, className)} {...props}>
      {children}
      {requirement && (
        <span className="ml-1 text-sm font-medium text-zinc-500">
          {requirement === 'required' ? '(필수)' : '(선택)'}
        </span>
      )}
    </Component>
  );
}

interface MypageFormFooterProps {
  children: ReactNode;
  errorMessage?: string;
}

export function MypageFormFooter({
  children,
  errorMessage,
}: MypageFormFooterProps) {
  return (
    <MypageCard.Footer className={errorMessage ? 'space-y-2' : undefined}>
      {errorMessage ? <InputError message={errorMessage} /> : null}
      <div className={MYPAGE_FORM_ACTIONS_CLASS_NAME}>{children}</div>
    </MypageCard.Footer>
  );
}
