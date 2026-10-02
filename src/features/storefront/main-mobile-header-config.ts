import type { CategoryGroupViewModel } from '@/domains/category';
import type { MainMobileHeaderConfig } from '@/shared/components/layout/main-mobile-header.types';
import { resolveCartReturnHref } from '@/shared/lib/cart-routes';

const TITLE_ROUTES: Record<string, string> = {
  '/new': 'NEW',
  '/best': 'BEST',
  '/sale': 'SALE',
  '/search': '검색',
  '/category': '카테고리',
  '/event': 'EVENT',
  '/snapshot': 'SNAPSHOT',
  '/cs': '고객센터',
};

const CART_TITLE_ROUTES = new Set(['/new', '/best', '/sale', '/search']);
const BRAND_HEADER_ROUTES = new Set(['/new', '/best', '/sale', '/event']);

function getTitleConfig(
  title: string,
  options?: Pick<
    Extract<MainMobileHeaderConfig, { kind: 'title' }>,
    'backHref' | 'action'
  >,
): MainMobileHeaderConfig {
  return { kind: 'title', title, ...options };
}

export function getStorefrontMobileHeaderConfig(
  pathname: string,
  categoryGroupViewModels: readonly CategoryGroupViewModel[],
  cartReturnTo?: string | null,
): MainMobileHeaderConfig {
  if (pathname === '/' || BRAND_HEADER_ROUTES.has(pathname)) {
    return { kind: 'brand' };
  }

  const directTitle = TITLE_ROUTES[pathname];
  if (directTitle) {
    return getTitleConfig(
      directTitle,
      CART_TITLE_ROUTES.has(pathname) ? { action: 'cart' } : undefined,
    );
  }

  if (pathname === '/cart') {
    return getTitleConfig('장바구니', {
      backHref: resolveCartReturnHref(cartReturnTo),
    });
  }

  const categoryMatch = pathname.match(/^\/category\/([^/]+)\/[^/]+$/);
  if (categoryMatch) {
    const currentCategory = categoryGroupViewModels.find(
      category => category.slug === categoryMatch[1],
    );

    if (!currentCategory) return { kind: 'brand' };

    return {
      kind: 'category',
      title: currentCategory.name,
      siblings: categoryGroupViewModels.map(category => ({
        label: category.name,
        href: `/category/${category.slug}/all`,
      })),
      action: 'cart',
    };
  }

  if (/^\/product\/[^/]+$/.test(pathname)) {
    return getTitleConfig('상품 상세', { backHref: '/', action: 'cart' });
  }

  if (/^\/event\/[^/]+$/.test(pathname)) {
    return getTitleConfig('EVENT', { backHref: '/event' });
  }

  if (pathname === '/snapshot/upload') {
    return getTitleConfig('SNAPSHOT 업로드', { backHref: '/snapshot' });
  }

  if (/^\/snapshot\/[^/]+$/.test(pathname)) {
    return getTitleConfig('SNAPSHOT', { backHref: '/snapshot' });
  }

  if (pathname === '/cs/faq') {
    return getTitleConfig('자주 묻는 질문', { backHref: '/cs' });
  }

  if (pathname === '/cs/notice') {
    return getTitleConfig('공지사항', { backHref: '/cs' });
  }

  if (/^\/cs\/notice\/[^/]+$/.test(pathname)) {
    return getTitleConfig('공지사항', { backHref: '/cs/notice' });
  }

  if (pathname === '/cs/return-request') {
    return getTitleConfig('교환·반품 안내', { backHref: '/cs' });
  }

  return { kind: 'brand' };
}
