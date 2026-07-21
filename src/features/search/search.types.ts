export type SearchRankChange = number | 'new';

export interface PopularSearchKeyword {
  keyword: string;
  rankChange: SearchRankChange;
}

export interface RankChangeView {
  label: string;
  className: string;
}
