import { cn } from '@/shared/lib/utils';

interface SeparatorProps {
  label?: string;
  className?: string;
}

function Separator({
  label,
  className,
}: SeparatorProps) {
  return (
    <div className={cn('relative', className)}>
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-sm uppercase">
        <span className="bg-background px-2 text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

export { Separator };