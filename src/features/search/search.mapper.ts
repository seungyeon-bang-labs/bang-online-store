import {
  RankChangeView,
  SearchRankChange,
} from '@/features/search/search.types';

export function toRankChangeView(
  rankChange: SearchRankChange,
): RankChangeView {
  if (rankChange === 'new') {
    return {
      label: 'NEW',
      className: 'text-black',
    };
  }

  if (rankChange > 0) {
    return {
      label: `▲${rankChange}`,
      className: 'text-red-600',
    };
  }

  if (rankChange < 0) {
    return {
      label: `▼${Math.abs(rankChange)}`,
      className: 'text-blue-600',
    };
  }

  return {
    label: '—',
    className: 'text-zinc-400',
  };
}
