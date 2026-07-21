import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { PageTitle } from '@/components/common/page-title';
import { Tabs } from '@/components/common/tabs';
import { SearchInput } from '@/components/common/search-input';
import { NOTICE_TABS } from '@/lib/navigation';
import { NOTICES } from '@/lib/notices-data';
import { DynamicPagination } from '@/components/common/dynamic-pagination';

interface NoticePageProps {
  searchParams: Promise<{
    category?: string;
    page?: string;
    q?: string;
  }>;
}

async function NoticePage({ searchParams }: NoticePageProps) {
  const { category, page, q } = await searchParams;

  const currentCategory = category || 'all';
  const currentSearch = q || '';

  // 1. 데이터 필터링 (순서: 필터링 -> 정렬)
  const filteredNotices = NOTICES.filter(notice => {
    const matchesCategory =
      currentCategory === 'all' || notice.category === currentCategory;
    const normalizedSearch = currentSearch.trim().toLowerCase();
    const matchesSearch = !normalizedSearch
      ? true
      : notice.title.toLowerCase().includes(normalizedSearch) ||
        (notice.tag ?? '').toLowerCase().includes(normalizedSearch);
    return matchesCategory && matchesSearch;
  }).sort((a, b) => b.id - a.id);

  // 2. 페이지네이션 계산 전 유효성 검사
  const ITEMS_PER_PAGE = 10;
  const totalItems = filteredNotices.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  // URL의 page가 유효하지 않으면(전체 페이지보다 크면) 1페이지로 간주
  let currentPage = page ? parseInt(page, 10) : 1;
  if (currentPage > totalPages) currentPage = 1;

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentNotices = filteredNotices.slice(offset, offset + ITEMS_PER_PAGE);

  // 3. 헬퍼 함수 개선: 새로운 검색/카테고리 진입 시 page를 항상 1로 리셋하는 옵션 추가
  const getCombinedHref = (newParams: {
    category?: string;
    page?: number | string;
    q?: string;
  }) => {
    const params = new URLSearchParams();

    const nextCategory = newParams.category ?? currentCategory;
    const nextSearch = newParams.q ?? currentSearch;

    // 카테고리나 검색어가 '변경'되는 경우라면 페이지를 1로 리셋
    const isFilterChanged =
      newParams.category !== undefined || newParams.q !== undefined;
    const nextPage = isFilterChanged ? 1 : (newParams.page ?? currentPage);

    if (nextCategory && nextCategory !== 'all')
      params.set('category', nextCategory);
    if (nextSearch) params.set('q', nextSearch);
    params.set('page', nextPage.toString());

    return `?${params.toString()}`;
  };

  return (
    <div className="w-full max-w-6xl p-8 md:py-10">
      <PageTitle
        parent={{ label: '고객센터', href: '/cs' }}
        current="공지사항"
        className="mb-5"
      />

      {/* 상단 컨트롤 영역 */}
      <section className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <Tabs
          tabs={NOTICE_TABS}
          queryKey="category"
          currentTab={currentCategory}
        />
        <Suspense fallback={<div className="w-full md:w-80" />}>
          <SearchInput />
        </Suspense>
      </section>

      {/* 공지사항 리스트 영역 */}
      <div className="mb-12">
        {currentNotices.length > 0 ? (
          currentNotices.map(notice => (
            <Link
              href={`/cs/notice/${notice.id}`}
              key={notice.id}
              className="group flex items-center justify-between py-4 md:px-6 md:py-4 border-b border-gray-200 hover:bg-gray-50 transition-all"
            >
              <div className="flex items-center gap-2 md:gap-2">
                {/* 태그 영역: w-25(100px) 정도의 고정 너비를 주어 타이틀 위치를 고정합니다 */}
                <div className="w-22 md:w-25 shrink-0">
                  <span className="text-sm font-black bg-gray-100 px-2 py-1.5 rounded text-gray-500 group-hover:bg-black group-hover:text-white transition-colors inline-block uppercase text-center min-w-20">
                    {notice.tag}
                  </span>
                </div>

                <span className="text-base font-bold group-hover:translate-x-1 transition-transform line-clamp-1">
                  {notice.title}
                </span>
              </div>

              <div className="flex items-center gap-8 shrink-0">
                <span className="hidden md:block text-sm text-gray-400 font-medium group-hover:text-black">
                  {notice.date}
                </span>
                <ChevronRight className="size-5 text-gray-300 group-hover:text-black transition-colors" />
              </div>
            </Link>
          ))
        ) : (
          <div className="py-32 text-center text-gray-500 font-medium border-b">
            등록된 게시글이 없거나 검색 결과가 없습니다.
          </div>
        )}
      </div>

      <DynamicPagination
        currentPage={currentPage}
        totalPages={totalPages}
        getPageHref={getCombinedHref}
      />
    </div>
  );
}

export default NoticePage;
