import type {
  ActivityProductViewModel,
  RecentProductDateGroupViewModel,
} from './view-model';
import type { RecentProductViewDTO } from './dto';
import type { OrderStatus } from '@/domains/order/dto';

export const REVIEW_TABS = ['available', 'completed'] as const;
export const REVIEW_PAGE_SIZE = 10;
export const REVIEW_RATING_MIN = 1;
export const REVIEW_RATING_MAX = 5;
export const REVIEW_CONTENT_MIN_LENGTH = 10;
export const REVIEW_CONTENT_MAX_LENGTH = 500;
export const RECENT_PRODUCT_MAX_COUNT = 50;
export const REVIEW_WRITE_DEADLINE_DAYS = 30;
export const REVIEW_DELETE_AVAILABLE_DAYS = 7;
export const WISHLIST_PAGE_SIZE = 15;
export const RECENT_PRODUCT_RETENTION_DAYS = 14;

export type ReviewTab = (typeof REVIEW_TABS)[number];

export interface ReviewListQuery {
  tab: ReviewTab;
  page: number;
}

export interface ReviewWriteEligibilityInput {
  orderStatus: OrderStatus;
  deliveredAt: string | null;
  hasReview: boolean;
  isCancelled: boolean;
  hasCompletedClaim: boolean;
}

export type ReviewWriteUnavailableReason =
  | 'not_delivered'
  | 'expired'
  | 'already_written'
  | 'cancelled'
  | 'completed_claim';

export interface ReviewFormValidationResult {
  isRatingValid: boolean;
  isContentValid: boolean;
}

export interface WishlistListQuery {
  page: number;
}

export function getRecentProductPolicyDescription(): string {
  return `최근 ${RECENT_PRODUCT_RETENTION_DAYS / 7}주 동안 보신 상품을 최대 ${RECENT_PRODUCT_MAX_COUNT}개까지 표시합니다.`;
}

export function getReviewWriteDeadline(deliveredAt: string): Date {
  const deadline = new Date(deliveredAt);

  deadline.setDate(deadline.getDate() + REVIEW_WRITE_DEADLINE_DAYS);
  deadline.setHours(23, 59, 59, 999);

  return deadline;
}

export function isReviewWriteAvailable(
  deliveredAt: string,
  now: Date = new Date(),
): boolean {
  return getReviewWriteDeadline(deliveredAt) >= now;
}

export function isReviewDeletable(
  createdAt: string,
  now: Date = new Date(),
): boolean {
  return getReviewDeleteAvailableAt(createdAt) <= now;
}

export function getReviewDeleteAvailableAt(createdAt: string): Date {
  const availableAt = new Date(createdAt);

  availableAt.setDate(
    availableAt.getDate() + REVIEW_DELETE_AVAILABLE_DAYS,
  );

  return availableAt;
}

export function isReviewWritable(
  input: ReviewWriteEligibilityInput,
  now: Date = new Date(),
): boolean {
  return getReviewWriteUnavailableReason(input, now) === null;
}

export function getReviewWriteUnavailableReason(
  {
    orderStatus,
    deliveredAt,
    hasReview,
    isCancelled,
    hasCompletedClaim,
  }: ReviewWriteEligibilityInput,
  now: Date = new Date(),
): ReviewWriteUnavailableReason | null {
  if (orderStatus !== 'delivered' || deliveredAt === null) {
    return 'not_delivered';
  }
  if (hasReview) return 'already_written';
  if (isCancelled) return 'cancelled';
  if (hasCompletedClaim) return 'completed_claim';
  if (!isReviewWriteAvailable(deliveredAt, now)) return 'expired';

  return null;
}

export function getReviewDeadlineDday(
  deadline: Date,
  now: Date = new Date(),
): string {
  const deadlineDate = new Date(deadline);
  const today = new Date(now);

  deadlineDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const remainingDays = Math.round(
    (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  return remainingDays === 0 ? 'D-Day' : `D-${remainingDays}`;
}

export function isReviewRatingValid(rating: number): boolean {
  return Number.isInteger(rating) &&
    rating >= REVIEW_RATING_MIN &&
    rating <= REVIEW_RATING_MAX;
}

export function getReviewContentLength(content: string): number {
  return content.trim().length;
}

export function isReviewContentValid(content: string): boolean {
  const length = getReviewContentLength(content);

  return (
    length >= REVIEW_CONTENT_MIN_LENGTH &&
    length <= REVIEW_CONTENT_MAX_LENGTH
  );
}

export function validateReviewForm({
  rating,
  content,
}: {
  rating: number;
  content: string;
}): ReviewFormValidationResult {
  return {
    isRatingValid: isReviewRatingValid(rating),
    isContentValid: isReviewContentValid(content),
  };
}

export function selectRecentProductViews(
  rows: readonly RecentProductViewDTO[],
  now: Date = new Date(),
): RecentProductViewDTO[] {
  const cutoff = new Date(now);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(
    cutoff.getDate() - (RECENT_PRODUCT_RETENTION_DAYS - 1),
  );

  return rows
    .filter(row => new Date(row.viewed_at) >= cutoff)
    .sort((a, b) => b.viewed_at.localeCompare(a.viewed_at))
    .slice(0, RECENT_PRODUCT_MAX_COUNT);
}

export function groupRecentProductItemsByDate(
  items: readonly ActivityProductViewModel[],
): RecentProductDateGroupViewModel[] {
  const groupByDateKey = new Map<
    string,
    RecentProductDateGroupViewModel
  >();

  for (const item of items) {
    const existingGroup = groupByDateKey.get(item.recordedDateKey);

    if (existingGroup) {
      existingGroup.items.push(item);
      continue;
    }

    groupByDateKey.set(item.recordedDateKey, {
      dateKey: item.recordedDateKey,
      dateLabel: item.recordedDateLabel,
      items: [item],
    });
  }

  return Array.from(groupByDateKey.values());
}
