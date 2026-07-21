export const REVIEW_TABS = ['available', 'completed'] as const;

export type ReviewTab = (typeof REVIEW_TABS)[number];

export interface ReviewListQuery {
  tab: ReviewTab;
  page: number;
}
