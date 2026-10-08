import type {
  ProductColorDTO,
  ProductDTO,
  ProductImageDTO,
  ProductStatsDTO,
  ProductStyleDTO,
  ProductVariantDTO,
} from './dto';

export const PRODUCT_STYLE_FIXTURE = [
  {
    "id": 1,
    "name": "싱글 체스터필드 코트",
    "category_id": "coat",
    "created_at": "2026-04-20T00:00:00.000Z",
    "updated_at": "2026-04-20T00:00:00.000Z"
  },
  {
    "id": 2,
    "name": "카멜 더블 브레스트 롱 코트",
    "category_id": "coat",
    "created_at": "2026-04-20T00:00:00.000Z",
    "updated_at": "2026-04-20T00:00:00.000Z"
  },
  {
    "id": 3,
    "name": "네이비 히든 버튼 스탠드 칼라 코트",
    "category_id": "coat",
    "created_at": "2026-04-20T00:00:00.000Z",
    "updated_at": "2026-04-20T00:00:00.000Z"
  },
  {
    "id": 4,
    "name": "다크 그레이 더블 피코트",
    "category_id": "coat",
    "created_at": "2026-04-20T00:00:00.000Z",
    "updated_at": "2026-04-20T00:00:00.000Z"
  },
  {
    "id": 5,
    "name": "카키 그레이 립조직 블루종 자켓",
    "category_id": "jacket",
    "created_at": "2026-04-02T00:00:00.000Z",
    "updated_at": "2026-04-02T00:00:00.000Z"
  },
  {
    "id": 6,
    "name": "네이비 M-65 필드 유틸리티 자켓",
    "category_id": "jacket",
    "created_at": "2026-04-02T00:00:00.000Z",
    "updated_at": "2026-04-02T00:00:00.000Z"
  },
  {
    "id": 7,
    "name": "그린 화이트 배색 트랙탑 자켓",
    "category_id": "jacket",
    "created_at": "2026-04-02T00:00:00.000Z",
    "updated_at": "2026-04-02T00:00:00.000Z"
  },
  {
    "id": 8,
    "name": "그레이 윈도우체크 테일러드 블레이저",
    "category_id": "jacket",
    "created_at": "2026-04-05T00:00:00.000Z",
    "updated_at": "2026-04-05T00:00:00.000Z"
  },
  {
    "id": 9,
    "name": "그린 스트라이프 스포츠 저지 자켓",
    "category_id": "jacket",
    "created_at": "2026-03-22T00:00:00.000Z",
    "updated_at": "2026-03-22T00:00:00.000Z"
  },
  {
    "id": 10,
    "name": "레드 후드 윈드브레이커 자켓",
    "category_id": "jacket",
    "created_at": "2026-03-22T00:00:00.000Z",
    "updated_at": "2026-03-22T00:00:00.000Z"
  },
  {
    "id": 11,
    "name": "머드 카키 포켓 사파리 자켓",
    "category_id": "jacket",
    "created_at": "2026-04-20T00:00:00.000Z",
    "updated_at": "2026-04-20T00:00:00.000Z"
  },
  {
    "id": 12,
    "name": "다크 그린 립조직 V넥 가디건",
    "category_id": "cardigan",
    "created_at": "2026-03-24T00:00:00.000Z",
    "updated_at": "2026-03-24T00:00:00.000Z"
  },
  {
    "id": 13,
    "name": "멜란지 그레이 보일드 울 가디건",
    "category_id": "cardigan",
    "created_at": "2026-04-20T00:00:00.000Z",
    "updated_at": "2026-04-20T00:00:00.000Z"
  },
  {
    "id": 14,
    "name": "올리브 브라운 케이블 집업 가디건",
    "category_id": "cardigan",
    "created_at": "2026-03-24T00:00:00.000Z",
    "updated_at": "2026-03-24T00:00:00.000Z"
  },
  {
    "id": 15,
    "name": "네이비 클래식 숄 칼라 가디건",
    "category_id": "cardigan",
    "created_at": "2026-03-24T00:00:00.000Z",
    "updated_at": "2026-03-24T00:00:00.000Z"
  },
  {
    "id": 16,
    "name": "아이보리 와플 조직 스탠드넥 집업 가디건",
    "category_id": "cardigan",
    "created_at": "2026-03-24T00:00:00.000Z",
    "updated_at": "2026-03-24T00:00:00.000Z"
  },
  {
    "id": 17,
    "name": "블랙 퀄팅 후드 패딩 점퍼",
    "category_id": "padding",
    "created_at": "2026-05-04T00:00:00.000Z",
    "updated_at": "2026-05-04T00:00:00.000Z"
  },
  {
    "id": 18,
    "name": "네이비 경량 다운 패딩 조끼",
    "category_id": "padding",
    "created_at": "2026-04-05T00:00:00.000Z",
    "updated_at": "2026-04-05T00:00:00.000Z"
  },
  {
    "id": 19,
    "name": "그레이 멜란지 후드 숏패딩",
    "category_id": "padding",
    "created_at": "2026-04-05T00:00:00.000Z",
    "updated_at": "2026-04-05T00:00:00.000Z"
  },
  {
    "id": 20,
    "name": "라이트 베이지 하이넥 푸퍼 패딩",
    "category_id": "padding",
    "created_at": "2026-03-24T00:00:00.000Z",
    "updated_at": "2026-03-24T00:00:00.000Z"
  },
  {
    "id": 21,
    "name": "카키 오버사이즈 덕다운 패딩",
    "category_id": "padding",
    "created_at": "2026-03-24T00:00:00.000Z",
    "updated_at": "2026-03-24T00:00:00.000Z"
  },
  {
    "id": 22,
    "name": "차콜 스탠드칼라 경량 패딩",
    "category_id": "padding",
    "created_at": "2026-03-24T00:00:00.000Z",
    "updated_at": "2026-03-24T00:00:00.000Z"
  },
  {
    "id": 23,
    "name": "다크 브라운 롱 구스다운 패딩",
    "category_id": "padding",
    "created_at": "2026-03-24T00:00:00.000Z",
    "updated_at": "2026-03-24T00:00:00.000Z"
  },
  {
    "id": 24,
    "name": "머드 베이지 베이직 숏 푸퍼",
    "category_id": "padding",
    "created_at": "2026-04-20T00:00:00.000Z",
    "updated_at": "2026-04-20T00:00:00.000Z"
  },
  {
    "id": 25,
    "name": "그레이 믹스 숄 칼라 가디건",
    "category_id": "cardigan",
    "created_at": "2026-04-02T00:00:00.000Z",
    "updated_at": "2026-04-02T00:00:00.000Z"
  }
] as const satisfies readonly ProductStyleDTO[];

