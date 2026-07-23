import { PageTitle } from '@/components/common/page-title';
import MypageNavigation from '@/features/mypage/navigation/mypage-navigation';

interface MypageLayoutProps {
  children: React.ReactNode;
}

function MypageLayout({ children }: MypageLayoutProps) {
  return (
    <div className="w-full max-w-6xl px-5 py-6 md:px-8 md:py-10">
      <div className="hidden md:block">
        <PageTitle current="마이페이지" />
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        <MypageNavigation />

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

export default MypageLayout;
