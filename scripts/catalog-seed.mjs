import { createHash } from 'node:crypto';
import { readFile, realpath, stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATEGORY_FIXTURE } from '../src/domains/category/fixture.ts';
import {
  PRODUCT_COLOR_FIXTURE, PRODUCT_STYLE_FIXTURE, PRODUCT_FIXTURE,
  PRODUCT_VARIANT_FIXTURE, PRODUCT_IMAGE_FIXTURE,
} from '../src/domains/product/fixture.ts';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
export const CATALOG_COLUMNS = {
  categories: ['id', 'name', 'slug', 'parent_id', 'image_path', 'alt_text', 'display_order', 'created_at'],
  colors: ['id', 'code', 'label', 'hex_code'],
  product_styles: ['id', 'category_id', 'name', 'created_at'],
  products: ['id', 'style_id', 'color_id', 'display_name', 'price', 'state', 'created_at', 'restocked_at'],
  product_variants: ['id', 'product_id', 'sku', 'size', 'stock', 'price_offset', 'created_at'],
  product_images: ['id', 'product_id', 'image_path', 'image_type', 'display_order', 'created_at'],
};
export const CATALOG_UNIQUE_KEYS = {
  categories: [['parent_id', 'slug']], colors: [['code']], product_styles: [],
  products: [['style_id', 'color_id']], product_variants: [['sku'], ['product_id', 'size']],
  product_images: [['product_id', 'display_order']],
};
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

const fail = message => { throw new Error(message); };
const keyFor = (row, columns) => JSON.stringify(columns.map(column => row[column]));
export function catalogUniqueKeys(table, row) {
  const keys = CATALOG_UNIQUE_KEYS[table].map(columns => keyFor(row, columns));
  if (table === 'product_images' && row.image_type === 'thumbnail') keys.push(`thumbnail:${row.product_id}`);
  return keys;
}

export function validateCatalogSeed(seed) {
  if (!seed?.tables || !Array.isArray(seed.files)
    || Object.keys(seed.tables).length !== Object.keys(CATALOG_COLUMNS).length) fail('카탈로그 입력 구조가 올바르지 않습니다.');
  const ids = {};
  for (const [table, columns] of Object.entries(CATALOG_COLUMNS)) {
    const rows = seed.tables[table];
    if (!Array.isArray(rows)) fail(`카탈로그 테이블이 없습니다: ${table}`);
    ids[table] = new Set();
    const unique = new Set();
    for (const row of rows) {
      const validId = table === 'categories' ? typeof row.id === 'string' && /^[a-z0-9-]+$/.test(row.id)
        : Number.isSafeInteger(row.id) && row.id > 0;
      if (!validId || ids[table].has(row.id)) fail(`중복되거나 잘못된 ID: ${table}/${row.id}`);
      if (Object.keys(row).some(column => !columns.includes(column))) fail(`등록 대상이 아닌 필드: ${table}/${row.id}`);
      ids[table].add(row.id);
      for (const key of catalogUniqueKeys(table, row)) {
        if (unique.has(key)) fail(`고유 값 충돌: ${table}/${row.id}`);
        unique.add(key);
      }
      for (const field of ['price', 'stock', 'price_offset', 'display_order']) {
        if (field in row && (!Number.isInteger(row[field]) || row[field] < 0 || row[field] > 2147483647)) fail(`잘못된 금액·수량·순서: ${table}/${row.id}`);
      }
      for (const [field, value] of Object.entries(row)) {
        if (field.endsWith('_at') && value !== null && !Number.isFinite(Date.parse(value))) fail(`잘못된 시각: ${table}/${row.id}`);
      }
    }
  }
  const requireReference = (target, id) => {
    if (!ids[target].has(id)) fail(`존재하지 않는 카탈로그 참조: ${target}/${id}`);
  };
  const expectedFiles = new Set();
  for (const category of seed.tables.categories) {
    if (category.parent_id !== null) requireReference('categories', category.parent_id);
    if (category.image_path !== null) {
      if (category.image_path !== `categories/${category.id}.png`) fail('카테고리 이미지 경로가 올바르지 않습니다.');
      expectedFiles.add(`category-images/${category.image_path}`);
    }
  }
  for (const style of seed.tables.product_styles) requireReference('categories', style.category_id);
  for (const product of seed.tables.products) {
    requireReference('product_styles', product.style_id);
    requireReference('colors', product.color_id);
    if (!['active', 'inactive'].includes(product.state)) fail(`잘못된 상품 상태: ${product.id}`);
  }
  for (const variant of seed.tables.product_variants) {
    requireReference('products', variant.product_id);
    if (!variant.sku || !['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'].includes(variant.size)) fail(`잘못된 상품 옵션: ${variant.id}`);
  }
  for (const image of seed.tables.product_images) {
    requireReference('products', image.product_id);
    if (!['thumbnail', 'detail'].includes(image.image_type)) fail(`잘못된 이미지 종류: ${image.id}`);
    const file = image.image_type === 'thumbnail' ? 'thumbnail' : `detail-${image.display_order}`;
    if (image.image_path !== `products/${image.product_id}/${file}.png`) fail('상품 이미지 경로가 올바르지 않습니다.');
    expectedFiles.add(`product-images/${image.image_path}`);
  }
  const actualFiles = new Set();
  for (const file of seed.files) {
    const key = `${file.bucket}/${file.path}`;
    if (!expectedFiles.has(key) || actualFiles.has(key)) fail(`중복되거나 잘못된 이미지 경로: ${key}`);
    if (!Buffer.isBuffer(file.bytes) || file.bytes.length > MAX_IMAGE_BYTES
      || !file.bytes.subarray(0, 8).equals(PNG_SIGNATURE) || sha256(file.bytes) !== file.sha256) fail(`PNG 내용·크기·해시가 올바르지 않습니다: ${key}`);
    actualFiles.add(key);
  }
  if (expectedFiles.size !== actualFiles.size) fail('카탈로그 이미지 파일이 누락되었습니다.');
}