export const PRODUCT_FIXTURE = [
  {
    "id": 1,
    "style_id": 1,
    "color_id": 1,
    "display_name": null,
    "price": 289000,
    "state": "active",
    "created_at": "2026-04-20T00:00:00.000Z",
    "restocked_at": null
  },
  {
    "id": 2,
    "style_id": 1,
    "color_id": 2,
    "display_name": null,
    "price": 289000,
    "state": "active",
    "created_at": "2026-04-20T00:00:00.000Z",
    "restocked_at": null
  },
  {
    "id": 3,
    "style_id": 1,
    "color_id": 3,
    "display_name": null,
    "price": 289000,
    "state": "active",
    "created_at": "2026-04-20T00:00:00.000Z",
    "restocked_at": null
  },
  {
    "id": 4,
    "style_id": 2,
    "color_id": 3,
    "display_name": "카멜 더블 브레스트 롱 코트",
    "price": 320000,
    "state": "active",
    "created_at": "2026-04-20T00:00:00.000Z",
    "restocked_at": null
  },
  {
    "id": 5,
    "style_id": 3,
    "color_id": 4,
    "display_name": "네이비 히든 버튼 스탠드 칼라 코트",
    "price": 255000,
    "state": "active",
    "created_at": "2026-04-20T00:00:00.000Z",
    "restocked_at": null
  },
  {
    "id": 6,
    "style_id": 4,
    "color_id": 5,
    "display_name": "다크 그레이 더블 피코트",
    "price": 210000,
    "state": "active",
    "created_at": "2026-04-20T00:00:00.000Z",
    "restocked_at": null
  },
  {
    "id": 7,
    "style_id": 5,
    "color_id": 6,
    "display_name": "카키 그레이 립조직 블루종 자켓",
    "price": 159000,
    "state": "active",
    "created_at": "2026-04-02T00:00:00.000Z",
    "restocked_at": null
  },
  {
    "id": 8,
    "style_id": 6,
    "color_id": 4,
    "display_name": "네이비 M-65 필드 유틸리티 자켓",
    "price": 189000,
    "state": "active",
    "created_at": "2026-04-02T00:00:00.000Z",
    "restocked_at": null
  },
  {
    "id": 9,
    "style_id": 7,
    "color_id": 7,
    "display_name": "그린 화이트 배색 트랙탑 자켓",
    "price": 89000,
    "state": "active",
    "created_at": "2026-04-02T00:00:00.000Z",
    "restocked_at": null
  },
  {
    "id": 10,
    "style_id": 8,
    "color_id": 1,
    "display_name": "그레이 윈도우체크 테일러드 블레이저",
    "price": 230000,
    "state": "active",
    "created_at": "2026-04-05T00:00:00.000Z",
    "restocked_at": null
  },
  {
    "id": 11,
    "style_id": 9,
    "color_id": 7,
    "display_name": "그린 스트라이프 스포츠 저지 자켓",
    "price": 89000,
    "state": "active",
    "created_at": "2026-03-22T00:00:00.000Z",
    "restocked_at": null
  },
  {
    "id": 12,
    "style_id": 10,
    "color_id": 8,
    "display_name": "레드 후드 윈드브레이커 자켓",
    "price": 129000,
    "state": "active",
    "created_at": "2026-03-22T00:00:00.000Z",
    "restocked_at": null
  },
  {
    "id": 13,
    "style_id": 11,
    "color_id": 18,
    "display_name": "머드 카키 포켓 사파리 자켓",
    "price": 175000,
    "state": "active",
    "created_at": "2026-04-20T00:00:00.000Z",
    "restocked_at": null
  },
  {
    "id": 14,
    "style_id": 12,
    "color_id": 10,
    "display_name": "다크 그린 립조직 V넥 가디건",
    "price": 129000,
    "state": "active",
    "created_at": "2026-03-24T00:00:00.000Z",
    "restocked_at": null
  },
  {
    "id": 15,
    "style_id": 13,
    "color_id": 11,
    "display_name": "멜란지 그레이 보일드 울 가디건",
    "price": 145000,
    "state": "active",
    "created_at": "2026-04-20T00:00:00.000Z",
    "restocked_at": null
  },
  {
    "id": 16,
    "style_id": 14,
    "color_id": 12,
    "display_name": "올리브 브라운 케이블 집업 가디건",
    "price": 158000,
    "state": "active",
    "created_at": "2026-03-24T00:00:00.000Z",
    "restocked_at": "2026-04-10T00:00:00.000Z"
  },
  {
    "id": 17,
    "style_id": 15,
    "color_id": 4,
    "display_name": "네이비 클래식 숄 칼라 가디건",
    "price": 139000,
    "state": "active",
    "created_at": "2026-03-24T00:00:00.000Z",
    "restocked_at": "2026-04-10T00:00:00.000Z"
  },
  {
    "id": 18,
    "style_id": 16,
    "color_id": 13,
    "display_name": "아이보리 와플 조직 스탠드넥 집업 가디건",
    "price": 142000,
    "state": "active",
    "created_at": "2026-03-24T00:00:00.000Z",
    "restocked_at": "2026-05-02T00:00:00.000Z"
  },
  {
    "id": 19,
    "style_id": 17,
    "color_id": 14,
    "display_name": "블랙 퀄팅 후드 패딩 점퍼",
    "price": 198000,
    "state": "active",
    "created_at": "2026-05-04T00:00:00.000Z",
    "restocked_at": null
  },
  {
    "id": 20,
    "style_id": 18,
    "color_id": 4,
    "display_name": "네이비 경량 다운 패딩 조끼",
    "price": 85000,
    "state": "active",
    "created_at": "2026-04-05T00:00:00.000Z",
    "restocked_at": null
  },
  {
    "id": 21,
    "style_id": 19,
    "color_id": 11,
    "display_name": "그레이 멜란지 후드 숏패딩",
    "price": 165000,
    "state": "active",
    "created_at": "2026-04-05T00:00:00.000Z",
    "restocked_at": null
  },
  {
    "id": 22,
    "style_id": 20,
    "color_id": 18,
    "display_name": "라이트 베이지 하이넥 푸퍼 패딩",
    "price": 179000,
    "state": "active",
    "created_at": "2026-03-24T00:00:00.000Z",
    "restocked_at": null
  },
  {
    "id": 23,
    "style_id": 21,
    "color_id": 15,
    "display_name": "카키 오버사이즈 덕다운 패딩",
    "price": 210000,
    "state": "active",
    "created_at": "2026-03-24T00:00:00.000Z",
    "restocked_at": null
  },
  {
    "id": 24,
    "style_id": 22,
    "color_id": 16,
    "display_name": "차콜 스탠드칼라 경량 패딩",
    "price": 120000,
    "state": "active",
    "created_at": "2026-03-24T00:00:00.000Z",
    "restocked_at": null
  },
  {
    "id": 25,
    "style_id": 23,
    "color_id": 17,
    "display_name": "다크 브라운 롱 구스다운 패딩",
    "price": 345000,
    "state": "active",
    "created_at": "2026-03-24T00:00:00.000Z",
    "restocked_at": null
  },
  {
    "id": 26,
    "style_id": 24,
    "color_id": 18,
    "display_name": "머드 베이지 베이직 숏 푸퍼",
    "price": 159000,
    "state": "active",
    "created_at": "2026-04-20T00:00:00.000Z",
    "restocked_at": null
  },
  {
    "id": 27,
    "style_id": 25,
    "color_id": 19,
    "display_name": "그레이 믹스 숄 칼라 가디건",
    "price": 135000,
    "state": "active",
    "created_at": "2026-04-02T00:00:00.000Z",
    "restocked_at": null
  }
] as const satisfies readonly ProductDTO[];

