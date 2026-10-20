import { getDiscountBoundaryMilliseconds } from '@/domains/discount/discount.domain';
import { toProductCardViewModel } from './mapper';
import type { ProductSaleSectionModel } from './model';
import type { ProductSaleSectionViewModel } from './view-model';

const seoulDateTime = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});

function calendarParts(date: Date) {
  const parts = seoulDateTime.formatToParts(date);
  const part = (name: Intl.DateTimeFormatPartTypes) => parts.find(value => value.type === name)!.value;
  return {
    day: Date.UTC(Number(part('year')), Number(part('month')) - 1, Number(part('day'))),
    hour: part('hour'), minute: part('minute'), second: part('second'),
  };
}

export function getSaleRemainingLabel(endsAt: string, now: Date): string | null {
  if (now.getTime() >= getDiscountBoundaryMilliseconds(endsAt)) return null;
  const end = calendarParts(new Date(endsAt));
  const today = calendarParts(now);
  const fraction = endsAt.match(/\.(\d+)(?:Z|[+-]\d{2}(?::?\d{2})?)$/i)?.[1] ?? '';
  const midnight = end.hour === '00' && end.minute === '00' && end.second === '00'
    && !/[1-9]/.test(fraction);
  const remainingDays = (end.day - (midnight ? 86400000 : 0) - today.day) / 86400000;
  const time = `${end.hour}:${end.minute}`;
  if (remainingDays === 0) return midnight ? '오늘 종료' : `오늘 ${time} 종료`;
  return midnight ? `D-${remainingDays}` : `D-${remainingDays} · ${time} 종료`;
}

export function toSaleSectionViewModels(
  sections: readonly ProductSaleSectionModel[],
  now: Date,
): ProductSaleSectionViewModel[] {
  return [...sections]
    .sort((a, b) => a.priority - b.priority || a.id - b.id)
    .flatMap(section => {
      const remainingLabel = getSaleRemainingLabel(section.endsAt, now);
      if (remainingLabel === null || section.products.length === 0) return [];

      return [{
        id: section.id,
        title: section.title,
        remainingLabel,
        productCardViewModels: section.products.map(toProductCardViewModel),
      }];
    });
}
