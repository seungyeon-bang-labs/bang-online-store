import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, writeFile, rm, symlink, truncate } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { buildCatalogSeed } from '../scripts/catalog-seed.mjs';
import { runCatalogMigration, main, CATALOG_PROJECT_URL } from '../scripts/migrate-catalog.mjs';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function tinySeed() {
  const files = [
    { bucket: 'category-images', path: 'categories/coat.png' },
    { bucket: 'product-images', path: 'products/1/thumbnail.png' },
  ].map(file => ({ ...file, bytes: Buffer.from(png), sha256: hash(png) }));
  return { files, tables: {
    categories: [
      { id: 'outer', name: 'OUTER', slug: 'outer', parent_id: null, image_path: null, alt_text: null, display_order: 0 },
      { id: 'coat', name: '코트', slug: 'coat', parent_id: 'outer', image_path: files[0].path, alt_text: '코트', display_order: 0 },
    ],
    colors: [{ id: 1, code: 'GRAY', label: '그레이', hex_code: '#888888' }],
    product_styles: [{ id: 1, category_id: 'coat', name: '코트', created_at: '2026-04-20T00:00:00.000Z' }],
    products: [{ id: 1, style_id: 1, color_id: 1, display_name: null, price: 10000, state: 'active', created_at: '2026-04-20T00:00:00.000Z', restocked_at: null }],
    product_variants: [{ id: 1, product_id: 1, sku: '1-GY-M', size: 'M', stock: 2, price_offset: 0 }],
    product_images: [{ id: 1, product_id: 1, image_path: files[1].path, image_type: 'thumbnail', display_order: 1 }],
  } };
}

// Run the real SDK; replace its HTTP boundary only. Unexpected requests never reach a network.
function server(seed = tinySeed(), { populated = false, cap = 1000 } = {}) {
  const rows = Object.fromEntries(Object.entries(seed.tables).map(([table, data]) => [table,
    populated ? data.map(row => ({ ...row, updated_at: '2030-01-01T00:00:00Z' })) : [],
  ]));
  const objects = new Map(populated ? seed.files.map(file => [`${file.bucket}/${file.path}`, Buffer.from(file.bytes)]) : []);
  const requests = [];
  const failures = { table: null, upload: null, info: null, afterInsert: false, bucket: false };
  const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
    status, headers: { 'content-type': 'application/json', ...headers },
  });
  const fetch = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = init.method ?? 'GET';
    requests.push({ method, path: url.pathname });
    assert.equal(url.origin, CATALOG_PROJECT_URL);
    if (url.pathname.startsWith('/rest/v1/')) {
      const table = url.pathname.split('/').at(-1);
      assert.ok(Object.hasOwn(rows, table), table);
      if (method === 'GET') {
        const offset = Number(url.searchParams.get('offset') ?? 0);
        const limit = Math.min(cap, Number(url.searchParams.get('limit') ?? 1000));
        const data = rows[table].slice(offset, offset + limit);
        return json(data, 200, { 'content-range': `${offset}-${offset + data.length - 1}/${rows[table].length}` });
      }
      assert.equal(method, 'POST', 'Migration must never update or delete rows');
      const data = JSON.parse(init.body);
      const batch = Array.isArray(data) ? data : [data];
      const failing = failures.table === table;
      if (!failing || failures.afterInsert) {
        assert.ok(batch.every(row => !rows[table].some(old => old.id === row.id)), 'Duplicate insertion');
        rows[table].push(...structuredClone(batch));
      }
      if (failing) {
        failures.table = null;
        return json({ code: 'XX000', message: 'PRIVATE_SERVER_DIAGNOSTIC_SECRET' }, 500);
      }
      return new Response(null, { status: 201 });
    }
    if (url.pathname.startsWith('/storage/v1/bucket/')) {
      if (failures.bucket) return json({ code: 'AccessDenied', message: 'PRIVATE_SERVER_DIAGNOSTIC_SECRET' }, 403);
      const id = url.pathname.split('/').at(-1);
      return json({ id, name: id, public: true, file_size_limit: 5242880, allowed_mime_types: ['image/png'] });
    }
    const info = url.pathname.startsWith('/storage/v1/object/info/');
    const key = decodeURIComponent(url.pathname.replace(info ? '/storage/v1/object/info/' : '/storage/v1/object/', ''));
    assert.ok(url.pathname.startsWith('/storage/v1/object/'), url.pathname);
    if (info) {
      if (failures.info) return json({ code: 'AccessDenied', message: 'PRIVATE_SERVER_DIAGNOSTIC_SECRET' }, 403);
      return objects.has(key) ? json({ id: key, name: key }) : json({ code: 'NoSuchKey', message: 'Object not found' }, 404);
    }
    if (method === 'GET') {
      assert.ok(objects.has(key), 'Only existing files should be downloaded');
      return new Response(objects.get(key), { headers: { 'content-type': 'image/png' } });
    }
    assert.equal(method, 'POST', 'Migration must never overwrite or delete objects');
    assert.equal(new Headers(init.headers).get('x-upsert'), 'false');
    assert.ok(!objects.has(key), 'Existing object must be skipped');
    if (failures.upload === key) {
      failures.upload = null;
      return json({ code: 'InternalError', message: 'PRIVATE_SERVER_DIAGNOSTIC_SECRET' }, 500);
    }
    objects.set(key, Buffer.from(await new Response(init.body).arrayBuffer()));
    return json({ Id: key, Key: key });
  };
  const client = createClient(CATALOG_PROJECT_URL, 'sb_secret_local_test_only', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch },
  });
  return { client, rows, objects, requests, failures, writes: () => requests.filter(request => request.method !== 'GET') };
}

