export type NoticeCategoryDTO =
  | 'all'
  | 'shipping'
  | 'system'
  | 'policy'
  | 'winners';

export interface NoticeDTO {
  id: number;
  title: string;
  date: string;
  category: NoticeCategoryDTO;
  tag?: string;
}

export type Notice = NoticeDTO;

