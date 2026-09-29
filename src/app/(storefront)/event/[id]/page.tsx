import { notFound } from 'next/navigation';
import { EventHero } from '@/features/event/event-hero';
import { EventDescription } from '@/features/event/event-description';
import { EventCouponList } from '@/features/event/event-coupon-list';
import { EventProductList } from '@/features/event/event-product-list';
import { EventEndedBenefitNotice } from '@/features/event/event-ended-benefit-notice';
import { EventRewardList } from '@/features/event/event-reward-list';
import { getEventDetailViewModel } from '@/domains/event';

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

const ENDED_SALE_PRODUCT_NOTICE = {
  title: '세일 상품 안내',
  description: '이 이벤트는 종료되어 세일 상품 혜택을 더 이상 제공하지 않습니다.',
};

async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;
  const eventDetailViewModel = await getEventDetailViewModel(id);

  if (!eventDetailViewModel) {
    notFound();
  }

  const {
    kind,
    eventHeroViewModel,
    isEnded,
    description,
    couponSection,
    productSection,
    rewardSection,
  } = eventDetailViewModel;
  const isEndedSaleEvent = isEnded && kind === 'sale';

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-16 md:pb-20">
      <EventHero eventHeroViewModel={eventHeroViewModel} />

      <div className="mx-auto mt-6 max-w-6xl px-4 sm:px-5 md:mt-10 md:px-6">
        <EventDescription description={description} />

        {couponSection && (
          <EventCouponList
            couponSection={couponSection}
            disabled={isEnded}
          />
        )}

        {productSection && (
          <EventProductList
            productSection={productSection}
            showCurrentProductNotice={isEnded}
          />
        )}

        {rewardSection && (
          <EventRewardList rewardSection={rewardSection} disabled={isEnded} />
        )}

        {isEndedSaleEvent && (
          <EventEndedBenefitNotice
            title={ENDED_SALE_PRODUCT_NOTICE.title}
            description={ENDED_SALE_PRODUCT_NOTICE.description}
          />
        )}
      </div>
    </div>
  );
}

export default EventDetailPage;
