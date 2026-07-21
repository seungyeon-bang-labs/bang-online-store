import { PageTitle } from '@/components/common/page-title';
import {
  compareEventCards,
  eventRepository,
  toEventCardViewModels,
} from '@/domains/event';
import { EventCard } from '@/features/event/event-card';
import { Container } from '@/components/layout/container';

export const revalidate = 3600;

async function EventPage() {
  const events = await eventRepository.findMany();
  const eventCardViewModels = toEventCardViewModels(events).sort(
    compareEventCards,
  );

  return (
    <Container>
      <PageTitle current="EVENT" className="items-center" />

      <div className="grid grid-cols-1 gap-x-4 gap-y-7 md:grid-cols-2 md:gap-y-8 lg:grid-cols-3">
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
