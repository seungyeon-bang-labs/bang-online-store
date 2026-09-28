import Link from 'next/link';
import { MYPAGE_TYPOGRAPHY } from '../common/styles';

interface MypageSectionHeaderProps {
  title: string;
  viewAllHref?: string;
}

export function MypageSectionHeader({
  title,
  viewAllHref,
}: MypageSectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 className={MYPAGE_TYPOGRAPHY.sectionTitle}>{title}</h2>
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="relative text-sm font-black text-zinc-500 underline-offset-4 after:absolute after:-inset-3 hover:text-black hover:underline focus-visible:text-black focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
        >
          전체 보기
        </Link>
      )}
    </div>
  );
}
