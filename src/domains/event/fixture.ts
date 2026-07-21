import type { EventDTO } from './dto';

export const EVENTS: EventDTO[] = [
  {
    id: 1,
    title: '2026 봄 신상 컬렉션 발매',
    subtitle: '신규 컬렉션 발매 기념 쿠폰 증정',
    description: `2026 봄 신상 컬렉션 발매를 기념하여 쿠폰 2종을 증정하는 이벤트입니다.
쿠폰은 모든 고객에게 제공되며, 전 품목에 적용 가능합니다. 
이번 봄 신상 컬렉션에서는 다양한 스타일과 색상의 제품들을 선보이니 많은 관심 부탁드립니다!`,
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-07-08'),
    kind: 'promotion',
    imgUrl: '/images/event-1.png',
    couponList: {
      title: '봄 신상 컬렉션 발매 기념 쿠폰',
      items: [{ id: 3 }, { id: 4 }],
    },
    productList: {
      title: '2026 봄 신상 컬렉션',
      items: [
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
        { id: 5 },
        { id: 6 },
        { id: 7 },
        { id: 8 },
      ],
    },
  },
  {
    id: 2,
    title: '봄 맞이 할인 쿠폰 증정',
    subtitle: '봄 시즌 맞이 전 고객 대상 15%, 2만원 할인 쿠폰 증정',
    description: `봄 시즌 맞이 전 고객 대상 15% 할인 쿠폰과 2만원 할인 쿠폰을 증정하는 이벤트입니다.
15% 할인 쿠폰은 모든 고객에게 제공되며, 2만원 할인 쿠폰은 5만원 이상 구매 시 사용할 수 있습니다.
두 쿠폰 모두 전 품목에 적용 가능하며, 다른 쿠폰과 중복 사용은 불가능합니다.`,
    startDate: new Date('2026-05-20'),
    endDate: new Date('2026-07-09'),
    kind: 'coupon',
    imgUrl: '/images/event-7.png',
    couponList: {
      title: '봄 시즌 쿠폰',
      items: [{ id: 1 }, { id: 2 }],
    },
  },
  {
    id: 3,
    title: '베스트 리뷰 챔피언 선정',
    subtitle: '베스트 리뷰어 선정 및 50,000P 지급',
    description: `고객님의 소중한 리뷰를 선정하여 베스트 리뷰어에게 포인트를 지급하는 상시 이벤트입니다.
상품을 구매하고 정성스러운 리뷰를 남겨주시면 선정 기준에 따라 리워드를 받을 수 있습니다.`,
    startDate: new Date('2026-01-01'),
    endDate: null,
    kind: 'reward',
    imgUrl: '/images/event-2.png',
    rewardList: {
      title: '베스트 리뷰 리워드',
      items: [
        {
          title: '베스트 리뷰어 선정',
          description: '정성스러운 리뷰를 남긴 고객을 선정해 포인트를 지급합니다.',
          valueLabel: '50,000P',
        },
      ],
    },
  },
  {
    id: 4,
    title: '멤버십 위크 포인트 2배',
    subtitle: '등급별 포인트 2배 적립 혜택',
    description: `멤버십 고객을 위한 포인트 적립 이벤트입니다.
이벤트 기간 동안 등급별 기준에 따라 포인트 적립 혜택이 확대 적용됩니다.`,
    startDate: new Date('2026-07-04'),
    endDate: new Date('2026-07-15'),
    kind: 'reward',
    imgUrl: '/images/event-3.png',
    rewardList: {
      title: '멤버십 포인트 리워드',
      items: [
        {
          title: '브론즈 멤버십',
          description: '이벤트 기간 동안 포인트 적립 혜택이 확대됩니다.',
          valueLabel: '포인트 2배',
          color: 'bronze',
        },
        {
          title: '실버 멤버십',
          description: '이벤트 기간 동안 포인트 적립 혜택이 확대됩니다.',
          valueLabel: '포인트 2배',
          color: 'silver',
        },
        {
          title: '골드 멤버십',
          description: '이벤트 기간 동안 포인트 적립 혜택이 확대됩니다.',
          valueLabel: '포인트 3배',
          color: 'gold',
        },
        {
          title: '플래티넘 멤버십',
          description: '이벤트 기간 동안 포인트 적립 혜택이 확대됩니다.',
          valueLabel: '포인트 5배',
          color: 'platinum',
        },
      ],
    },
  },
  {
    id: 5,
    title: '겨울 시즌 마지막 세일',
    subtitle: '겨울 시즌 마지막 최대 80% 세일',
    description: `겨울 시즌 마지막 세일을 맞이하여 최대 80% 할인 혜택을 제공하는 이벤트입니다.
이번 세일에서는 다양한 겨울 의류와 액세서리를 저렴한 가격에 만나보실 수 있습니다. 
재고 소진 시 조기 종료될 수 있으니 서둘러 확인해보세요!`,
    startDate: new Date('2026-04-01'),
    endDate: new Date('2026-06-30'),
    kind: 'sale',
    imgUrl: '/images/event-4.png',
    productList: {
      title: '겨울 시즌 마지막 세일',
      items: [
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
        { id: 5 },
        { id: 6 },
        { id: 7 },
        { id: 8 },
      ],
    },
  },
  {
    id: 6,
    title: '2025 겨울 신상 컬렉션 발매',
    subtitle: '신규 컬렉션 발매 기념 10% 쿠폰 증정',
    description: `겨울 시즌 신상 컬렉션 발매를 기념하여 준비한 프로모션입니다.
새롭게 입고되는 겨울 상품을 확인하고 시즌 스타일을 미리 만나보세요.`,
    startDate: new Date('2026-05-01'),
    endDate: new Date('2026-07-01'),
    kind: 'promotion',
    imgUrl: '/images/event-5.png',
    productList: {
      items: [
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
        { id: 5 },
        { id: 6 },
        { id: 7 },
        { id: 8 },
      ],
    },
  },
  {
    id: 7,
    title: '여름 아웃도어 입고',
    subtitle: '여름 아웃도어 신상품 입고 기념 20% 세일',
    description: `여름 아웃도어 신상품 입고를 소개하는 프로모션입니다.
가벼운 착용감과 활동성을 갖춘 아웃도어 상품을 이벤트 기간 동안 특별한 혜택으로 만나보세요.`,
    startDate: new Date('2026-07-01'),
    endDate: new Date('2026-08-31'),
    kind: 'promotion',
    imgUrl: '/images/event-6.png',
    productList: {
      title: '여름 아웃도어 신상품',
      items: [
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { id: 4 },
        { id: 5 },
        { id: 6 },
        { id: 7 },
        { id: 8 },
      ],
    },
  },
  {
    id: 8,
    title: '지난달 회원 전용 쿠폰팩',
    subtitle: '회원 전용 할인 쿠폰 지급',
    description: `지난달 회원 고객을 대상으로 진행했던 쿠폰팩 지급 이벤트입니다.
회원 등급과 구매 조건에 따라 다양한 할인 쿠폰을 받아볼 수 있습니다.`,
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-06-20'),
    kind: 'coupon',
    imgUrl: '/images/event-7.png',
    couponList: {
      title: '회원 전용 쿠폰',
      items: [{ id: 1 }, { id: 3 }],
    },
  },
  {
    id: 9,
    title: '상반기 리뷰 리워드 챌린지',
    subtitle: '리뷰 작성 고객 대상 포인트 리워드 지급',
    description: `상반기 동안 진행했던 리뷰 리워드 챌린지입니다.
상품을 구매하고 리뷰를 작성한 고객에게 참여 조건에 따라 포인트 리워드를 지급합니다.`,
    startDate: new Date('2026-04-01'),
    endDate: new Date('2026-06-15'),
    kind: 'reward',
    imgUrl: '/images/event-2.png',
    rewardList: {
      title: '리뷰 리워드',
      items: [
        {
          title: '포토 리뷰 리워드',
          description: '포토 리뷰를 작성한 고객에게 포인트를 지급합니다.',
          valueLabel: '3,000P',
        },
        {
          title: '베스트 리뷰 리워드',
          description: '우수 리뷰로 선정된 고객에게 추가 포인트를 지급합니다.',
          valueLabel: '30,000P',
          color: 'gold',
        },
      ],
    },
  },
];
