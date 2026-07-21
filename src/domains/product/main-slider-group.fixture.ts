import type { MainSliderGroupDTO } from './main-slider-group.dto';

export const mainSliderGroupData: MainSliderGroupDTO[] = [
  {
    id: 1,
    title: '가을 인기 상품',
    productIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  },
  {
    id: 2,
    title: '이달의 추천 상품',
    productIds: [16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
    sliderOptions: {
      rows: 1,
    },
  },
];
