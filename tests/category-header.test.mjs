import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getCategoryEmptyNotice,
  getCategoryHeader,
} from '../src/app/(storefront)/category/[mainCategorySlug]/[subCategorySlug]/_lib/category-header.ts';

const categories = [
  { name: 'OUTER', slug: 'outer' },
  { name: 'TOP', slug: 'top' },
];

test('uses the parent category as the dropdown title on a subcategory page', () => {
  assert.deepEqual(getCategoryHeader(categories, categories[0]), {
    current: 'OUTER',
    siblings: [
      { label: 'OUTER', href: '/category/outer/all' },
      { label: 'TOP', href: '/category/top/all' },
    ],
  });
});

test('shows an explanatory notice without a dead-end action when a category is empty', () => {
  assert.deepEqual(getCategoryEmptyNotice(), {
    title: '상품이 없습니다.',
    description: '해당 카테고리에 준비된 상품이 없습니다.',
  });
});
