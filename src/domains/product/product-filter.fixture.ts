import { colorMap } from "@/lib/products-data";
import type { ProductFilterSectionDTO } from './product-filter.dto';

export const FILTER_CONFIG: ProductFilterSectionDTO[] = [
  {
    id: 'size',
    label: '사이즈',
    type: 'button',
    isMultiple: true,
    options: [
      { id: 'S', label: 'S' },
      { id: 'M', label: 'M' },
      { id: 'L', label: 'L' },
      { id: 'XL', label: 'XL' },
      { id: '2XL', label: '2XL' },
      { id: 'FREE', label: 'FREE' },
    ],
  },
  {
    id: 'price',
    label: '가격대',
    type: 'checkbox',
    isMultiple: false,
    options: [
      { id: '-50000', label: '5만원 이하' },
      { id: '50000-100000', label: '5만원 - 10만원' },
      { id: '100000-200000', label: '10만원 - 20만원' },
      { id: '+200000', label: '20만원 이상' },
    ],
  },
  {
    id: 'discount',
    label: '할인율',
    type: 'button',
    isMultiple: false,
    options: [
      { id: '+30', label: '30% 이상' },
      { id: '+50', label: '50% 이상' },
      { id: '+70', label: '70% 이상' },
    ],
  },
  {
    id: 'color',
    label: '색상',
    type: 'color',
    isMultiple: true,
    options: [
      ...colorMap.map((color) => ({
        id: color.id,
        label: color.label,
        colorCode: color.hexCode,
      })),
    ],
  },
];
