import { ReactNode } from 'react';

interface MypageSectionHeaderProps {
  title: string;
  action?: ReactNode;
}

export function MypageSectionHeader({
  title,
  action,
}: MypageSectionHeaderProps) {
  return (
    <div className="hidden flex-col gap-4 md:flex md:flex-row md:items-end md:justify-between">
      <h2 className="text-2xl font-black tracking-tight text-black">{title}</h2>
      {action}
    </div>
  );
}
