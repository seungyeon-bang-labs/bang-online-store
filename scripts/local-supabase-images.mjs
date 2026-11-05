// 운영 Storage의 공개 상품·카테고리 이미지를 로컬 Supabase Storage로 복사한다.
// 로컬 주소가 아니면 바로 멈춘다. 운영에서는 공개 URL로 읽기만 한다.
import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const PROD_PUBLIC = 'https://plamqblmcavrtioajopz.supabase.co/storage/v1/object/public';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

const status = Object.fromEntries(
  execFileSync('npx', ['supabase', 'status', '-o', 'env'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    .split('\n')
    .map(line => line.match(/^([A-Z_]+)="?(.*?)"?$/))
    .filter(Boolean)
    .map(([, key, value]) => [key, value]),
);
const apiUrl = status.API_URL;
const serviceKey = status.SERVICE_ROLE_KEY;
if (!apiUrl || !serviceKey) {
  console.error('로컬 Supabase 정보를 읽지 못했습니다. npx supabase start를 먼저 실행하세요.');
  process.exit(1);
}
if (!LOCAL_HOSTS.has(new URL(apiUrl).hostname)) {
  console.error(`로컬 Supabase가 아닙니다: ${apiUrl}`);
  process.exit(1);
}

const local = createClient(apiUrl, serviceKey, { auth: { persistSession: false } });

async function paths(table, bucket) {
  const { data, error } = await local.from(table).select('image_path').not('image_path', 'is', null);
  if (error) throw new Error(`${table} 조회 실패: ${error.message}`);
  return [...new Set(data.map(row => row.image_path))].map(path => ({ bucket, path }));
}

const targets = [...await paths('product_images', 'product-images'), ...await paths('categories', 'category-images')];
let uploaded = 0;
let skipped = 0;
const failed = [];

for (const { bucket, path } of targets) {
  const name = `${bucket}/${path}`;
  try {
    const existing = await fetch(`${apiUrl}/storage/v1/object/public/${name}`, { method: 'HEAD' });
    if (existing.ok) {
      skipped++;
      continue;
    }
    const source = await fetch(`${PROD_PUBLIC}/${name}`);
    if (!source.ok) throw new Error(`운영 응답 ${source.status}`);
    const body = Buffer.from(await source.arrayBuffer());
    const { error } = await local.storage.from(bucket).upload(path, body, {
      contentType: source.headers.get('content-type') ?? 'image/png',
    });
    if (error) throw new Error(error.message);
    uploaded++;
  } catch (error) {
    failed.push(`${name}: ${error.message}`);
  }
}

for (const line of failed) console.error(`실패 ${line}`);
console.log(`올림 ${uploaded}, 건너뜀 ${skipped}, 실패 ${failed.length}`);
if (failed.length) process.exit(1);