test('real seed preserves fixed IDs/SKUs, per-parent category order and 43 PNG files', async () => {
  const seed = await buildCatalogSeed();
  assert.deepEqual(Object.fromEntries(Object.entries(seed.tables).map(([table, rows]) => [table, rows.length])), {
    categories: 17, colors: 19, product_styles: 25, products: 27, product_variants: 135, product_images: 30,
  });
  assert.equal(seed.files.length, 43);
  assert.equal(new Set(seed.files.map(file => `${file.bucket}/${file.path}`)).size, 43);
  assert.equal(seed.tables.product_variants.find(row => row.id === 17).sku, '2-CM-M');
  assert.equal(seed.tables.colors.find(row => row.id === 1).label, '그레이');
  assert.equal(Object.hasOwn(seed.tables.colors[0], 'name'), false);
  assert.deepEqual(seed.tables.categories.filter(row => row.parent_id === 'outer').map(row => row.display_order), [0, 1, 2, 3]);
  assert.equal(seed.tables.product_images[1].image_path, 'products/1/detail-2.png');
  assert.equal(Object.hasOwn(seed.tables.product_styles[0], 'updated_at'), false);
  for (const file of seed.files) {
    assert.equal(file.sha256, hash(file.bytes));
    assert.ok(file.bytes.length <= 5242880);
    assert.ok(file.sourcePath.includes('/public/images/'));
  }
});