export const PRODUCT_VARIANT_FIXTURE = [
  {
    "id": "1-GY-S",
    "product_id": 1,
    "size": "S",
    "stock": 12,
    "price_offset": 0
  },
  {
    "id": "1-GY-M",
    "product_id": 1,
    "size": "M",
    "stock": 18,
    "price_offset": 0
  },
  {
    "id": "1-GY-L",
    "product_id": 1,
    "size": "L",
    "stock": 5,
    "price_offset": 0
  },
  {
    "id": "1-GY-XL",
    "product_id": 1,
    "size": "XL",
    "stock": 3,
    "price_offset": 5000
  },
  {
    "id": "1-GY-2XL",
    "product_id": 1,
    "size": "2XL",
    "stock": 0,
    "price_offset": 10000
  },
  {
    "id": "1-DK-S",
    "product_id": 2,
    "size": "S",
    "stock": 8,
    "price_offset": 0
  },
  {
    "id": "1-DK-M",
    "product_id": 2,
    "size": "M",
    "stock": 10,
    "price_offset": 0
  },
  {
    "id": "1-DK-L",
    "product_id": 2,
    "size": "L",
    "stock": 15,
    "price_offset": 0
  },
  {
    "id": "1-DK-XL",
    "product_id": 2,
    "size": "XL",
    "stock": 2,
    "price_offset": 5000
  },
  {
    "id": "1-DK-2XL",
    "product_id": 2,
    "size": "2XL",
    "stock": 4,
    "price_offset": 10000
  },
  {
    "id": "1-CM-S",
    "product_id": 3,
    "size": "S",
    "stock": 20,
    "price_offset": 0
  },
  {
    "id": "1-CM-M",
    "product_id": 3,
    "size": "M",
    "stock": 12,
    "price_offset": 0
  },
  {
    "id": "1-CM-L",
    "product_id": 3,
    "size": "L",
    "stock": 7,
    "price_offset": 0
  },
  {
    "id": "1-CM-XL",
    "product_id": 3,
    "size": "XL",
    "stock": 0,
    "price_offset": 5000
  },
  {
    "id": "1-CM-2XL",
    "product_id": 3,
    "size": "2XL",
    "stock": 1,
    "price_offset": 10000
  },
  {
    "id": "2-CM-S",
    "product_id": 4,
    "size": "S",
    "stock": 5,
    "price_offset": 0
  },
  {
    "id": "2-CM-M",
    "product_id": 4,
    "size": "M",
    "stock": 3,
    "price_offset": 0
  },
  {
    "id": "2-CM-L",
    "product_id": 4,
    "size": "L",
    "stock": 10,
    "price_offset": 0
  },
  {
    "id": "2-CM-XL",
    "product_id": 4,
    "size": "XL",
    "stock": 4,
    "price_offset": 7000
  },
  {
    "id": "2-CM-2XL",
    "product_id": 4,
    "size": "2XL",
    "stock": 2,
    "price_offset": 14000
  },
  {
    "id": "3-NV-S",
    "product_id": 5,
    "size": "S",
    "stock": 10,
    "price_offset": 0
  },
  {
    "id": "3-NV-M",
    "product_id": 5,
    "size": "M",
    "stock": 8,
    "price_offset": 0
  },
  {
    "id": "3-NV-L",
    "product_id": 5,
    "size": "L",
    "stock": 6,
    "price_offset": 0
  },
  {
    "id": "3-NV-XL",
    "product_id": 5,
    "size": "XL",
    "stock": 4,
    "price_offset": 5000
  },
  {
    "id": "3-NV-2XL",
    "product_id": 5,
    "size": "2XL",
    "stock": 2,
    "price_offset": 10000
  },
  {
    "id": "4-DGY-S",
    "product_id": 6,
    "size": "S",
    "stock": 0,
    "price_offset": 0
  },
  {
    "id": "4-DGY-M",
    "product_id": 6,
    "size": "M",
    "stock": 0,
    "price_offset": 0
  },
  {
    "id": "4-DGY-L",
    "product_id": 6,
    "size": "L",
    "stock": 0,
    "price_offset": 0
  },
  {
    "id": "4-DGY-XL",
    "product_id": 6,
    "size": "XL",
    "stock": 0,
    "price_offset": 5000
  },
  {
    "id": "4-DGY-2XL",
    "product_id": 6,
    "size": "2XL",
    "stock": 0,
    "price_offset": 10000
  },
  {
    "id": "5-KGY-S",
    "product_id": 7,
    "size": "S",
    "stock": 10,
    "price_offset": 0
  },
  {
    "id": "5-KGY-M",
    "product_id": 7,
    "size": "M",
    "stock": 15,
    "price_offset": 0
  },
  {
    "id": "5-KGY-L",
    "product_id": 7,
    "size": "L",
    "stock": 12,
    "price_offset": 0
  },
  {
    "id": "5-KGY-XL",
    "product_id": 7,
    "size": "XL",
    "stock": 8,
    "price_offset": 3000
  },
  {
    "id": "5-KGY-2XL",
    "product_id": 7,
    "size": "2XL",
    "stock": 4,
    "price_offset": 6000
  },
  {
    "id": "6-NV-S",
    "product_id": 8,
    "size": "S",
    "stock": 7,
    "price_offset": 0
  },
  {
    "id": "6-NV-M",
    "product_id": 8,
    "size": "M",
    "stock": 9,
    "price_offset": 0
  },
  {
    "id": "6-NV-L",
    "product_id": 8,
    "size": "L",
    "stock": 14,
    "price_offset": 0
  },
  {
    "id": "6-NV-XL",
    "product_id": 8,
    "size": "XL",
    "stock": 5,
    "price_offset": 4000
  },
  {
    "id": "6-NV-2XL",
    "product_id": 8,
    "size": "2XL",
    "stock": 0,
    "price_offset": 8000
  },
  {
    "id": "7-GN-S",
    "product_id": 9,
    "size": "S",
    "stock": 20,
    "price_offset": 0
  },
  {
    "id": "7-GN-M",
    "product_id": 9,
    "size": "M",
    "stock": 18,
    "price_offset": 0
  },
  {
    "id": "7-GN-L",
    "product_id": 9,
    "size": "L",
    "stock": 15,
    "price_offset": 0
  },
  {
    "id": "7-GN-XL",
    "product_id": 9,
    "size": "XL",
    "stock": 10,
    "price_offset": 2000
  },
  {
    "id": "7-GN-2XL",
    "product_id": 9,
    "size": "2XL",
    "stock": 5,
    "price_offset": 4000
  },
  {
    "id": "8-GY-S",
    "product_id": 10,
    "size": "S",
    "stock": 5,
    "price_offset": 0
  },
  {
    "id": "8-GY-M",
    "product_id": 10,
    "size": "M",
    "stock": 8,
    "price_offset": 0
  },
  {
    "id": "8-GY-L",
    "product_id": 10,
    "size": "L",
    "stock": 10,
    "price_offset": 0
  },
  {
    "id": "8-GY-XL",
    "product_id": 10,
    "size": "XL",
    "stock": 3,
    "price_offset": 5000
  },
  {
    "id": "8-GY-2XL",
    "product_id": 10,
    "size": "2XL",
    "stock": 1,
    "price_offset": 10000
  },
  {
    "id": "9-GN-S",
    "product_id": 11,
    "size": "S",
    "stock": 0,
    "price_offset": 0
  },
  {
    "id": "9-GN-M",
    "product_id": 11,
    "size": "M",
    "stock": 0,
    "price_offset": 0
  },
  {
    "id": "9-GN-L",
    "product_id": 11,
    "size": "L",
    "stock": 0,
    "price_offset": 0
  },
  {
    "id": "9-GN-XL",
    "product_id": 11,
    "size": "XL",
    "stock": 0,
    "price_offset": 2000
  },
  {
    "id": "9-GN-2XL",
    "product_id": 11,
    "size": "2XL",
    "stock": 0,
    "price_offset": 4000
  },
  {
    "id": "10-RD-S",
    "product_id": 12,
    "size": "S",
    "stock": 15,
    "price_offset": 0
  },
  {
    "id": "10-RD-M",
    "product_id": 12,
    "size": "M",
    "stock": 11,
    "price_offset": 0
  },
  {
    "id": "10-RD-L",
    "product_id": 12,
    "size": "L",
    "stock": 9,
    "price_offset": 0
  },
  {
    "id": "10-RD-XL",
    "product_id": 12,
    "size": "XL",
    "stock": 6,
    "price_offset": 3000
  },
  {
    "id": "10-RD-2XL",
    "product_id": 12,
    "size": "2XL",
    "stock": 3,
    "price_offset": 6000
  },
  {
    "id": "11-MBE-S",
    "product_id": 13,
    "size": "S",
    "stock": 4,
    "price_offset": 0
  },
  {
    "id": "11-MBE-M",
    "product_id": 13,
    "size": "M",
    "stock": 7,
    "price_offset": 0
  },
  {
    "id": "11-MBE-L",
    "product_id": 13,
    "size": "L",
    "stock": 10,
    "price_offset": 0
  },
  {
    "id": "11-MBE-XL",
    "product_id": 13,
    "size": "XL",
    "stock": 2,
    "price_offset": 4000
  },
  {
    "id": "11-MBE-2XL",
    "product_id": 13,
    "size": "2XL",
    "stock": 0,
    "price_offset": 8000
  },
  {
    "id": "12-DGN-S",
    "product_id": 14,
    "size": "S",
    "stock": 11,
    "price_offset": 0
  },
  {
    "id": "12-DGN-M",
    "product_id": 14,
    "size": "M",
    "stock": 14,
    "price_offset": 0
  },
  {
    "id": "12-DGN-L",
    "product_id": 14,
    "size": "L",
    "stock": 9,
    "price_offset": 0
  },
  {
    "id": "12-DGN-XL",
    "product_id": 14,
    "size": "XL",
    "stock": 5,
    "price_offset": 2000
  },
  {
    "id": "12-DGN-2XL",
    "product_id": 14,
    "size": "2XL",
    "stock": 3,
    "price_offset": 4000
  },
  {
    "id": "13-MGY-S",
    "product_id": 15,
    "size": "S",
    "stock": 6,
    "price_offset": 0
  },
  {
    "id": "13-MGY-M",
    "product_id": 15,
    "size": "M",
    "stock": 8,
    "price_offset": 0
  },
  {
    "id": "13-MGY-L",
    "product_id": 15,
    "size": "L",
    "stock": 12,
    "price_offset": 0
  },
  {
    "id": "13-MGY-XL",
    "product_id": 15,
    "size": "XL",
    "stock": 4,
    "price_offset": 3000
  },
  {
    "id": "13-MGY-2XL",
    "product_id": 15,
    "size": "2XL",
    "stock": 1,
    "price_offset": 6000
  },
  {
    "id": "14-OBR-S",
    "product_id": 16,
    "size": "S",
    "stock": 0,
    "price_offset": 0
  },
  {
    "id": "14-OBR-M",
    "product_id": 16,
    "size": "M",
    "stock": 0,
    "price_offset": 0
  },
  {
    "id": "14-OBR-L",
    "product_id": 16,
    "size": "L",
    "stock": 0,
    "price_offset": 0
  },
  {
    "id": "14-OBR-XL",
    "product_id": 16,
    "size": "XL",
    "stock": 0,
    "price_offset": 3000
  },
  {
    "id": "14-OBR-2XL",
    "product_id": 16,
    "size": "2XL",
    "stock": 0,
    "price_offset": 6000
  },
  {
    "id": "15-NV-S",
    "product_id": 17,
    "size": "S",
    "stock": 18,
    "price_offset": 0
  },
  {
    "id": "15-NV-M",
    "product_id": 17,
    "size": "M",
    "stock": 13,
    "price_offset": 0
  },
  {
    "id": "15-NV-L",
    "product_id": 17,
    "size": "L",
    "stock": 7,
    "price_offset": 0
  },
  {
    "id": "15-NV-XL",
    "product_id": 17,
    "size": "XL",
    "stock": 4,
    "price_offset": 2500
  },
  {
    "id": "15-NV-2XL",
    "product_id": 17,
    "size": "2XL",
    "stock": 0,
    "price_offset": 5000
  },
  {
    "id": "16-IV-S",
    "product_id": 18,
    "size": "S",
    "stock": 10,
    "price_offset": 0
  },
  {
    "id": "16-IV-M",
    "product_id": 18,
    "size": "M",
    "stock": 12,
    "price_offset": 0
  },
  {
    "id": "16-IV-L",
    "product_id": 18,
    "size": "L",
    "stock": 8,
    "price_offset": 0
  },
  {
    "id": "16-IV-XL",
    "product_id": 18,
    "size": "XL",
    "stock": 5,
    "price_offset": 2500
  },
  {
    "id": "16-IV-2XL",
    "product_id": 18,
    "size": "2XL",
    "stock": 3,
    "price_offset": 5000
  },
  {
    "id": "17-BK-S",
    "product_id": 19,
    "size": "S",
    "stock": 0,
    "price_offset": 0
  },
  {
    "id": "17-BK-M",
    "product_id": 19,
    "size": "M",
    "stock": 0,
    "price_offset": 0
  },
  {
    "id": "17-BK-L",
    "product_id": 19,
    "size": "L",
    "stock": 0,
    "price_offset": 0
  },
  {
    "id": "17-BK-XL",
    "product_id": 19,
    "size": "XL",
    "stock": 0,
    "price_offset": 8000
  },
  {
    "id": "17-BK-2XL",
    "product_id": 19,
    "size": "2XL",
    "stock": 0,
    "price_offset": 15000
  },
  {
    "id": "18-NV-S",
    "product_id": 20,
    "size": "S",
    "stock": 12,
    "price_offset": 0
  },
  {
    "id": "18-NV-M",
    "product_id": 20,
    "size": "M",
    "stock": 18,
    "price_offset": 0
  },
  {
    "id": "18-NV-L",
    "product_id": 20,
    "size": "L",
    "stock": 14,
    "price_offset": 0
  },
  {
    "id": "18-NV-XL",
    "product_id": 20,
    "size": "XL",
    "stock": 9,
    "price_offset": 3000
  },
  {
    "id": "18-NV-2XL",
    "product_id": 20,
    "size": "2XL",
    "stock": 5,
    "price_offset": 6000
  },
  {
    "id": "19-MGY-S",
    "product_id": 21,
    "size": "S",
    "stock": 5,
    "price_offset": 0
  },
  {
    "id": "19-MGY-M",
    "product_id": 21,
    "size": "M",
    "stock": 8,
    "price_offset": 0
  },
  {
    "id": "19-MGY-L",
    "product_id": 21,
    "size": "L",
    "stock": 10,
    "price_offset": 0
  },
  {
    "id": "19-MGY-XL",
    "product_id": 21,
    "size": "XL",
    "stock": 4,
    "price_offset": 7000
  },
  {
    "id": "19-MGY-2XL",
    "product_id": 21,
    "size": "2XL",
    "stock": 0,
    "price_offset": 14000
  },
  {
    "id": "20-MBE-S",
    "product_id": 22,
    "size": "S",
    "stock": 8,
    "price_offset": 0
  },
  {
    "id": "20-MBE-M",
    "product_id": 22,
    "size": "M",
    "stock": 12,
    "price_offset": 0
  },
  {
    "id": "20-MBE-L",
    "product_id": 22,
    "size": "L",
    "stock": 15,
    "price_offset": 0
  },
  {
    "id": "20-MBE-XL",
    "product_id": 22,
    "size": "XL",
    "stock": 7,
    "price_offset": 7000
  },
  {
    "id": "20-MBE-2XL",
    "product_id": 22,
    "size": "2XL",
    "stock": 3,
    "price_offset": 14000
  },
  {
    "id": "21-KH-S",
    "product_id": 23,
    "size": "S",
    "stock": 4,
    "price_offset": 0
  },
  {
    "id": "21-KH-M",
    "product_id": 23,
    "size": "M",
    "stock": 9,
    "price_offset": 0
  },
  {
    "id": "21-KH-L",
    "product_id": 23,
    "size": "L",
    "stock": 11,
    "price_offset": 0
  },
  {
    "id": "21-KH-XL",
    "product_id": 23,
    "size": "XL",
    "stock": 5,
    "price_offset": 8000
  },
  {
    "id": "21-KH-2XL",
    "product_id": 23,
    "size": "2XL",
    "stock": 2,
    "price_offset": 16000
  },
  {
    "id": "22-CH-S",
    "product_id": 24,
    "size": "S",
    "stock": 15,
    "price_offset": 0
  },
  {
    "id": "22-CH-M",
    "product_id": 24,
    "size": "M",
    "stock": 12,
    "price_offset": 0
  },
  {
    "id": "22-CH-L",
    "product_id": 24,
    "size": "L",
    "stock": 10,
    "price_offset": 0
  },
  {
    "id": "22-CH-XL",
    "product_id": 24,
    "size": "XL",
    "stock": 6,
    "price_offset": 4000
  },
  {
    "id": "22-CH-2XL",
    "product_id": 24,
    "size": "2XL",
    "stock": 3,
    "price_offset": 8000
  },
  {
    "id": "23-DBR-S",
    "product_id": 25,
    "size": "S",
    "stock": 0,
    "price_offset": 0
  },
  {
    "id": "23-DBR-M",
    "product_id": 25,
    "size": "M",
    "stock": 0,
    "price_offset": 0
  },
  {
    "id": "23-DBR-L",
    "product_id": 25,
    "size": "L",
    "stock": 0,
    "price_offset": 0
  },
  {
    "id": "23-DBR-XL",
    "product_id": 25,
    "size": "XL",
    "stock": 0,
    "price_offset": 12000
  },
  {
    "id": "23-DBR-2XL",
    "product_id": 25,
    "size": "2XL",
    "stock": 0,
    "price_offset": 24000
  },
  {
    "id": "24-MBE-S",
    "product_id": 26,
    "size": "S",
    "stock": 14,
    "price_offset": 0
  },
  {
    "id": "24-MBE-M",
    "product_id": 26,
    "size": "M",
    "stock": 10,
    "price_offset": 0
  },
  {
    "id": "24-MBE-L",
    "product_id": 26,
    "size": "L",
    "stock": 8,
    "price_offset": 0
  },
  {
    "id": "24-MBE-XL",
    "product_id": 26,
    "size": "XL",
    "stock": 5,
    "price_offset": 6000
  },
  {
    "id": "24-MBE-2XL",
    "product_id": 26,
    "size": "2XL",
    "stock": 2,
    "price_offset": 12000
  },
  {
    "id": "25-GMX-S",
    "product_id": 27,
    "size": "S",
    "stock": 6,
    "price_offset": 0
  },
  {
    "id": "25-GMX-M",
    "product_id": 27,
    "size": "M",
    "stock": 9,
    "price_offset": 0
  },
  {
    "id": "25-GMX-L",
    "product_id": 27,
    "size": "L",
    "stock": 12,
    "price_offset": 0
  },
  {
    "id": "25-GMX-XL",
    "product_id": 27,
    "size": "XL",
    "stock": 4,
    "price_offset": 3000
  },
  {
    "id": "25-GMX-2XL",
    "product_id": 27,
    "size": "2XL",
    "stock": 2,
    "price_offset": 6000
  }
] as const satisfies readonly ProductVariantDTO[];

