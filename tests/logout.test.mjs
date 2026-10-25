import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTs as baseLoadTs } from './helpers/load-ts.mjs';
const loadTs = (file, mocks = {}) => baseLoadTs(file, { '@/features/cart/use-cart': { useCartCommands: () => ({ recheck: async () => {}, beginAuthTransition() {} }) }, ...mocks });

function storefront(access) {
  return loadTs('src/app/(storefront)/layout.tsx', {
    '@/domains/terms': {},
    '@/domains/auth/member-access.server': { getCurrentMemberAccess: async () => access },
    '@/domains/category': {
      categoryRepository: { findMany: async () => [] },
      createCategoryGroups: values => values,
      toCategoryGroupViewModels: values => values,
    },
  }).default({ children: 'SHOP', search: null, category: null });
}

test('public storefront renders guest navigation without requiring an active member', async () => {
  for (const status of ['unauthenticated', 'unverified', 'missing', 'unavailable']) {
    const layout = await storefront({ status, email: 'visitor@example.com' });
    assert.equal(layout.props.isLoggedIn, false);
    assert.equal(layout.props.headerContent.props.isLoggedIn, false);
    assert.equal(layout.props.headerContent.props.logoutControl, null);
  }
});
test('active storefront supplies the authenticated navigation and logout control', async () => {
  const layout = await storefront({ status: 'active', member: { id: 'member-1' } });
  assert.equal(layout.props.isLoggedIn, true);
  assert.equal(layout.props.headerContent.props.isLoggedIn, true);
  assert.ok(layout.props.headerContent.props.logoutControl);
});
test('an access lookup failure does not masquerade as a guest storefront', async () => {
  await assert.rejects(storefront({ status: 'error' }), /회원 정보를 확인하지 못했습니다/);
});

function renderLogout({ state = null, pending = false } = {}) {
  const action = async () => null;
  const { LogoutButton } = loadTs('src/features/auth/logout-button.tsx', {
    react: {
      ...React,
      useActionState: passedAction => {
        assert.equal(passedAction, action);
        return [state, undefined, pending];
      },
    },
  });
  return renderToStaticMarkup(React.createElement(LogoutButton, { logoutAction: action }));
}

test('logout uses a submit button rather than a navigable logout URL', () => {
  const html = renderLogout();
  assert.match(html, /type="submit"/);
  assert.match(html, /로그아웃/);
  assert.doesNotMatch(html, /href="\/logout"/);
  assert.doesNotMatch(html, /disabled=""/);
});
test('pending logout disables resubmission and announces progress', () => {
  const html = renderLogout({ pending: true });
  assert.match(html, /disabled=""/);
  assert.match(html, /로그아웃 중…/);
});
test('logout failures remain visible and allow another submission', () => {
  const html = renderLogout({ state: { message: '다시 시도해주세요.' } });
  assert.match(html, /role="alert"/);
  assert.match(html, /다시 시도해주세요/);
  assert.doesNotMatch(html, /disabled=""/);
});
