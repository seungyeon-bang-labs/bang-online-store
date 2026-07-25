import { ReactNode } from 'react';

interface MypageSectionHeaderProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function MypageSectionHeader({
  title,
  description,
  action,
}: MypageSectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-zinc-200 pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-black">
          {title}
        </h2>
        <p className="mt-2 text-sm font-medium text-zinc-500">{description}</p>
      </div>
      {action}
    </div>
  );
}