export const PRODUCT_STATS_FIXTURE = [
  {
    "product_id": 1,
    "total_sales": 2451,
    "today_sales": 12,
    "weekly_sales": 89,
    "monthly_sales": 342
  },
  {
    "product_id": 2,
    "total_sales": 892,
    "today_sales": 3,
    "weekly_sales": 42,
    "monthly_sales": 156
  },
  {
    "product_id": 3,
    "total_sales": 1567,
    "today_sales": 21,
    "weekly_sales": 112,
    "monthly_sales": 489
  },
  {
    "product_id": 4,
    "total_sales": 432,
    "today_sales": 0,
    "weekly_sales": 28,
    "monthly_sales": 92
  },
  {
    "product_id": 5,
    "total_sales": 2840,
    "today_sales": 28,
    "weekly_sales": 167,
    "monthly_sales": 512
  },
  {
    "product_id": 6,
    "total_sales": 621,
    "today_sales": 1,
    "weekly_sales": 15,
    "monthly_sales": 102
  },
  {
    "product_id": 7,
    "total_sales": 1842,
    "today_sales": 15,
    "weekly_sales": 94,
    "monthly_sales": 412
  },
  {
    "product_id": 8,
    "total_sales": 1120,
    "today_sales": 4,
    "weekly_sales": 56,
    "monthly_sales": 215
  },
  {
    "product_id": 9,
    "total_sales": 2134,
    "today_sales": 32,
    "weekly_sales": 142,
    "monthly_sales": 562
  },
  {
    "product_id": 10,
    "total_sales": 549,
    "today_sales": 2,
    "weekly_sales": 24,
    "monthly_sales": 88
  },
  {
    "product_id": 11,
    "total_sales": 132,
    "today_sales": 0,
    "weekly_sales": 5,
    "monthly_sales": 21
  },
  {
    "product_id": 12,
    "total_sales": 954,
    "today_sales": 7,
    "weekly_sales": 41,
    "monthly_sales": 128
  },
  {
    "product_id": 13,
    "total_sales": 612,
    "today_sales": 2,
    "weekly_sales": 18,
    "monthly_sales": 76
  },
  {
    "product_id": 14,
    "total_sales": 1421,
    "today_sales": 11,
    "weekly_sales": 74,
    "monthly_sales": 289
  },
  {
    "product_id": 15,
    "total_sales": 782,
    "today_sales": 5,
    "weekly_sales": 38,
    "monthly_sales": 142
  },
  {
    "product_id": 16,
    "total_sales": 212,
    "today_sales": 0,
    "weekly_sales": 8,
    "monthly_sales": 45
  },
  {
    "product_id": 17,
    "total_sales": 1678,
    "today_sales": 14,
    "weekly_sales": 82,
    "monthly_sales": 310
  },
  {
    "product_id": 18,
    "total_sales": 1245,
    "today_sales": 9,
    "weekly_sales": 63,
    "monthly_sales": 241
  },
  {
    "product_id": 19,
    "total_sales": 3042,
    "today_sales": 5,
    "weekly_sales": 120,
    "monthly_sales": 456
  },
  {
    "product_id": 20,
    "total_sales": 2715,
    "today_sales": 24,
    "weekly_sales": 189,
    "monthly_sales": 612
  },
  {
    "product_id": 21,
    "total_sales": 1890,
    "today_sales": 17,
    "weekly_sales": 104,
    "monthly_sales": 387
  },
  {
    "product_id": 22,
    "total_sales": 1422,
    "today_sales": 8,
    "weekly_sales": 71,
    "monthly_sales": 294
  },
  {
    "product_id": 23,
    "total_sales": 567,
    "today_sales": 3,
    "weekly_sales": 22,
    "monthly_sales": 105
  },
  {
    "product_id": 24,
    "total_sales": 1104,
    "today_sales": 10,
    "weekly_sales": 58,
    "monthly_sales": 201
  },
  {
    "product_id": 25,
    "total_sales": 412,
    "today_sales": 1,
    "weekly_sales": 12,
    "monthly_sales": 58
  },
  {
    "product_id": 26,
    "total_sales": 2234,
    "today_sales": 21,
    "weekly_sales": 145,
    "monthly_sales": 502
  },
  {
    "product_id": 27,
    "total_sales": 1056,
    "today_sales": 6,
    "weekly_sales": 48,
    "monthly_sales": 189
  }
] as const satisfies readonly ProductStatsDTO[];

