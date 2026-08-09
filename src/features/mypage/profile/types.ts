import type { MemberProfileViewModel } from '@/domains/member';

export type EditableProfileFormValues = Pick<
  MemberProfileViewModel,
  'name' | 'phoneNumber' | 'birthDate'
>;

export type EditableProfileField = keyof EditableProfileFormValues;
