import type { Event, EventView } from './dto';
import type { EventCardViewModel } from './view-model';

const NEW_EVENT_DAYS = 7;

export const formatPeriod = (
  startDate: Date,
  endDate?: Date | null,
): string => {
  const startDateOnly = getKstDateOnly(startDate);
  const startYear = startDateOnly.getFullYear();
  const startStr = startDateOnly.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (!endDate) return `상시 진행`;

  const endDateOnly = getKstDateOnly(endDate);
  const endYear = endDateOnly.getFullYear();
  const endStr = endDateOnly.toLocaleDateString('ko-KR', {
    year: startYear === endYear ? undefined : 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `${startStr} ~ ${endStr}`;
};

export const formatExpiryDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}년 ${month}월 ${day}일 까지`;
};

export function getEventStatus(
  event: Event,
  now = new Date(),
): 'ongoing' | 'ended' {
  if (!event.endDate) {
    return 'ongoing';
  }

  const today = getKstDateOnly(now);
  const end = getKstDateOnly(event.endDate);

  return end < today ? 'ended' : 'ongoing';
}

export function buildEventView(event: Event, now = new Date()): EventView {
  const today = getKstDateOnly(now);

  let isExpired = false;
  let daysUntilEnd: number | null = null;

  if (event.endDate) {
    const targetDay = getKstDateOnly(event.endDate);

    const diffTime = targetDay.getTime() - today.getTime();
    daysUntilEnd = Math.round(diffTime / (1000 * 60 * 60 * 24));
    isExpired = daysUntilEnd < 0;
  }

  let status: EventView['status'] = event.endDate ? '진행중' : '상시 진행';

  if (isExpired) {
    status = '종료';
  } else if (daysUntilEnd === 0) {
    status = '오늘 종료';
  } else if (daysUntilEnd !== null && daysUntilEnd <= 7) {
    status = `D-${daysUntilEnd}` as EventView['status'];
  }

  return {
    ...event,
    isExpired,
    status,
  };
}

export function compareEventCards(
  a: EventCardViewModel,
  b: EventCardViewModel,
) {
  const priorityDiff =
    getEventCardSortPriority(a) - getEventCardSortPriority(b);

  if (priorityDiff !== 0) {
    return priorityDiff;
  }

  if (isDeadlineSoonEvent(a) && isDeadlineSoonEvent(b)) {
    return getTimeOrInfinity(a.endDate) - getTimeOrInfinity(b.endDate);
  }

  if (a.isExpired && b.isExpired) {
    return getTimeOrZero(b.endDate) - getTimeOrZero(a.endDate);
  }

  return b.startDate.getTime() - a.startDate.getTime();
}

function getEventCardSortPriority(eventCardViewModel: EventCardViewModel) {
  if (eventCardViewModel.isExpired) return 5;
  if (isDeadlineSoonEvent(eventCardViewModel)) return 1;
  if (isNewEvent(eventCardViewModel)) return 2;
  if (!eventCardViewModel.endDate) return 4;
  return 3;
}

function isDeadlineSoonEvent(eventCardViewModel: EventCardViewModel) {
  return (
    eventCardViewModel.status === '오늘 종료' ||
    eventCardViewModel.status.startsWith('D-')
  );
}

function isNewEvent(eventCardViewModel: EventCardViewModel) {
  const diffDays =
    (Date.now() - eventCardViewModel.startDate.getTime()) / 86400000;

  return diffDays >= 0 && diffDays <= NEW_EVENT_DAYS;
}

function getTimeOrInfinity(date: Date | null) {
  return date?.getTime() ?? Number.POSITIVE_INFINITY;
}

function getTimeOrZero(date: Date | null) {
  return date?.getTime() ?? 0;
}

function getKstDateOnly(date: Date) {
  const kstDate = new Date(
    date.toLocaleString('en-US', {
      timeZone: 'Asia/Seoul',
      hour12: false,
    }),
  );

  return new Date(
    kstDate.getFullYear(),
    kstDate.getMonth(),
    kstDate.getDate(),
  );
}
