import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTs } from './helpers/load-ts.mjs';

const termId = '11111111-1111-4111-8111-111111111111';
const term = {
  id: termId, term_code_id: '22222222-2222-4222-8222-222222222222',
  title: '이용약관', content: '첫 번째 조항\n두 번째 조항', version: '1.0',
  is_active: true, is_required: true, effective_at: '2026-01-01T00:00:00Z',
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
  term_codes: { code: 'service', title: '이용약관', kind: 'document', is_active: true },
};

function routeWithRepository(findEffectiveById) {
  return loadTs('src/app/api/terms/[termId]/route.ts', {
    './repository': { termRepository: { findEffectiveById } },
  }).GET;
}

const request = id => new Request(`http://localhost/api/terms/${id}`);
const context = id => ({ params: Promise.resolve({ termId: id }) });

test('term API returns the existing detail service view model and disables caching', async () => {
  const ids = [];
  const GET = routeWithRepository(async id => { ids.push(id); return term; });
  const response = await GET(request(termId), context(termId));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { term: {
    title: '이용약관', content: '첫 번째 조항\n두 번째 조항',
    version: '1.0', effectiveDateLabel: '2026. 1. 1.',
  } });
  assert.deepEqual(ids, [termId]);
});

test('invalid term IDs return 404 before a database read', async () => {
  let calls = 0;
  const GET = routeWithRepository(async () => { calls++; return term; });
  const response = await GET(request('invalid'), context('invalid'));
  assert.equal(response.status, 404);
  assert.equal(calls, 0);
});

for (const [name, row] of [
  ['missing or ineffective term', null],
  ['confirmation without a document', { ...term, term_codes: { ...term.term_codes, kind: 'confirmation' } }],
]) {
  test(`${name} returns a non-cacheable 404`, async () => {
    const GET = routeWithRepository(async () => row);
    const response = await GET(request(termId), context(termId));
    assert.equal(response.status, 404);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { message: '현재 확인할 수 없는 약관입니다.' });
  });
}

test('repository failure returns a generic 500 without leaking database diagnostics', async () => {
  const GET = routeWithRepository(async () => { throw new Error('PRIVATE_DATABASE_DIAGNOSTIC'); });
  const response = await GET(request(termId), context(termId));
  assert.equal(response.status, 500);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { message: '약관을 불러오지 못했습니다. 다시 시도해주세요.' });
});
