import { cn } from '@/shared/lib/utils';

interface ProductPriceProps {
  price: number;
  discount: number;
  isOutOfStock?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'compact';
  variant?: 'default' | 'product-card';
  quantity?: number;
  priceOffset?: number;
  className?: string;
}

const sizeStyles = {
  compact: {
    original: 'text-xs sm:text-sm',
    percent: 'text-xs sm:text-sm',
    current: 'text-sm sm:text-base',
    gap: 'gap-1',
  },
  sm: {
    original: 'text-xs',
    percent: 'text-xs',
    current: 'text-sm',
    gap: 'gap-1',
  },
  md: {
    original: 'text-sm',
    percent: 'text-sm',
    current: 'text-base',
    gap: 'gap-1',
  },
  lg: {
    original: 'text-xl',
    percent: 'text-xl',
    current: 'text-2xl',
    gap: 'gap-2',
  },
};

export function ProductPrice({
  price,
  discount,
  isOutOfStock = false,
  size = 'md',
  variant = 'default',
  quantity = 1,
  priceOffset = 0,
  className,
}: ProductPriceProps) {
  const hasDiscount = discount > 0;
  const discountedPrice = hasDiscount
    ? Math.floor(price * (1 - discount / 100))
    : price;

  const styles = sizeStyles[size];

  const totalPrice = discountedPrice * quantity + priceOffset * quantity;

  if (variant === 'product-card') {
    return (
      <div
        className={cn(
          'flex items-center justify-start gap-1 text-sm font-bold md:text-base',
          className,
        )}
      >
        {hasDiscount ? (
          <span className={isOutOfStock ? 'text-gray-300' : 'text-red-600'}>
            {discount}%
          </span>
        ) : null}
        <span className={isOutOfStock ? 'text-gray-400' : 'text-gray-900'}>
          {totalPrice.toLocaleString()}원
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {hasDiscount && (
        <span className={cn('text-gray-400 line-through', styles.original)}>
          {(price * quantity).toLocaleString()}원
        </span>
      )}

      <div className={cn('flex items-center', styles.gap)}>
        {hasDiscount && (
          <span
            className={cn(
              'font-bold',
              styles.percent,
              isOutOfStock ? 'text-gray-300' : 'text-red-600',
            )}
          >
            {discount}%
          </span>
        )}
        <span
          className={cn(
            'font-bold',
            styles.current,
            isOutOfStock ? 'text-gray-400' : 'text-gray-900',
          )}
        >
          {totalPrice.toLocaleString()}원
        </span>
      </div>
    </div>
  );
}
