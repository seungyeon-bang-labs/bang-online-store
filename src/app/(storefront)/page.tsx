import { EventBanner } from '@/features/event/event-banner';
import { eventRepository, toEventBannerViewModels } from '@/domains/event';
import {
  categoryRepository,
  createCategoryGroups,
  toCategoryGroupViewModels,
} from '@/domains/category';
import { CategoryShortcutGrid } from '@/features/category/category-shortcut-grid';
import { Container } from '@/shared/components/layout/container';
import { HomeProductSlider } from '@/features/product/home-product-slider';
import {
  getNewProducts,
  getProductDiscountRate,
  productService,
  toProductCardViewModel,
  createProductSections,
  productSectionRepository,
  toProductSectionViewModels,
} from '@/domains/product';

async function HomePage() {
  const [events, categories, products, activeProductSectionData] = await Promise.all([
    eventRepository.findMany(),
    categoryRepository.findMany(),
    productService.findMany(),
    productSectionRepository.findActiveWithItems(),
  ]);
  const categoryGroupViewModels = toCategoryGroupViewModels(
    createCategoryGroups(categories),
  );
  const eventBannerViewModels = toEventBannerViewModels(events);
  const productCardViewModels = products.map(toProductCardViewModel);
  const now = new Date();
  const newProductCardViewModels = getNewProducts(products, now)
    .map(toProductCardViewModel);
  const saleProductCardViewModels = products
    .filter(product => getProductDiscountRate(product.id) > 0)
    .map(toProductCardViewModel);
  const productSectionViewModels = toProductSectionViewModels(
    createProductSections(
      activeProductSectionData.sections,
      activeProductSectionData.items,
    ),
    productCardViewModels,
  );

  return (
    <Container className="mb-20 py-6 pt-14 md:py-10 md:pt-10">
      <EventBanner
        eventBannerViewModels={eventBannerViewModels}
        className="mb-10 md:mb-16"
      />

      <section className="flex flex-col gap-12 md:gap-20">
        <CategoryShortcutGrid categoryGroupViewModels={categoryGroupViewModels} />
        {newProductCardViewModels.length > 0 && (
          <HomeProductSlider
            title="신규 상품"
            href="/new"
            desktopRows={1}
            products={newProductCardViewModels}
          />
        )}
        {saleProductCardViewModels.length > 0 && (
          <HomeProductSlider
            title="할인 상품"
            href="/sale"
            products={saleProductCardViewModels}
          />
        )}
        {productSectionViewModels.map(productSection => (
          <HomeProductSlider
            key={productSection.id}
            title={productSection.title}
            desktopRows={productSection.desktopRows}
            products={productSection.productCardViewModels}
          />
        ))}
      </section>
    </Container>
  );
}

export default HomePage;
