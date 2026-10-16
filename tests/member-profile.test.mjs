import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { createClient } from '@supabase/supabase-js';
import { loadTs } from './helpers/load-ts.mjs';

const alice = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Alice Member', email: 'alice@example.invalid',
  phone_number: '01012345678', email_verified_at: '2026-10-14T00:00:00Z',
  status: 'active', deleted_at: null,
};
const bob = {
  ...alice, id: '22222222-2222-4222-8222-222222222222',
  name: 'Bob Member', email: 'bob@example.invalid', phone_number: '01098765432',
};

// Keep the real Supabase query builder; replace only its HTTP boundary.
function profileClient(rows, { error = false } = {}) {
  const requests = [];
  const client = createClient('https://profile-test.supabase.co', 'test-anon-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input, options) => {
      const url = new URL(String(input));
      requests.push(url);
      assert.equal(options.method, 'GET');
      assert.equal(url.pathname, '/rest/v1/users');
      if (error) {
        return new Response(JSON.stringify({ code: '42501', message: 'PRIVATE_DB_DETAIL' }), {
          status: 403, headers: { 'content-type': 'application/json' },
        });
      }
      const selected = (url.searchParams.get('select') ?? '').split(',').map(s => s.trim());
      const result = rows.filter(row =>
        url.searchParams.get('id') === `eq.${row.id}` &&
        (url.searchParams.get('status') !== 'eq.active' || row.status === 'active') &&
        (url.searchParams.get('deleted_at') !== 'is.null' || row.deleted_at === null),
      ).map(row => Object.fromEntries(selected.map(key => [key, row[key]])));
      return new Response(JSON.stringify(result), {
        status: 200, headers: { 'content-type': 'application/json' },
      });
    } },
  });
  return { client, requests };
}

test('profile repository queries only the requested active, undeleted member and profile fields', async () => {
  const { createMemberProfileRepository } = loadTs('src/domains/member/supabase-repository.server.ts');
  assert.equal(typeof createMemberProfileRepository, 'function');
  const { client, requests } = profileClient([alice, bob]);
  const repository = createMemberProfileRepository(client);
  for (const member of [alice, bob]) {
    const result = await repository.findById(member.id);
    assert.equal(result.id, member.id);
    assert.equal(result.email, member.email);
  }
  assert.equal(requests.length, 2);
  for (const url of requests) {
    assert.equal(url.searchParams.get('status'), 'eq.active');
    assert.equal(url.searchParams.get('deleted_at'), 'is.null');
    assert.deepEqual(url.searchParams.get('select').split(',').map(s => s.trim()).sort(),
      ['email', 'email_verified_at', 'id', 'name', 'phone_number']);
  }
});

test('missing, suspended and deleted profiles return no member', async () => {
  const { createMemberProfileRepository } = loadTs('src/domains/member/supabase-repository.server.ts');
  assert.equal(typeof createMemberProfileRepository, 'function');
  for (const rows of [[], [{ ...alice, status: 'suspended' }],
    [{ ...alice, status: 'deleted' }], [{ ...alice, deleted_at: '2026-10-14T00:00:00Z' }]]) {
    const { client } = profileClient(rows);
    assert.equal(await createMemberProfileRepository(client).findById(alice.id), null);
  }
});

test('a profile query failure throws a safe error rather than returning a missing member', async () => {
  const { createMemberProfileRepository } = loadTs('src/domains/member/supabase-repository.server.ts');
  assert.equal(typeof createMemberProfileRepository, 'function');
  const { client } = profileClient([], { error: true });
  await assert.rejects(createMemberProfileRepository(client).findById(alice.id), error => {
    assert.equal(error.message, '회원 정보를 불러오지 못했습니다.');
    assert.equal(error.cause.code, '42501');
    return true;
  });
});

test('profile mapping uses database identity and neutral defaults for unavailable birth and gender fields', () => {
  const { toMemberProfileViewModel } = loadTs('src/domains/member/mapper.ts');
  for (const email_verified_at of [null, '2026-10-14T00:00:00Z']) {
    const profile = toMemberProfileViewModel({
      id: alice.id, name: 'Alice Member', email: 'alice@example.invalid',
      phone_number: '01012345678', email_verified_at,
    });
    assert.deepEqual(profile, {
      name: 'Alice Member', email: 'alice@example.invalid', phoneNumber: '01012345678',
      isEmailVerified: email_verified_at !== null, birthDate: '', gender: 'unspecified',
    });
  }
});

function profilePage(member, { rows = [alice, bob], denied, error } = {}) {
  const { client, requests } = profileClient(rows, { error });
  let clientReads = 0;
  const { default: EditProfilePage } = loadTs('src/app/(mypage)/mypage/edit/page.tsx', {
    '@/app/(auth)/require-active-member': { requireActiveMember: async () => {
      if (denied) throw denied;
      return { id: member.id, status: 'active', deleted_at: null };
    } },
    '@/shared/lib/supabase/auth-server': { createAuthClient: async () => {
      clientReads++;
      return client;
    } },
  });
  return { EditProfilePage, requests, clientReads: () => clientReads };
}

function profileForm(element) {
  if (!element || typeof element !== 'object') return null;
  if (element.type?.name === 'MypageProfileForm') return element;
  for (const child of [element.props?.children].flat(Infinity)) {
    const found = profileForm(child);
    if (found) return found;
  }
  return null;
}

test('profile page shows each session member in a read-only form and resets local form state on account switch', async () => {
  for (const member of [alice, bob]) {
    const s = profilePage(member);
    const element = await s.EditProfilePage();
    const html = renderToStaticMarkup(element);
    assert.ok(html.includes(member.name), 'show the session member name');
    assert.ok(html.includes(member.email), 'show the session member email');
    assert.ok(!html.includes('gemini@example.com'), 'never substitute the fixture identity');
    assert.ok(/<fieldset\b[^>]*disabled=""/.test(html), 'profile controls must be disabled');
    assert.equal(s.requests.length, 1);
    assert.equal(s.requests[0].searchParams.get('id'), `eq.${member.id}`);
    const form = profileForm(element);
    assert.ok(form, 'render the existing profile form');
    assert.equal(form.key, member.id, 'remount the stateful form when the account changes');
    assert.equal(form.props.profile.phoneNumber, member.phone_number);
  }
});

test('denied member access stops profile client creation and data reads', async () => {
  const denied = new Error('REDIRECT:/login');
  const s = profilePage(alice, { denied });
  await assert.rejects(s.EditProfilePage(), error => error === denied);
  assert.equal(s.clientReads(), 0);
  assert.equal(s.requests.length, 0);
});

test('an absent member profile shows the existing empty state without a fixture fallback', async () => {
  const s = profilePage(alice, { rows: [] });
  const element = await s.EditProfilePage();
  const html = renderToStaticMarkup(element);
  assert.ok(html.includes('회원 정보를 확인할 수 없습니다.'));
  assert.equal(profileForm(element), null);
  assert.ok(!html.includes('gemini@example.com'));
});

test('profile page query errors reach the existing error boundary', async () => {
  const s = profilePage(alice, { error: true });
  await assert.rejects(s.EditProfilePage(), { message: '회원 정보를 불러오지 못했습니다.' });
});
