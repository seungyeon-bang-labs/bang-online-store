import { PageTitle } from '@/shared/components/common/page-title';
import { toProductCardViewModel } from '@/domains/product';
import { CATEGORIES } from '@/shared/lib/navigation';
import { notFound } from 'next/navigation';
import { ProductItem } from '@/features/product/product-item';
import { ButtonLink } from '@/shared/components/ui/button';
import { ProductFilterBar } from '@/features/product/product-filter-bar';
import { getCategoryProducts } from './_lib/utils';
import {
  getCategoryEmptyNotice,
  getCategoryHeader,
} from './_lib/category-header';

interface PageProps {
  params: Promise<{
    mainCategorySlug: string;
    subCategorySlug: string;
  }>;
  searchParams: Promise<{ [key: string]: string }>;
}

const CategoryProductPage = async ({ params, searchParams }: PageProps) => {
  const { mainCategorySlug, subCategorySlug } = await params;
  const search = await searchParams;

  const activeFilterValues = Object.entries(search)
    .filter(([key]) => key !== 'sort') // 정렬(sort) 파라미터는 제외하고 싶을 때
    .flatMap(([, value]) => (typeof value === 'string' ? value.split(',') : []))
    .filter(Boolean);

  const activeSortValue = search.sort || 'popular';

  // 1. 데이터 매칭 (CATEGORIES에서 현재 카테고리 정보 찾기)
  const currentCategory = CATEGORIES.find(
    category => category.slug === mainCategorySlug,
  );

  if (!currentCategory) notFound();

  const filteredProducts = await getCategoryProducts(
    activeSortValue,
    activeFilterValues,
    mainCategorySlug,
    subCategorySlug ?? 'all',
  );

  const categoryHeader = getCategoryHeader(CATEGORIES, currentCategory);
  const emptyNotice = getCategoryEmptyNotice();

  return (
    <div className="w-full max-w-6xl px-4 py-6 md:p-8 md:py-10">
      <PageTitle
        current={categoryHeader.current}
        className="mb-2 hidden md:flex"
        siblings={categoryHeader.siblings}
      />

      <div className="flex flex-wrap gap-2 py-2">
        <ButtonLink
          href={`/category/${mainCategorySlug}/all`}
          size="lg"
          variant="outline"
          className={
            subCategorySlug === 'all'
              ? 'bg-black text-white hover:bg-black hover:text-white'
              : 'bg-white text-black'
          }
        >
          ALL
        </ButtonLink>
        {currentCategory.children.map(sub => (
          <ButtonLink
            key={sub.slug}
            href={`/category/${mainCategorySlug}/${sub.slug}`}
            size="lg"
            variant="outline"
            className={
              subCategorySlug === sub.slug
                ? 'bg-black text-white hover:bg-black hover:text-white'
                : 'bg-white text-black'
            }
          >
            {sub.name}
          </ButtonLink>
        ))}
      </div>

      {/* 3. 유틸리티 바 */}
      <ProductFilterBar
        activeFilterValues={activeFilterValues}
        currentSortValue={activeSortValue}
      />

      {/* 4. 상품 그리드 (이전 디자인 계승) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filteredProducts.map(product => (
          <ProductItem
            key={product.id}
            product={toProductCardViewModel(product)}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="flex min-h-56 flex-col items-center justify-center border border-gray-200 px-6 py-14 text-center md:min-h-80 md:px-8 md:py-20">
          <h2 className="text-xl font-black tracking-tight md:text-3xl">
            {emptyNotice.title}
          </h2>
          <p className="mt-2 text-sm font-medium text-gray-500 md:text-base">
            {emptyNotice.description}
          </p>
        </div>
      )}
    </div>
  );
};

export default CategoryProductPage;
