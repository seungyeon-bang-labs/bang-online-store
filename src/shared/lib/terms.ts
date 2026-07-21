export const termsAcceptedData = [
  {
    id: 'termsAccepted1',
    label: '만, 14세 이상입니다.',
    type: 'essential',
    link: null,
  },
  {
    id: 'termsAccepted2',
    label: '이용 약관 동의',
    type: 'essential',
    link: '/terms',
  },
  {
    id: 'termsAccepted3',
    label: '개인정보 처리방침 동의',
    type: 'essential',
    link: '/terms',
  },
  {
    id: 'termsAccepted4',
    label: '마케팅 정보 수신 동의',
    type: 'optional',
    link: '/terms',
  },
] as const;

export type TermsKey = (typeof termsAcceptedData)[number]['id'];
