import { PopularSearchKeyword } from '@/features/search/search.types';

export const RECENT_SEARCH_KEYWORDS = ['셔츠', '자켓', '니트', '슬랙스'];

export const POPULAR_SEARCH_KEYWORDS: PopularSearchKeyword[] = [
  { keyword: '린넨 셔츠', rankChange: 2 },
  { keyword: '와이드 팬츠', rankChange: 0 },
  { keyword: '반팔 니트', rankChange: -1 },
  { keyword: '샌들', rankChange: 'new' },
  { keyword: '블레이저', rankChange: 1 },
  { keyword: '오버핏 셔츠', rankChange: -2 },
  { keyword: '데님 팬츠', rankChange: 3 },
  { keyword: '카라 니트', rankChange: 0 },
  { keyword: '슬랙스', rankChange: -1 },
  { keyword: '레더 벨트', rankChange: 'new' },
];
