import { EventBanner } from '@/features/event/event-banner';
import { eventRepository, toEventBannerViewModels } from '@/domains/event';
import { CategoriesGrid } from '@/features/product/categories-grid';
import { NewProductsSlider } from '@/features/product/new-products-slider';
import { Container } from '@/shared/components/layout/container';
import { SaleProductsSlider } from '@/features/product/sale-products-slider';
import { MainProductSlider } from '@/features/product/main-product-slider';

async function Home() {
  const events = await eventRepository.findMany();
  const eventBannerViewModels = toEventBannerViewModels(events);

  return (
    <Container className="mb-20 py-6 pt-14 md:py-10 md:pt-10">
      <EventBanner
        eventBannerViewModels={eventBannerViewModels}
        className="mb-10 md:mb-16"
      />

      <section className="flex flex-col gap-12 md:gap-20">
        <CategoriesGrid />
        <NewProductsSlider />
        <SaleProductsSlider />
        <MainProductSlider />
      </section>
    </Container>
  );
}

export default Home;
