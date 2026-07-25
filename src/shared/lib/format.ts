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

export const formatKoreanDate = (value: string) =>
  KOREAN_DATE_FORMATTER.format(new Date(value));

export const formatKoreanDateTime = (value: string) =>
  KOREAN_DATE_TIME_FORMATTER.format(new Date(value));

export const formatKoreanMoney = (value: number) =>
  value.toLocaleString('ko-KR') + '원';

export const formatKoreanPoints = (value: number) =>
  value.toLocaleString('ko-KR') + ' P';
