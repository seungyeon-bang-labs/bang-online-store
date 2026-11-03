import { cn } from '@/shared/lib/utils';

interface ProductImageOverlayProps {
  label: string;
  className?: string;
  labelClassName?: string;
}

// A dimmed label such as 일시품절 over a product image; the image box must be positioned.
export function ProductImageOverlay({ label, className, labelClassName }: ProductImageOverlayProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/30',
        className,
      )}
    >
      <span
        className={cn(
          'rounded-xs border border-white px-3 py-1 text-xs font-bold tracking-widest text-white md:text-sm',
          labelClassName,
        )}
      >
        {label}
      </span>
    </div>
  );
}
