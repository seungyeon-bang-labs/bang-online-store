import { PageTitle } from '@/shared/components/common/page-title';
import { EventBanner } from '@/features/event/event-banner';
import { eventRepository, toEventBannerViewModels } from '@/domains/event';
import { productService, toSaleSectionViewModels } from '@/domains/product';
import { ProductsSection } from '@/features/product/products-section';
import { Container } from '@/shared/components/layout/container';

async function SalePage() {
  const now = new Date();
  const [events, sections] = await Promise.all([
    eventRepository.findMany(),
    productService.findSaleSections({ now }),
  ]);
  const saleEvents = events.filter(event => event.kind === 'sale');
  const eventBannerViewModels = toEventBannerViewModels(saleEvents);
  const saleSections = toSaleSectionViewModels(sections, now);

  return (
    <div className="bg-gray-50 w-full flex justify-center">
      <Container className="mb-20 py-6 pt-14 md:py-10 md:pt-10">
        <PageTitle current="SALE" className="mb-5 hidden md:flex" />

        <EventBanner
          eventBannerViewModels={eventBannerViewModels}
          className="mb-10 md:mb-16"
        />

        <div className="flex flex-col gap-8 md:gap-12">
          {saleSections.map(section => (
            <ProductsSection
              key={section.id}
              title={
                <span className="min-w-0">
                  {section.title}
                  <span className="ml-2 whitespace-nowrap text-red-500">
                    {section.remainingLabel}
                  </span>
                </span>
              }
              productCardViewModels={section.productCardViewModels}
            />
          ))}
        </div>
      </Container>
    </div>
  );
}

export default SalePage;
