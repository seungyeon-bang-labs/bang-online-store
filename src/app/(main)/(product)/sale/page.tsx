import { PageTitle } from '@/components/common/page-title';
import { EventBanner } from '@/features/event/event-banner';
import { eventRepository, toEventBannerViewModels } from '@/domains/event';
import { DISCOUNTS } from '@/lib/product-discounts-data';
import { products } from '@/lib/products-data';
import { ProductsSection } from '@/features/product/products-section';
import { Container } from '@/components/layout/container';

function getRemainingLabel(endDate: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate(),
  );

  const diffDays = Math.floor((end.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) return '종료';
  if (diffDays === 0) return '오늘 종료';
  return `D-${diffDays}`;
}

async function SalePage() {
  const events = await eventRepository.findMany();
  const saleEvents = events.filter(event => event.kind === 'sale');
  const eventBannerViewModels = toEventBannerViewModels(saleEvents);
  const activeDiscounts = DISCOUNTS.filter(discount => discount.isActive).sort(
    (a, b) => a.priority - b.priority,
  );

  const saleSections = activeDiscounts
    .map(discount => {
      const productIds = new Set(
        discount.items.flatMap(item => item.productIds.map(id => Number(id))),
      );

      const items = products.filter(product => productIds.has(product.id));

      return {
        id: discount.id,
        title: discount.title,
        remainingLabel: getRemainingLabel(discount.endDate),
        items,
      };
    })
    .filter(section => section.items.length > 0);

  return (
    <div className="bg-gray-50 w-full flex justify-center">
      <Container>
        <PageTitle current="SALE" className="mb-5" />

        <EventBanner eventBannerViewModels={eventBannerViewModels} className="mb-16" />

        <div className='flex flex-col gap-12'>
          {saleSections.map(section => (
            <ProductsSection
              key={section.id}
              title={
                <>
                  {section.title}
                  <span className="text-red-500 ml-2">{section.remainingLabel}</span>
                </>
              }
              items={section.items}
            />
          ))}
        </div>
      </Container>
    </div>
  );
}

export default SalePage;