export const PRODUCT_IMAGE_FIXTURE = [
  {
    "id": "1-1",
    "product_id": 1,
    "image_url": "Coat-1.png",
    "image_type": "thumbnail",
    "display_order": 1
  },
  {
    "id": "1-2",
    "product_id": 1,
    "image_url": "coat-1-1.png",
    "image_type": "detail",
    "display_order": 2
  },
  {
    "id": "2-1",
    "product_id": 2,
    "image_url": "coat-1-2.png",
    "image_type": "thumbnail",
    "display_order": 1
  },
  {
    "id": "2-2",
    "product_id": 2,
    "image_url": "coat-1-3.png",
    "image_type": "detail",
    "display_order": 2
  },
  {
    "id": "3-1",
    "product_id": 3,
    "image_url": "coat-1-4.png",
    "image_type": "thumbnail",
    "display_order": 1
  },
  {
    "id": "3-2",
    "product_id": 3,
    "image_url": "coat-1-5.png",
    "image_type": "detail",
    "display_order": 2
  },
  {
    "id": "4-1",
    "product_id": 4,
    "image_url": "Coat-2.png",
    "image_type": "thumbnail",
    "display_order": 1
  },
  {
    "id": "5-1",
    "product_id": 5,
    "image_url": "Coat-3.png",
    "image_type": "thumbnail",
    "display_order": 1
  },
  {
    "id": "6-1",
    "product_id": 6,
    "image_url": "Coat-4.png",
    "image_type": "thumbnail",
    "display_order": 1
  },
  {
    "id": "7-1",
    "product_id": 7,
    "image_url": "jacket-1.png",
    "image_type": "thumbnail",
    "display_order": 1
  },
  {
    "id": "8-1",
    "product_id": 8,
    "image_url": "jacket-2.png",
    "image_type": "thumbnail",
    "display_order": 1
  },
  {
    "id": "9-1",
    "product_id": 9,
    "image_url": "jacket-3.png",
    "image_type": "thumbnail",
    "display_order": 1
  },
  {
    "id": "10-1",
    "product_id": 10,
    "image_url": "jacket-4.png",
    "image_type": "thumbnail",
    "display_order": 1
  },
  {
    "id": "11-1",
    "product_id": 11,
    "image_url": "jacket-5.png",
    "image_type": "thumbnail",
    "display_order": 1
  },
  {
    "id": "12-1",
    "product_id": 12,
    "image_url": "jacket-6.png",
    "image_type": "thumbnail",
    "display_order": 1
  },
  {
    "id": "13-1",
    "product_id": 13,
    "image_url": "jacket-7.png",
    "image_type": "thumbnail",
    "display_order": 1
  },
  {
    "id": "14-1",
    "product_id": 14,
    "image_url": "cardigan-1.png",
    "image_type": "thumbnail",
    "display_order": 1
  },
  {
    "id": "15-1",
    "product_id": 15,
    "image_url": "cardigan-2.png",
    "image_type": "thumbnail",
    "display_order": 1
  },
  {
    "id": "16-1",
    "product_id": 16,
    "image_url": "cardigan-3.png",
    "image_type": "thumbnail",
    "display_order": 1
  },
  {
    "id": "17-1",
    "product_id": 17,
    "image_url": "cardigan-4.png",
    "image_type": "thumbnail",
    "display_order": 1
  },
  {
    "id": "18-1",
    "product_id": 18,
    "image_url": "cardigan-5.png",
    "image_type": "thumbnail",
    "display_order": 1
  },
  {
    "id": "19-1",
    "product_id": 19,
    "image_url": "padding-1.png",
    "image_type": "thumbnail",
    "display_order": 1
  },
  {
    "id": "20-1",
    "product_id": 20,
    "image_url": "padding-2.png",
    "image_type": "thumbnail",
    "display_order": 1
  },
  {
    "id": "21-1",
    "product_id": 21,
    "image_url": "padding-3.png",
    "image_type": "thumbnail",
    "display_order": 1
  },
  {
    "id": "22-1",
    "product_id": 22,
    "image_url": "padding-4.png",
    "image_type": "thumbnail",
    "display_order": 1
  },
  {
    "id": "23-1",
    "product_id": 23,
    "image_url": "padding-5.png",
    "image_type": "thumbnail",
    "display_order": 1
  },
  {
    "id": "24-1",
    "product_id": 24,
    "image_url": "padding-6.png",
    "image_type": "thumbnail",
    "display_order": 1
  },
  {
    "id": "25-1",
    "product_id": 25,
    "image_url": "padding-7.png",
    "image_type": "thumbnail",
    "display_order": 1
  },
  {
    "id": "26-1",
    "product_id": 26,
    "image_url": "padding-8.png",
    "image_type": "thumbnail",
    "display_order": 1
  },
  {
    "id": "27-1",
    "product_id": 27,
    "image_url": "cardigan-6.png",
    "image_type": "thumbnail",
    "display_order": 1
  }
] as const satisfies readonly ProductImageDTO[];

