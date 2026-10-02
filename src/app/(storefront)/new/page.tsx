import { EventBanner } from '@/features/event/event-banner';
import { PageTitle } from '@/shared/components/common/page-title';
import { eventRepository, toEventBannerViewModels } from '@/domains/event';
import { productService, toProductCardViewModel, type ProductModel } from '@/domains/product';
import { NEW_TABS } from '@/shared/lib/navigation';
import { Tabs } from '@/shared/components/common/tabs';
import { ProductsSection } from '@/features/product/products-section';
import { Container } from '@/shared/components/layout/container';

interface NewPageProps {
  searchParams: Promise<{
    period?: string;
  }>;
}

type ProductSectionType =
  | 'new'
  | 'restock'
  | 'upcoming-new'
  | 'upcoming-restock'
  | 'past';

const DAY_MS = 1000 * 3600 * 24;

const getDiffInDays = (createdAt: Date) =>
  (new Date().getTime() - new Date(createdAt).getTime()) / DAY_MS;

const isWithinLast30Days = (date: Date) => {
  const diffInDays = getDiffInDays(date);
  return diffInDays >= 0 && diffInDays <= 30;
};

const isUpcomingDate = (date: Date) => getDiffInDays(date) < 0;

const getSectionTitle = (type: ProductSectionType) => {
  switch (type) {
    case 'new':
      return '신규 발매';
    case 'restock':
      return '재입고';
    case 'upcoming-new':
      return '신규 발매 예정';
    case 'upcoming-restock':
      return '재입고 예정';
    case 'past':
      return '신규 출시';
    default:
      return '신규 발매';
  }
};

const getProductSectionMeta = (
  createdAt: Date,
  restockedAt: Date | null | undefined,
  period: string,
): { type: ProductSectionType; date: Date } | null => {
  const isNewArrival = isWithinLast30Days(createdAt);
  const isUpcomingNew = isUpcomingDate(createdAt);
  const isRecentRestock = restockedAt ? isWithinLast30Days(restockedAt) : false;
  const isUpcomingRestock = restockedAt ? isUpcomingDate(restockedAt) : false;

  switch (period) {
    case 'now': {
      if (isRecentRestock && restockedAt) {
        return { type: 'restock', date: restockedAt };
      }
      if (isUpcomingRestock && restockedAt) {
        return { type: 'upcoming-restock', date: restockedAt };
      }
      if (isUpcomingNew) {
        return { type: 'upcoming-new', date: createdAt };
      }
      if (isNewArrival) {
        return { type: 'new', date: createdAt };
      }
      return null;
    }
    case 'new-arrivals':
      return isNewArrival ? { type: 'new', date: createdAt } : null;
    case 'upcoming': {
      if (isUpcomingRestock && restockedAt) {
        return { type: 'upcoming-restock', date: restockedAt };
      }
      if (isUpcomingNew) {
        return { type: 'upcoming-new', date: createdAt };
      }
      return null;
    }
    case 'restock':
      return isRecentRestock && restockedAt
        ? { type: 'restock', date: restockedAt }
        : null;
    case 'past':
      return getDiffInDays(createdAt) > 30 ? { type: 'past', date: createdAt } : null;
    default:
      return null;
  }
};

const getSectionOrder = (type: ProductSectionType) => {
  switch (type) {
    case 'upcoming-new':
      return 1;
    case 'upcoming-restock':
      return 2;
    case 'new':
      return 3;
    case 'restock':
      return 4;
    case 'past':
      return 5;
    default:
      return 99;
  }
};

const formatDateKey = (date: Date) =>
  `${String(date.getFullYear()).slice(-2)}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

async function NewPage({ searchParams }: NewPageProps) {
  const { period } = await searchParams;
  const currentPeriod = period || 'now';

  const events = await eventRepository.findMany();
  const products = await productService.findMany();
  const promotionEvents = events.filter(
    event => event.kind === 'promotion',
  );
  const eventBannerViewModels = toEventBannerViewModels(promotionEvents);

  const groupedProducts = products.reduce(
    (acc, product) => {
      const meta = getProductSectionMeta(
        product.createdAt,
        product.restockedAt,
        currentPeriod,
      );

      if (!meta) {
        return acc;
      }

      const dateKey = formatDateKey(meta.date);
      const sectionKey = `${meta.type}:${dateKey}`;

      if (!acc[sectionKey]) {
        acc[sectionKey] = {
          type: meta.type,
          dateKey,
          dateValue: meta.date,
          items: [],
        };
      }

      acc[sectionKey].items.push(product);
      return acc;
    },
    {} as Record<
      string,
      {
        type: ProductSectionType;
        dateKey: string;
        dateValue: Date;
        items: ProductModel[];
      }
    >,
  );

  const sections = Object.values(groupedProducts).sort((a, b) => {
    const orderDiff = getSectionOrder(a.type) - getSectionOrder(b.type);

    if (orderDiff !== 0) {
      return orderDiff;
    }

    return b.dateValue.getTime() - a.dateValue.getTime();
  });

  return (
    <div className="bg-gray-50 w-full flex justify-center">
      <Container className="mb-20 py-6 pt-28 md:py-10 md:pt-10">
        <PageTitle current="NEW" className="mb-5 hidden md:flex" />

        <EventBanner
          eventBannerViewModels={eventBannerViewModels}
          className="mb-10 md:mb-16"
        />

        <Tabs
          tabs={NEW_TABS}
          queryKey="period"
          currentTab={currentPeriod}
          className="hidden md:sticky md:top-24 md:z-20 md:mb-6 md:flex md:border-b md:border-gray-200 md:bg-gray-50 md:px-0.5 md:py-4"
        />

        <div className="flex flex-col gap-8 md:gap-12">
          {sections.length === 0 && (
            <p className="py-16 text-center text-sm text-gray-500">
              해당 탭에 표시할 상품이 없습니다.
            </p>
          )}
          {sections.map(section => (
            <ProductsSection
              key={`${section.type}-${section.dateKey}`}
              title={`${section.dateKey} ${getSectionTitle(section.type)}`}
              productCardViewModels={section.items.map(toProductCardViewModel)}
            />
          ))}
        </div>
      </Container>
    </div>
  );
}

export default NewPage;
