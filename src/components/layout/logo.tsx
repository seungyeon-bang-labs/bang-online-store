import { cva, type VariantProps } from 'class-variance-authority';

function LogoIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="40" height="40" rx="8" fill="currentColor" />
      <path
        d="M12 12H16C19 12 21 14 21 17C21 19 20 20.5 18 21C20.5 21.5 22 23 22 25.5C22 28.5 20 30 16.5 30H12V12Z"
        fill="white"
      />
      <path d="M16 12V21M16 21V30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const variants = {
  container: cva('flex items-center gap-3'),
  icon: cva('text-foreground', {
    variants: {
      size: {
        sm: 'h-9 w-9',
        lg: 'h-12 w-12',
      },
    },
  }),
  name: cva('font-bold tracking-tight leading-none', {
    variants: {
      size: {
        sm: 'text-xl',
        lg: 'text-2xl',
      },
    },
  }),
  subtext: cva('font-light text-muted-foreground leading-none whitespace-nowrap', {
    variants: {
      size: {
        sm: 'text-sm',
        lg: 'text-base',
      },
    },
  }),
};

type LogoWithIconProps = VariantProps<typeof variants.icon> & { className?: string };

export function LogoWithIcon({ className = '', size = 'lg' }: LogoWithIconProps) {
  return (
    <div className={variants.container({ className })}>
      <LogoIcon className={variants.icon({ size })} />
      <div className="flex flex-col gap-0.5">
        <span className={variants.name({ size })}>BANG</span>
        <span className={variants.subtext({ size })}>Online Store</span>
      </div>
    </div>
  );
}
