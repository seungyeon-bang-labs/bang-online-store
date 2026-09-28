import { ChevronDown } from 'lucide-react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { MYPAGE_TYPOGRAPHY } from './styles';

const mypageCardClassName =
  'overflow-hidden rounded-md border border-zinc-300 bg-white';
const fullBleedCardClassName =
  '-mx-4 rounded-none border-x-0 md:mx-0 md:rounded-md md:border-x';

export type MypageCardMobileLayout = 'inset' | 'full-bleed';

function getMypageCardClassName(mobileLayout: MypageCardMobileLayout) {
  return cn(
    mypageCardClassName,
    mobileLayout === 'full-bleed' && fullBleedCardClassName,
  );
}

const mypageCardHeaderClassName =
  'flex min-h-11 items-center gap-4 px-3 py-2.5 group-data-[mobile-layout=full-bleed]/mypage-card:px-4 md:px-5 md:py-4';

interface MypageCardProps extends ComponentPropsWithoutRef<'section'> {
  as?: 'article' | 'section';
  mobileLayout?: MypageCardMobileLayout;
}

function MypageCardRoot({
  as: Component = 'section',
  className,
  mobileLayout = 'inset',
  ...props
}: MypageCardProps) {
  return (
    <Component
      data-mobile-layout={mobileLayout}
      className={cn(
        'group/mypage-card',
        getMypageCardClassName(mobileLayout),
        className,
      )}
      {...props}
    />
  );
}

interface MypageCardHeaderProps
  extends ComponentPropsWithoutRef<'header'> {
  right?: ReactNode;
  withDivider?: boolean;
}

function MypageCardHeader({
  children,
  className,
  right,
  withDivider = true,
  ...props
}: MypageCardHeaderProps) {
  return (
    <header
      className={cn(
        mypageCardHeaderClassName,
        right ? 'justify-between' : 'justify-start',
        withDivider && 'border-b border-zinc-200',
        className,
      )}
      {...props}
    >
      {right ? (
        <div className="min-w-0">{children}</div>
      ) : (
        children
      )}
      {right ? <div className="shrink-0">{right}</div> : null}
    </header>
  );
}

interface MypageCardTitleProps extends ComponentPropsWithoutRef<'h3'> {
  as?: 'h2' | 'h3' | 'h4';
  size?: 'card' | 'section';
}

function MypageCardTitle({
  as: Component = 'h3',
  size = 'card',
  className,
  ...props
}: MypageCardTitleProps) {
  return (
    <Component
      className={cn(MYPAGE_TYPOGRAPHY[size === 'section' ? 'sectionTitle' : 'cardTitle'], className)}
      {...props}
    />
  );
}

interface MypageCardBodyProps extends ComponentPropsWithoutRef<'div'> {
  padding?: 'default' | 'roomy' | 'flush-y';
}

const bodyPaddingClassName = {
  default:
    'p-3 group-data-[mobile-layout=full-bleed]/mypage-card:px-4 md:p-5',
  roomy: 'p-4 md:p-6',
  'flush-y': 'px-4 py-0 md:px-5',
};

function MypageCardBody({
  className,
  padding = 'default',
  ...props
}: MypageCardBodyProps) {
  return <div className={cn(bodyPaddingClassName[padding], className)} {...props} />;
}

interface MypageCardFooterProps
  extends ComponentPropsWithoutRef<'footer'> {
  withDivider?: boolean;
}

function MypageCardFooter({
  className,
  withDivider = false,
  ...props
}: MypageCardFooterProps) {
  return (
    <footer
      className={cn(
        'p-3 group-data-[mobile-layout=full-bleed]/mypage-card:px-4 md:p-5',
        withDivider && 'border-t border-zinc-200',
        className,
      )}
      {...props}
    />
  );
}

interface MypageCardCollapsibleProps
  extends Omit<
    ComponentPropsWithoutRef<'details'>,
    'children' | 'open' | 'title'
  > {
  children: ReactNode;
  contentClassName?: string;
  defaultOpen?: boolean;
  mobileLayout?: MypageCardMobileLayout;
  right?: ReactNode;
  title: ReactNode;
}

function MypageCardCollapsible({
  children,
  className,
  contentClassName,
  defaultOpen = true,
  mobileLayout = 'inset',
  right,
  title,
  ...props
}: MypageCardCollapsibleProps) {
  return (
    <details
      data-mobile-layout={mobileLayout}
      className={cn(
        'group/mypage-card',
        getMypageCardClassName(mobileLayout),
        className,
      )}
      open={defaultOpen}
      {...props}
    >
      <summary
        className={cn(
          mypageCardHeaderClassName,
          'list-none font-black text-black transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-black active:bg-zinc-100 [&::-webkit-details-marker]:hidden',
        )}
      >
        <MypageCardTitle className="min-w-0 flex-1">{title}</MypageCardTitle>
        {right ? <div className="shrink-0">{right}</div> : null}
        <ChevronDown
          className="size-5 shrink-0 transition-transform duration-200 group-open/mypage-card:rotate-180"
          strokeWidth={2.5}
          aria-hidden="true"
        />
      </summary>
      <div className={cn('border-t border-zinc-200', contentClassName)}>
        {children}
      </div>
    </details>
  );
}

export const MypageCard = Object.assign(MypageCardRoot, {
  Body: MypageCardBody,
  Collapsible: MypageCardCollapsible,
  Footer: MypageCardFooter,
  Header: MypageCardHeader,
  Title: MypageCardTitle,
});
