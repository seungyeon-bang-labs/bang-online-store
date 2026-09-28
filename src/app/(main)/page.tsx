import { EventBanner } from '@/features/event/event-banner';
import { eventRepository, toEventBannerViewModels } from '@/domains/event';
import { CategoriesSlider } from '@/features/product/categories-slider';
import { NewProductsSlider } from '@/features/product/new-products-slider';
import { Container } from '@/shared/components/layout/container';
import { SaleProductsSlider } from '@/features/product/sale-products-slider';
import { MainProductSlider } from '@/features/product/main-product-slider';

async function Home() {
  const events = await eventRepository.findMany();
  const eventBannerViewModels = toEventBannerViewModels(events);

  return (
    <Container className="pt-14 md:pt-10">
      <EventBanner
        eventBannerViewModels={eventBannerViewModels}
        className="mb-10 md:mb-16"
      />

      <section className="flex flex-col gap-12 md:gap-20">
        <CategoriesSlider />
        <NewProductsSlider />
        <SaleProductsSlider />
        <MainProductSlider />
      </section>
    </Container>
  );
}

export default Home;
