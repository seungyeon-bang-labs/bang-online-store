// Node.js 24.12+. Default is read-only --check. --apply requires separate approval.
// Use only ignored .env.catalog-migration.local with SUPABASE_URL and CATALOG_MIGRATION_SECRET_KEY.
// Never put this administrator key in app env files or Vercel. Do not run concurrent catalog edits/uploads.
// Storage and table inserts are separate operations; failures preserve progress for a later retry.
import { readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { buildCatalogSeed, CATALOG_COLUMNS, catalogUniqueKeys, MAX_IMAGE_BYTES, sha256, validateCatalogSeed } from './catalog-seed.mjs';

export const CATALOG_PROJECT_URL = 'https://plamqblmcavrtioajopz.supabase.co';
const PROJECT_REF = 'plamqblmcavrtioajopz';
const TABLES = Object.keys(CATALOG_COLUMNS);
const fail = message => { throw new Error(message); };

function checkProject(url) {
  if (typeof url !== 'string' || url.replace(/\/$/, '') !== CATALOG_PROJECT_URL) fail('승인된 Supabase 프로젝트 URL이 아닙니다.');
}
async function request(operation, context, { missingFile = false } = {}) {
  let result;
  try { result = await operation(); } catch { fail(`${context} 실패: 통신 상태를 확인하고 재실행해주세요.`); }
  if (result.error) {
    if (missingFile && result.error.code === 'NoSuchKey') return null;
    // Never print API messages/details: they can contain data or credentials.
    fail(`${context} 실패: 권한·대상 설정·통신 상태를 확인하고 재실행해주세요.`);
  }
  return result;
}
async function readRows(client, table) {
  const rows = [];
  let count;
  do {
    const result = await request(() => client.from(table).select(CATALOG_COLUMNS[table].join(','), { count: 'exact' })
      .order('id').range(rows.length, rows.length + 999), `조회: ${table}`);
    if (!Array.isArray(result.data) || !Number.isSafeInteger(result.count) || result.count < 0) fail(`조회 결과가 올바르지 않습니다: ${table}`);
    count = result.count;
    if (rows.length < count && result.data.length === 0) fail(`조회가 중간에 누락되었습니다: ${table}`);
    rows.push(...result.data);
  } while (rows.length < count);
  return rows;
}
function sameRow(expected, actual) {
  return Object.entries(expected).every(([field, value]) => {
    if (field.endsWith('_at') && value !== null) return Date.parse(value) === Date.parse(actual[field]);
    return value === actual[field];
  });
}
async function inspect(client, seed) {
  const missingRows = {};
  for (const table of TABLES) {
    const rows = await readRows(client, table);
    const byId = new Map(rows.map(row => [row.id, row]));
    const byUnique = new Map();
    for (const row of rows) for (const key of catalogUniqueKeys(table, row)) byUnique.set(key, row);
    missingRows[table] = [];
    for (const expected of seed.tables[table]) {
      const actual = byId.get(expected.id);
      if (actual && !sameRow(expected, actual)) fail(`기존 데이터와 다릅니다: ${table}/${expected.id}`);
      for (const key of catalogUniqueKeys(table, expected)) {
        const other = byUnique.get(key);
        if (other && other.id !== expected.id) fail(`다른 ID의 고유 값과 충돌합니다: ${table}/${expected.id}`);
      }
      if (!actual) missingRows[table].push(expected);
    }
  }
  for (const bucket of ['category-images', 'product-images']) {
    const { data } = await request(() => client.storage.getBucket(bucket), `버킷 확인: ${bucket}`);
    if (data?.id !== bucket || data.public !== true || Number(data.file_size_limit) !== MAX_IMAGE_BYTES
      || data.allowed_mime_types?.length !== 1 || data.allowed_mime_types[0] !== 'image/png') fail(`버킷 설정이 계획과 다릅니다: ${bucket}`);
  }
  const missingFiles = [];
  for (const file of seed.files) {
    const label = `${file.bucket}/${file.path}`;
    const storage = client.storage.from(file.bucket);
    const info = await request(() => storage.info(file.path), `이미지 확인: ${label}`, { missingFile: true });
    if (info === null) { missingFiles.push(file); continue; }
    const { data } = await request(() => storage.download(file.path), `이미지 비교: ${label}`);
    let bytes;
    try { bytes = Buffer.from(await data.arrayBuffer()); } catch { fail(`이미지 내용을 읽지 못했습니다: ${label}`); }
    if (sha256(bytes) !== file.sha256) fail(`같은 경로의 이미지 내용과 다릅니다: ${label}`);
  }
  return { missingRows, missingFiles };
}

export async function runCatalogMigration({ mode = 'check', client, seed }) {
  if (!['check', 'apply'].includes(mode)) fail('지원하지 않는 이전 모드입니다.');
  checkProject(client?.supabaseUrl);
  validateCatalogSeed(seed);
  // Complete comparison before the first write: never upsert, delete or auto-roll back progress.
  const pending = await inspect(client, seed);
  const report = { mode, missingRows: Object.fromEntries(TABLES.map(table => [table, pending.missingRows[table].length])),
    missingFiles: pending.missingFiles.length };
  if (mode === 'check') return report;
  for (const file of pending.missingFiles) {
    await request(() => client.storage.from(file.bucket).upload(file.path, file.bytes,
      { contentType: 'image/png', upsert: false }), `이미지 등록: ${file.bucket}/${file.path}`);
  }
  for (const table of TABLES) {
    if (pending.missingRows[table].length) {
      await request(() => client.from(table).insert(pending.missingRows[table]), `행 등록: ${table}`);
    }
  }
  const remaining = await inspect(client, seed);
  if (remaining.missingFiles.length || TABLES.some(table => remaining.missingRows[table].length)) fail('이전 결과에 누락이 있습니다. 검사 후 재실행해주세요.');
  return { ...report, verifiedRows: Object.fromEntries(TABLES.map(table => [table, seed.tables[table].length])), verifiedFiles: seed.files.length };
}

function checkAdminKey(key) {
  if (typeof key === 'string' && /^sb_secret_[A-Za-z0-9_-]+$/.test(key)) return;
  try {
    const parts = key.split('.');
    const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    // This is a configuration check, not JWT authentication; the server verifies the key.
    if (parts.length === 3 && claims.role === 'service_role' && claims.ref === PROJECT_REF) return;
  } catch { /* Reject missing, public, or unrelated credentials without printing their value. */ }
  fail('실행 전용 Supabase 관리자 키가 필요합니다.');
}

export async function main({ args = process.argv.slice(2),
  envFile = fileURLToPath(new URL('../.env.catalog-migration.local', import.meta.url)),
  log = console.log, createClientImpl = createClient } = {}) {
  if (args.length === 1 && args[0] === '--help') {
    log('node scripts/migrate-catalog.mjs [--check | --apply]\n기본값: --check (읽기 전용)\n설정: .env.catalog-migration.local의 SUPABASE_URL, CATALOG_MIGRATION_SECRET_KEY');
    return;
  }
  if (args.length > 1 || (args.length && !['--check', '--apply'].includes(args[0]))) fail('--check 또는 --apply 중 하나만 지정해주세요.');
  const mode = args[0] === '--apply' ? 'apply' : 'check';
  let config;
  try { config = parseEnv(await readFile(envFile, 'utf8')); } catch { fail('실행 전용 .env.catalog-migration.local 파일을 확인해주세요.'); }
  checkProject(config.SUPABASE_URL);
  checkAdminKey(config.CATALOG_MIGRATION_SECRET_KEY);
  log(`대상 프로젝트: ${PROJECT_REF} / 모드: ${mode === 'check' ? '검사 (읽기 전용)' : '적용'}`);
  const seed = await buildCatalogSeed();
  log(`로컬 검증: ${JSON.stringify(Object.fromEntries(TABLES.map(table => [table, seed.tables[table].length])))} / 이미지 ${seed.files.length}개`);
  const client = createClientImpl(config.SUPABASE_URL, config.CATALOG_MIGRATION_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const result = await runCatalogMigration({ mode, client, seed });
  log(JSON.stringify(result));
  return result;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
