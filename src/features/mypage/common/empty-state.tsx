import { LucideIcon } from 'lucide-react';

interface MypageEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function MypageEmptyState({
  icon: Icon,
  title,
  description,
}: MypageEmptyStateProps) {
  return (
    <div className="flex h-full min-h-72 flex-col items-center justify-center rounded-md border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
      <Icon className="size-8 text-zinc-300" />
      <p className="mt-5 text-base font-black text-black">{title}</p>
      <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-zinc-500">
        {description}
      </p>
    </div>
  );
}
