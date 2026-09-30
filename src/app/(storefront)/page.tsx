import { EventBanner } from '@/features/event/event-banner';
import { eventRepository, toEventBannerViewModels } from '@/domains/event';
import {
  categoryRepository,
  createCategoryGroups,
  toCategoryGroupViewModels,
} from '@/domains/category';
import { CategoryShortcutGrid } from '@/features/category/category-shortcut-grid';
import { NewProductsSlider } from '@/features/product/new-products-slider';
import { Container } from '@/shared/components/layout/container';
import { SaleProductsSlider } from '@/features/product/sale-products-slider';
import { MainProductSlider } from '@/features/product/main-product-slider';

async function HomePage() {
  const [events, categories] = await Promise.all([
    eventRepository.findMany(),
    categoryRepository.findMany(),
  ]);
  const categoryGroupViewModels = toCategoryGroupViewModels(
    createCategoryGroups(categories),
  );
  const eventBannerViewModels = toEventBannerViewModels(events);

  return (
    <Container className="mb-20 py-6 pt-14 md:py-10 md:pt-10">
      <EventBanner
        eventBannerViewModels={eventBannerViewModels}
        className="mb-10 md:mb-16"
      />

      <section className="flex flex-col gap-12 md:gap-20">
        <CategoryShortcutGrid categoryGroupViewModels={categoryGroupViewModels} />
        <NewProductsSlider />
        <SaleProductsSlider />
        <MainProductSlider />
      </section>
    </Container>
  );
}

export default HomePage;
