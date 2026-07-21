const KOREAN_DATE_FORMATTER = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const KOREAN_DATE_TIME_FORMATTER = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export const formatMypageDate = (value: string) =>
  KOREAN_DATE_FORMATTER.format(new Date(value));

export const formatMypageDateTime = (value: string) =>
  KOREAN_DATE_TIME_FORMATTER.format(new Date(value));

export const formatMypageMoney = (value: number) =>
  value.toLocaleString('ko-KR') + '원';

export const formatMypagePoints = (value: number) =>
  value.toLocaleString('ko-KR') + ' P';
