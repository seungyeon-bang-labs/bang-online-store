export type FAQCategoryDTO =
  | 'all'
  | 'delivery'
  | 'order'
  | 'product'
  | 'size'
  | 'returns'
  | 'account'
  | 'guide'
  | 'other';

export interface FAQDTO {
  id: number;
  question: string;
  answer: string;
  category: FAQCategoryDTO;
  tag?: string;
}

export type FAQ = FAQDTO;

