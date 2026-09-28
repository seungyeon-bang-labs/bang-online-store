import type { ImageProps } from 'next/image';
import Image from 'next/image';
import type { LinkProps } from 'next/link';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

type MypageProductThumbnailSize = 'compact' | 'default' | 'home';

const thumbnailSizeClassNames: Record<MypageProductThumbnailSize, string> = {
  compact: 'size-16 sm:size-[72px]',
  default: 'size-[72px] sm:size-[88px]',
  home: 'size-20 lg:size-[72px]',
};

const thumbnailSizes: Record<MypageProductThumbnailSize, string> = {
  compact: '(max-width: 640px) 64px, 72px',
  default: '(max-width: 640px) 72px, 88px',
  home: '(max-width: 1023px) 80px, 72px',
};

interface MypageProductThumbnailLinkProps {
  alt: string;
  ariaLabel?: string;
  className?: string;
  href: LinkProps['href'];
  loading?: ImageProps['loading'];
  size?: MypageProductThumbnailSize;
  src: ImageProps['src'];
}

export function MypageProductThumbnailLink({
  alt,
  ariaLabel,
  className,
  href,
  loading,
  size = 'default',
  src,
}: MypageProductThumbnailLinkProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={cn(
        'group relative aspect-square shrink-0 overflow-hidden rounded-sm bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black',
        thumbnailSizeClassNames[size],
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        loading={loading}
        sizes={thumbnailSizes[size]}
        className="object-cover object-center transition-opacity group-hover:opacity-80"
      />
    </Link>
  );
}

type MypageProductSummarySize = Exclude<MypageProductThumbnailSize, 'home'>;

const summaryLayoutClassNames: Record<MypageProductSummarySize, string> = {
  compact:
    'grid-cols-[64px_minmax(0,1fr)] gap-x-3 sm:grid-cols-[72px_minmax(0,1fr)] sm:gap-x-4',
  default:
    'grid-cols-[72px_minmax(0,1fr)] gap-x-4 sm:grid-cols-[88px_minmax(0,1fr)]',
};

interface MypageProductSummaryProps {
  action?: ReactNode;
  amount?: ReactNode;
  amountTone?: 'danger' | 'muted' | 'normal';
  className?: string;
  meta?: ReactNode;
  name: string;
  nameHref?: LinkProps['href'];
  size?: MypageProductSummarySize;
  thumbnail: ReactNode;
  tone?: 'muted' | 'normal';
  truncateName?: boolean;
}

const amountToneClassNames = {
  danger: 'text-red-700',
  muted: 'text-zinc-500',
  normal: 'text-black',
};

export function MypageProductSummary({
  action,
  amount,
  amountTone = 'normal',
  className,
  meta,
  name,
  nameHref,
  size = 'default',
  thumbnail,
  tone = 'normal',
  truncateName = false,
}: MypageProductSummaryProps) {
  const nameClassName = cn(
    'block min-w-0 text-sm leading-5 font-black hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black md:text-base md:leading-6',
    tone === 'muted' ? 'text-zinc-500' : 'text-black',
    truncateName && 'truncate',
  );

  return (
    <div className={cn('grid', summaryLayoutClassNames[size], className)}>
      {thumbnail}
      <div className="min-w-0 self-start">
        {nameHref ? (
          <Link href={nameHref} className={nameClassName}>
            {name}
          </Link>
        ) : (
          <p className={cn(nameClassName, 'hover:no-underline')}>
            {name}
          </p>
        )}
        {meta ? (
          <p className="mt-0.5 text-xs leading-4 font-medium text-zinc-500 md:text-sm md:leading-5">
            {meta}
          </p>
        ) : null}
        {amount ? (
          <div className="mt-1">
            <span
              className={cn(
                'text-sm leading-5 font-black',
                amountToneClassNames[amountTone],
              )}
            >
              {amount}
            </span>
          </div>
        ) : null}
        {action}
      </div>
    </div>
  );
}
