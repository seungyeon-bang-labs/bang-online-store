import { PageTitle } from '@/shared/components/common/page-title';
import {
  compareEventCards,
  eventRepository,
  toEventCardViewModels,
} from '@/domains/event';
import { EventCard } from '@/features/event/event-card';
import { Container } from '@/shared/components/layout/container';

export const revalidate = 3600;

async function EventPage() {
  const events = await eventRepository.findMany();
  const eventCardViewModels = toEventCardViewModels(events).sort(
    compareEventCards,
  );

  return (
    <Container className="mb-20 py-6 pt-14 md:py-10 md:pt-10">
      <PageTitle current="EVENT" className="hidden items-center md:flex" />

      <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-7 md:mt-0 md:grid-cols-2 md:gap-y-8 lg:grid-cols-3">
        {eventCardViewModels.map(eventCardView => (
          <EventCard
            key={eventCardView.id}
            eventCardViewModel={eventCardView}
          />
        ))}
      </div>
    </Container>
  );
}

export default EventPage;