test('seed rejects missing/non-PNG/oversized files and symlinks escaping the public root', async t => {
  const root = await mkdtemp(join(tmpdir(), 'bang-catalog-seed-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const publicRoot = join(root, 'public');
  await mkdir(join(publicRoot, 'images/categories'), { recursive: true });
  const first = join(publicRoot, 'images/categories/coat.png');
  await assert.rejects(buildCatalogSeed({ publicRoot }), /이미지|image/i);
  await writeFile(first, 'not a PNG');
  await assert.rejects(buildCatalogSeed({ publicRoot }), /PNG/);
  await truncate(first, 5242881);
  await assert.rejects(buildCatalogSeed({ publicRoot }), /5 MiB|크기/);
  await rm(first);
  await writeFile(join(root, 'outside.png'), png);
  await symlink(join(root, 'outside.png'), first);
  await assert.rejects(buildCatalogSeed({ publicRoot }), /public|범위/);
});

test('check mode reads only and reports missing rows/files', async () => {
  const seed = tinySeed();
  const api = server(seed);
  const result = await runCatalogMigration({ mode: 'check', client: api.client, seed });
  assert.equal(result.mode, 'check');
  assert.equal(result.missingFiles, 2);
  assert.equal(result.missingRows.categories, 2);
  assert.equal(api.writes().length, 0);
});

test('apply uploads first, inserts parents first, verifies results and is idempotent', async () => {
  const seed = tinySeed();
  const api = server(seed);
  await runCatalogMigration({ mode: 'apply', client: api.client, seed });
  assert.equal(api.objects.size, 2);
  for (const [table, rows] of Object.entries(seed.tables)) assert.deepEqual(api.rows[table], rows);
  const writes = api.writes();
  assert.ok(writes.slice(0, 2).every(request => request.path.startsWith('/storage/')));
  assert.deepEqual([...new Set(writes.slice(2).map(request => request.path.split('/').at(-1)))], Object.keys(seed.tables));
  api.requests.length = 0;
  await runCatalogMigration({ mode: 'apply', client: api.client, seed });
  assert.equal(api.writes().length, 0);
});

test('comparison normalizes timestamp instants and ignores DB-managed updated_at and unrelated rows', async () => {
  const seed = tinySeed();
  const api = server(seed, { populated: true, cap: 1 });
  api.rows.products[0].created_at = '2026-04-20T09:00:00+09:00';
  api.rows.colors.push({ id: 99, code: 'RED', label: '빨강', hex_code: '#ff0000' });
  await runCatalogMigration({ mode: 'apply', client: api.client, seed });
  assert.equal(api.writes().length, 0);
  assert.equal(api.rows.colors.length, 2);
});

test('different rows, creation times, same SKU on another ID or unique-key conflicts abort before any write', async () => {
  const seed = tinySeed();
  for (const mutate of [
    api => { api.rows.products[0].price++; },
    api => { api.rows.products[0].created_at = '2020-01-01T00:00:00Z'; },
    api => { api.rows.product_variants[0].id = 99; },
    api => { api.rows.colors[0].id = 99; },
  ]) {
    const api = server(seed, { populated: true });
    mutate(api);
    api.objects.clear();
    await assert.rejects(runCatalogMigration({ mode: 'apply', client: api.client, seed }), /충돌|다릅니다/);
    assert.equal(api.writes().length, 0);
  }
});

test('different bytes at the same Storage path abort before all uploads and inserts', async () => {
  const seed = tinySeed();
  const api = server(seed);
  api.objects.set('product-images/products/1/thumbnail.png', Buffer.concat([png, Buffer.from('different')]));
  await assert.rejects(runCatalogMigration({ mode: 'apply', client: api.client, seed }), /충돌|다릅니다/);
  assert.equal(api.writes().length, 0);
});

test('bucket/info authorization failures abort instead of being treated as a missing file; diagnostics stay private', async () => {
  for (const boundary of ['bucket', 'info']) {
    const seed = tinySeed();
    const api = server(seed);
    api.failures[boundary] = true;
    await assert.rejects(runCatalogMigration({ mode: 'apply', client: api.client, seed }), error => {
      assert.equal(error.message.includes('PRIVATE_SERVER_DIAGNOSTIC_SECRET'), false);
      return true;
    });
    assert.equal(api.writes().length, 0);
  }
});

test('partially uploaded images are retained and a retry uploads only missing images', async () => {
  const seed = tinySeed();
  const api = server(seed);
  api.failures.upload = 'product-images/products/1/thumbnail.png';
  await assert.rejects(runCatalogMigration({ mode: 'apply', client: api.client, seed }), /product-images\/products\/1\/thumbnail.png/);
  assert.equal(api.objects.size, 1);
  assert.equal(api.rows.categories.length, 0);
  api.requests.length = 0;
  await runCatalogMigration({ mode: 'apply', client: api.client, seed });
  assert.equal(api.writes().filter(request => request.path.startsWith('/storage/')).length, 1);
  assert.equal(api.objects.size, 2);
});

test('partial and uncertain DB insert failures preserve progress and retries never insert duplicates', async () => {
  for (const afterInsert of [false, true]) {
    const seed = tinySeed();
    const api = server(seed);
    api.failures.table = 'product_variants';
    api.failures.afterInsert = afterInsert;
    await assert.rejects(runCatalogMigration({ mode: 'apply', client: api.client, seed }), error => {
      assert.match(error.message, /product_variants/);
      assert.equal(error.message.includes('PRIVATE_SERVER_DIAGNOSTIC_SECRET'), false);
      return true;
    });
    assert.equal(api.objects.size, 2);
    assert.equal(api.rows.products.length, 1);
    await runCatalogMigration({ mode: 'apply', client: api.client, seed });
    for (const [table, rows] of Object.entries(seed.tables)) assert.equal(api.rows[table].length, rows.length);
  }
});

test('invalid mode, wrong project and bad seed relations fail before any request', async () => {
  const seed = tinySeed();
  const api = server(seed);
  await assert.rejects(runCatalogMigration({ mode: 'anything', client: api.client, seed }), /모드/);
  await assert.rejects(runCatalogMigration({ mode: 'apply', client: { supabaseUrl: 'https://other.supabase.co' }, seed }), /프로젝트/);
  seed.tables.product_variants[0].product_id = 99;
  await assert.rejects(runCatalogMigration({ mode: 'apply', client: api.client, seed }), /참조|상품/);
  assert.equal(api.requests.length, 0);
});

test('CLI import is inert and help works without configuration', async () => {
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', "await import('./scripts/migrate-catalog.mjs')"], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '');
  const logs = [];
  await main({ args: ['--help'], log: text => logs.push(text) });
  assert.match(logs.join('\n'), /--check/);
});

test('CLI defaults to check, pins the project, rejects public keys and never logs the secret', async t => {
  const folder = await mkdtemp(join(tmpdir(), 'bang-catalog-cli-'));
  t.after(() => rm(folder, { recursive: true, force: true }));
  const envFile = join(folder, '.env.catalog-migration.local');
  const secret = 'sb_secret_LOCAL_TEST_ONLY_DO_NOT_LOG';
  const api = server();
  const logs = [];
  await writeFile(envFile, `SUPABASE_URL=${CATALOG_PROJECT_URL}\nCATALOG_MIGRATION_SECRET_KEY=${secret}\n`);
  const result = await main({ args: [], envFile, log: value => logs.push(value), createClientImpl: () => api.client });
  assert.equal(result.mode, 'check');
  assert.equal(api.writes().length, 0);
  assert.ok(logs.join('\n').includes('plamqblmcavrtioajopz'));
  assert.equal(logs.join('\n').includes(secret), false);
  let created = false;
  const noClient = () => { created = true; throw Error('must not create client'); };
  for (const [url, key] of [['https://other.supabase.co', secret], [CATALOG_PROJECT_URL, 'sb_publishable_PUBLIC_TEST']]) {
    await writeFile(envFile, `SUPABASE_URL=${url}\nCATALOG_MIGRATION_SECRET_KEY=${key}\n`);
    await assert.rejects(main({ args: ['--apply'], envFile, createClientImpl: noClient }), /프로젝트|관리자|키/);
  }
  assert.equal(created, false);
});