export const PRODUCT_COLOR_FIXTURE = [
  {
    "id": 13,
    "name": "아이보리",
    "hex_code": "#FFFFF0",
    "code": "IV"
  },
  {
    "id": 18,
    "name": "머드 베이지",
    "hex_code": "#C2B280",
    "code": "MBE"
  },
  {
    "id": 3,
    "name": "카멜",
    "hex_code": "#C19A6B",
    "code": "CM"
  },
  {
    "id": 17,
    "name": "다크 브라운",
    "hex_code": "#654321",
    "code": "DBR"
  },
  {
    "id": 12,
    "name": "올리브 브라운",
    "hex_code": "#556B2F",
    "code": "OBR"
  },
  {
    "id": 8,
    "name": "레드",
    "hex_code": "#FF0000",
    "code": "RD"
  },
  {
    "id": 15,
    "name": "카키",
    "hex_code": "#F0E68C",
    "code": "KH"
  },
  {
    "id": 9,
    "name": "머드 카키",
    "hex_code": "#8B4513",
    "code": "MK"
  },
  {
    "id": 7,
    "name": "그린",
    "hex_code": "#008000",
    "code": "GN"
  },
  {
    "id": 10,
    "name": "다크 그린",
    "hex_code": "#006400",
    "code": "DGN"
  },
  {
    "id": 4,
    "name": "네이비",
    "hex_code": "#000080",
    "code": "NV"
  },
  {
    "id": 11,
    "name": "멜란지 그레이",
    "hex_code": "#B0C4DE",
    "code": "MGY"
  },
  {
    "id": 19,
    "name": "그레이 믹스",
    "hex_code": "#BEBEBE",
    "code": "GMX"
  },
  {
    "id": 1,
    "name": "그레이",
    "hex_code": "#808080",
    "code": "GY"
  },
  {
    "id": 6,
    "name": "카키 그레이",
    "hex_code": "#BDB76B",
    "code": "KGY"
  },
  {
    "id": 5,
    "name": "다크 그레이",
    "hex_code": "#A9A9A9",
    "code": "DGY"
  },
  {
    "id": 16,
    "name": "차콜",
    "hex_code": "#36454F",
    "code": "CH"
  },
  {
    "id": 2,
    "name": "다크",
    "hex_code": "#333333",
    "code": "DK"
  },
  {
    "id": 14,
    "name": "블랙",
    "hex_code": "#000000",
    "code": "BK"
  }
] as const satisfies readonly ProductColorDTO[];
