import { MessageSquare } from 'lucide-react';
import { DynamicPagination } from '@/components/common/dynamic-pagination';
import { ButtonLink } from '@/components/ui/button';
import {
  filterInquiries,
  inquiryRepository,
  INQUIRY_STATUS_FILTERS,
  INQUIRY_TYPE_FILTERS,
  toInquiryViewModel,
} from '@/domains/inquiry';
import { currentUserRepository } from '@/domains/member';
import { paginate } from '@/domains/mypage/mypage-pagination';
import { MypageEmptyState } from '@/features/mypage/mypage-empty-state';
import { MypageFilterLinks } from '@/features/mypage/mypage-filter-links';
import { MypageInquiryList } from '@/features/mypage/mypage-inquiry-list';
import { MypageSectionHeader } from '@/features/mypage/mypage-section-header';
import {
  buildQueryHref,
  firstQueryValue,
  parsePositivePage,
  parseQueryOption,
} from '@/shared/lib/query';

interface InquiriesPageProps {
  searchParams: Promise<{
    type?: string | string[];
    status?: string | string[];
    page?: string | string[];
  }>;
}

const INQUIRY_TYPE_LABELS: Record<
  (typeof INQUIRY_TYPE_FILTERS)[number],
  string
> = {
  all: '전체',
  order: '주문/결제',
  delivery: '배송',
  return: '교환/반품',
  product: '상품',
  coupon: '쿠폰/이벤트',
  account: '회원/계정',
  etc: '기타',
};

const INQUIRY_STATUS_LABELS: Record<
  (typeof INQUIRY_STATUS_FILTERS)[number],
  string
> = {
  all: '전체',
  pending: '답변대기',
  answered: '답변완료',
};

const INQUIRY_TYPE_LINKS = INQUIRY_TYPE_FILTERS.map(value => ({
  value,
  label: INQUIRY_TYPE_LABELS[value],
}));

const INQUIRY_STATUS_LINKS = INQUIRY_STATUS_FILTERS.map(value => ({
  value,
  label: INQUIRY_STATUS_LABELS[value],
}));

async function InquiriesPage({ searchParams }: InquiriesPageProps) {
  const user = await currentUserRepository.findCurrent();
  const search = await searchParams;
  const type = parseQueryOption({
    value: firstQueryValue(search.type),
    options: INQUIRY_TYPE_FILTERS,
    fallback: 'all',
  });
  const status = parseQueryOption({
    value: firstQueryValue(search.status),
    options: INQUIRY_STATUS_FILTERS,
    fallback: 'all',
  });
  const rows = user
    ? await inquiryRepository.findByUserId(user.id)
    : [];
  const filtered = filterInquiries(rows, { type, status });
  const result = paginate(
    filtered.map(toInquiryViewModel),
    parsePositivePage(search.page),
    4,
  );

  return (
    <div className="space-y-8">
      <MypageSectionHeader
        title="1:1 문의 내역"
        description="접수한 문의와 답변 상태를 확인할 수 있습니다."
        action={
          <ButtonLink
            href="/cs/inquiry"
            size="lg"
            className="w-full bg-black font-bold text-white hover:bg-zinc-800 md:w-auto"
          >
            문의 작성
          </ButtonLink>
        }
      />
      <MypageFilterLinks
        label="문의 유형"
        options={INQUIRY_TYPE_LINKS}
        current={type}
        getHref={nextType =>
          buildQueryHref('/mypage/inquiries', {
            type: nextType,
            status,
            page: 1,
          })
        }
      />
      <MypageFilterLinks
        label="답변 상태"
        options={INQUIRY_STATUS_LINKS}
        current={status}
        getHref={nextStatus =>
          buildQueryHref('/mypage/inquiries', {
            type,
            status: nextStatus,
            page: 1,
          })
        }
      />
      {result.items.length > 0 ? (
        <MypageInquiryList inquiries={result.items} />
      ) : (
        <MypageEmptyState
          icon={MessageSquare}
          title="문의 내역이 없습니다."
          description="상품, 주문, 배송과 관련해 궁금한 내용을 1:1 문의로 남겨보세요."
        />
      )}
      <DynamicPagination
        currentPage={result.currentPage}
        totalPages={result.totalPages}
        getPageHref={({ page }) =>
          buildQueryHref('/mypage/inquiries', { type, status, page })
        }
      />
    </div>
  );
}

export default InquiriesPage;
