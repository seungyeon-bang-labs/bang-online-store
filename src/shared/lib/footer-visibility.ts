export type FooterVisibility = 'hidden' | 'desktop-only' | 'visible';

const HIDDEN_FOOTER_ROUTES = [
  /^\/mypage\/edit$/,
  /^\/mypage\/address\/(?:write|[^/]+\/edit)$/,
  /^\/mypage\/inquiries\/(?:write|[^/]+\/edit)$/,
  /^\/mypage\/reviews\/(?:write\/[^/]+|[^/]+\/edit)$/,
  /^\/mypage\/orders\/[^/]+\/(?:cancel|claim)\/[^/]+$/,
  /^\/mypage\/orders\/[^/]+\/receipt\/[^/]+$/,
  /^\/snapshot\/upload$/,
];

export function getFooterVisibility(segments: readonly string[]): FooterVisibility {
  const pathname = `/${segments.filter(segment => !segment.startsWith('(')).join('/')}`;

  if (HIDDEN_FOOTER_ROUTES.some(route => route.test(pathname))) {
    return 'hidden';
  }

  if (
    pathname === '/mypage' ||
    pathname.startsWith('/mypage/') ||
    ['/search', '/category', '/cart'].includes(pathname)
  ) {
    return 'desktop-only';
  }

  return 'visible';
}
