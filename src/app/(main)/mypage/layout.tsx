import { PageTitle } from '@/components/common/page-title';
import MypageNavigation from '@/features/mypage/navigation/mypage-navigation';

interface MypageLayoutProps {
  children: React.ReactNode;
}

function MypageLayout({ children }: MypageLayoutProps) {
  return (
    <div
      className="w-full max-w-6xl px-5 py-6 md:px-8 md:py-10"
      data-mypage-layout
    >
      <div className="hidden md:block" data-mypage-page-title>
        <PageTitle current="마이페이지" />
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        <div className="contents" data-mypage-navigation>
          <MypageNavigation />
        </div>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

export default MypageLayout;
