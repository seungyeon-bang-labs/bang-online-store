import { ButtonLink } from '@/components/ui/button';

interface MypageCompactEmptyStateProps {
  title: string;
  description: string;
  action?: {
    href: string;
    label: string;
  };
}

export function MypageCompactEmptyState({
  title,
  description,
  action,
}: MypageCompactEmptyStateProps) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center rounded-md border border-dashed border-zinc-300 bg-white px-5 py-7 text-center">
      <p className="text-sm font-black text-black">{title}</p>
      <p className="mt-1.5 text-xs font-medium leading-relaxed text-zinc-500">
        {description}
      </p>
      {action && (
        <ButtonLink
          href={action.href}
          variant="outline"
          size="xs"
          className="mt-4 rounded-sm border-zinc-300 font-bold shadow-none hover:border-black hover:bg-black hover:text-white"
        >
          {action.label}
        </ButtonLink>
      )}
    </div>
  );
}
