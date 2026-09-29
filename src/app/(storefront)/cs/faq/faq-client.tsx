'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, Megaphone } from 'lucide-react';
import { ButtonLink } from '@/shared/components/ui/button';
import { PageTitle } from '@/shared/components/common/page-title';
import { Tabs } from '@/shared/components/common/tabs';
import { SearchInput } from '@/shared/components/common/search-input';
import { FAQ_TABS } from '@/shared/lib/navigation';
import { FAQ_DATA } from '@/domains/customer-service';

function FAQClient() {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category') || 'all';
  const currentSearch = searchParams.get('q') || '';
  const page = searchParams.get('page');

  const filteredFaqs = useMemo(() => {
    const normalizedSearch = currentSearch.trim().toLowerCase();

    return FAQ_DATA.filter(item => {
      const matchesCategory =
        currentCategory === 'all' || item.category === currentCategory;
      const matchesSearch = !normalizedSearch
        ? true
        : item.question.toLowerCase().includes(normalizedSearch) ||
          (item.tag ?? '').toLowerCase().includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    }).sort((a, b) => b.id - a.id);
  }, [currentCategory, currentSearch]);

  const ITEMS_PER_PAGE = 10;
  const totalItems = filteredFaqs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  let currentPage = page ? parseInt(page, 10) : 1;
  if (currentPage > totalPages) currentPage = 1;

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentFaqs = filteredFaqs.slice(offset, offset + ITEMS_PER_PAGE);

  const [openId, setOpenId] = useState<number | null>(null);

  const toggleAccordion = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="w-full max-w-6xl p-8 md:py-10">
      <PageTitle
        parent={{ label: '고객센터', href: '/cs' }}
        current="자주 묻는 질문"
        className="mb-5 hidden md:flex"
      >
        <SearchInput initialValue={currentSearch} />
      </PageTitle>

      <div className="mb-5 md:hidden">
        <SearchInput initialValue={currentSearch} />
      </div>

      <section className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <Tabs
          tabs={FAQ_TABS}
          queryKey="category"
          currentTab={currentCategory}
        />
      </section>

      <div className="mb-20">
        {currentFaqs.map(item => (
          <div key={item.id} className="border-b border-gray-200">
            <button
              onClick={() => toggleAccordion(item.id)}
              className="w-full flex items-center justify-between p-6 md:p-8 hover:bg-gray-50 transition-all group text-left"
            >
              <div className="flex items-center gap-4 md:gap-8">
                <span className="text-sm font-black text-gray-400 group-hover:text-black transition-colors min-w-[40px]">
                  {item.category}
                </span>
                <span className="text-base md:text-lg font-bold flex items-center">
                  <span className="text-xl font-black mr-4 text-black italic">
                    Q.
                  </span>
                  {item.question}
                </span>
              </div>
              <ChevronDown
                className={`size-5 text-gray-400 transition-transform duration-300 ${openId === item.id ? 'rotate-180 text-black' : ''}`}
              />
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out bg-gray-50 ${openId === item.id ? 'max-h-[500px]' : 'max-h-0'}`}
            >
              <div className="p-8 md:pl-28 md:pr-16 text-gray-600 leading-relaxed text-base border-t border-gray-100 flex gap-4">
                <span className="text-xl font-black text-black italic leading-none">
                  A.
                </span>
                <p className="font-medium">{item.answer}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-black text-white p-10 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="bg-white p-3 rounded-full">
            <Megaphone className="text-black size-6" />
          </div>
          <div>
            <h3 className="text-xl font-black">찾으시는 내용이 없으신가요?</h3>
            <p className="text-gray-400 text-sm">
              1:1 문의를 남겨주시면 신속하게 답변해 드리겠습니다.
            </p>
          </div>
        </div>
        <ButtonLink
          href="/cs/inquiry"
          variant="ghost"
          className="border border-white hover:bg-white hover:text-black font-bold px-8 py-6 w-full md:w-auto"
        >
          1:1 문의하기
        </ButtonLink>
      </div>
    </div>
  );
}

export default FAQClient;
