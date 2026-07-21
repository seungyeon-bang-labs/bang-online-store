import { PageTitle, type Sibling } from '@/components/common/page-title';
import { toProductCardViewModel } from '@/domains/product';
import { CATEGORIES } from '@/lib/navigation';
import { notFound } from 'next/navigation';
import { ProductItem } from '@/features/product/product-item';
import { ButtonLink } from '@/components/ui/button';
import { ProductFilterBar } from '@/features/product/product-filter-bar';
import { getCategoryProducts } from './_lib/utils';

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

  const currentSub = subCategorySlug
    ? currentCategory.children.find(s => s.slug === subCategorySlug)
    : null;

  const title = currentSub ? currentSub.name : currentCategory.name;

  const filteredProducts = await getCategoryProducts(
    activeSortValue,
    activeFilterValues,
    mainCategorySlug,
    subCategorySlug ?? 'all',
  );

  let categorySiblings: Sibling[] = [];

  if (subCategorySlug === 'all') {
    categorySiblings = CATEGORIES.map(category => ({
      label: category.name,
      href: `/category/${category.slug}/all`,
    }));
  }

  return (
    <div className="w-full max-w-6xl p-8 md:py-10">
      <PageTitle
        parent={
          subCategorySlug !== 'all'
            ? {
                label: currentCategory.name,
                href: `/category/${mainCategorySlug}/all`,
              }
            : undefined
        }
        current={title}
        className="mb-2"
        siblings={categorySiblings}
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
        <div className="py-40 text-center border-4 border-black border-dashed">
          <h2 className="text-4xl font-black italic uppercase mb-4">
            Sold Out
          </h2>
          <p className="font-bold text-gray-400 uppercase tracking-widest">
            현재 준비된 상품이 없습니다.
          </p>
          <button className="mt-8 bg-black text-white px-8 py-4 font-black uppercase text-sm hover:invert transition-all">
            Explore Other
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoryProductPage;