async function readImage(publicRoot, source, bucket, path) {
  const input = source.startsWith('/images/') ? source.slice(1) : `images/${source}`;
  const candidate = resolve(publicRoot, input);
  const inside = value => {
    const part = relative(publicRoot, value);
    return part !== '' && !isAbsolute(part) && part !== '..' && !part.startsWith(`..${sep}`);
  };
  if (!inside(candidate) || source.includes('\\') || source.includes('://')) fail(`이미지가 public 범위를 벗어났습니다: ${source}`);
  let sourcePath, details;
  try {
    sourcePath = await realpath(candidate);
    if (!inside(sourcePath)) fail(`이미지가 public 범위를 벗어났습니다: ${source}`);
    details = await stat(sourcePath);
  } catch (error) {
    if (error.message.includes('public 범위')) throw error;
    fail(`이미지 파일을 확인하지 못했습니다: ${source}`);
  }
  if (!details.isFile()) fail(`이미지 파일이 아닙니다: ${source}`);
  if (details.size > MAX_IMAGE_BYTES) fail(`이미지 크기가 5 MiB를 초과합니다: ${source}`);
  const bytes = await readFile(sourcePath);
  if (!bytes.subarray(0, 8).equals(PNG_SIGNATURE)) fail(`PNG 파일 서명이 올바르지 않습니다: ${source}`);
  return { bucket, path, sourcePath, bytes, sha256: sha256(bytes) };
}

export async function buildCatalogSeed({ publicRoot = fileURLToPath(new URL('../public/', import.meta.url)) } = {}) {
  const root = await realpath(publicRoot);
  const orderByParent = new Map();
  const categories = CATEGORY_FIXTURE.map(category => {
    const display_order = orderByParent.get(category.parent_id) ?? 0;
    orderByParent.set(category.parent_id, display_order + 1);
    return {
      id: category.id, name: category.name, slug: category.slug, parent_id: category.parent_id,
      image_path: category.image_url ? `categories/${category.id}.png` : null, alt_text: category.alt_text, display_order
    };
  });
  // Keep sibling order while placing every parent before its children.
  const orderedCategories = [];
  const seen = new Set();
  let remaining = categories;
  while (remaining.length) {
    const ready = remaining.filter(row => row.parent_id === null || seen.has(row.parent_id));
    if (!ready.length) fail('카테고리 부모 참조가 누락되었거나 순환합니다.');
    orderedCategories.push(...ready);
    ready.forEach(row => seen.add(row.id));
    remaining = remaining.filter(row => !seen.has(row.id));
  }
  const tables = {
    categories: orderedCategories,
    colors: PRODUCT_COLOR_FIXTURE.map(row => ({ id: row.id, code: row.code, label: row.name, hex_code: row.hex_code })),
    product_styles: PRODUCT_STYLE_FIXTURE.map(row => ({ id: row.id, category_id: row.category_id, name: row.name, created_at: row.created_at })),
    products: PRODUCT_FIXTURE.map(row => ({ ...row })),
    product_variants: PRODUCT_VARIANT_FIXTURE.map(row => ({ ...row })),
    product_images: PRODUCT_IMAGE_FIXTURE.map(row => ({
      id: row.id, product_id: row.product_id,
      image_path: `products/${row.product_id}/${row.image_type === 'thumbnail' ? 'thumbnail' : `detail-${row.display_order}`}.png`,
      image_type: row.image_type, display_order: row.display_order
    })),
  };
  const files = [];
  for (const category of CATEGORY_FIXTURE) {
    if (category.image_url) files.push(await readImage(root, category.image_url, 'category-images', `categories/${category.id}.png`));
  }
  for (const image of PRODUCT_IMAGE_FIXTURE) {
    files.push(await readImage(root, image.image_url, 'product-images', tables.product_images.find(row => row.id === image.id).image_path));
  }
  const seed = { tables, files };
  validateCatalogSeed(seed);
  return seed;
}
