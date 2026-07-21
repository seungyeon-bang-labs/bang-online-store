import { EventBanner } from '@/features/event/event-banner';
import { eventRepository, toEventBannerViewModels } from '@/domains/event';
import { CategoriesSlider } from '@/features/product/categories-slider';
import { NewProductsSlider } from '@/features/product/new-products-slider';
import { Container } from '@/components/layout/container';
import { SaleProductsSlider } from '@/features/product/sale-products-slider';
import { MainProductSlider } from '@/features/product/main-product-slider';

async function Home() {
  const events = await eventRepository.findMany();
  const eventBannerViewModels = toEventBannerViewModels(events);

  return (
    <Container>
      <EventBanner eventBannerViewModels={eventBannerViewModels} className="mb-16" />

      <section className="flex flex-col gap-20">
        <CategoriesSlider />
        <NewProductsSlider />
        <SaleProductsSlider />
        <MainProductSlider />
      </section>
    </Container>
  );
}

export default Home;
