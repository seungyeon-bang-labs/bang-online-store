export type StatusTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

export interface StatusViewModel {
  label: string;
  tone: StatusTone;
}
