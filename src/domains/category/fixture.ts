import type { CategoryDTO } from './dto';

export const CATEGORY_FIXTURE = [
  { id: 'outer', name: 'OUTER', slug: 'outer', parent_id: null, image_url: null, alt_text: null },
  { id: 'coat', name: '코트', slug: 'coat', parent_id: 'outer', image_url: '/images/categories/coat.png', alt_text: '코트 이미지' },
  { id: 'jacket', name: '자켓', slug: 'jacket', parent_id: 'outer', image_url: '/images/categories/jacket.png', alt_text: '자켓 이미지' },
  { id: 'cardigan', name: '가디건', slug: 'cardigan', parent_id: 'outer', image_url: '/images/categories/cardigan.png', alt_text: '가디건 이미지' },
  { id: 'padding', name: '패딩', slug: 'padding', parent_id: 'outer', image_url: '/images/categories/padding.png', alt_text: '패딩 이미지' },

  { id: 'top', name: 'TOP', slug: 'top', parent_id: null, image_url: null, alt_text: null },
  { id: 't-shirt', name: '티셔츠', slug: 't-shirt', parent_id: 'top', image_url: '/images/categories/t-shirt.png', alt_text: '티셔츠 이미지' },
  { id: 'shirt', name: '셔츠', slug: 'shirt', parent_id: 'top', image_url: '/images/categories/shirt.png', alt_text: '셔츠 이미지' },
  { id: 'knit', name: '니트', slug: 'knit', parent_id: 'top', image_url: '/images/categories/knit.png', alt_text: '니트 이미지' },

  { id: 'bottom', name: 'BOTTOM', slug: 'bottom', parent_id: null, image_url: null, alt_text: null },
  { id: 'denim', name: '청바지', slug: 'denim', parent_id: 'bottom', image_url: '/images/categories/denim.png', alt_text: '청바지 이미지' },
  { id: 'slacks', name: '슬랙스', slug: 'slacks', parent_id: 'bottom', image_url: '/images/categories/slacks.png', alt_text: '슬랙스 이미지' },
  { id: 'shorts', name: '반바지', slug: 'shorts', parent_id: 'bottom', image_url: '/images/categories/shorts.png', alt_text: '반바지 이미지' },

  { id: 'acc-shoes', name: 'ACC/SHOES', slug: 'acc-shoes', parent_id: null, image_url: null, alt_text: null },
  { id: 'bag', name: '가방', slug: 'bag', parent_id: 'acc-shoes', image_url: '/images/categories/bag.png', alt_text: '가방 이미지' },
  { id: 'shoes', name: '신발', slug: 'shoes', parent_id: 'acc-shoes', image_url: '/images/categories/shoes.png', alt_text: '신발 이미지' },
  { id: 'hat', name: '모자', slug: 'hat', parent_id: 'acc-shoes', image_url: '/images/categories/hat.png', alt_text: '모자 이미지' },
] as const satisfies readonly CategoryDTO[];
