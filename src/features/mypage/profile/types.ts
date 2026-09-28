import type { MemberProfileViewModel } from '@/domains/member';

export type EditableProfileFormValues = Pick<
  MemberProfileViewModel,
  'name' | 'phoneNumber' | 'birthDate' | 'gender'
>;

export type EditableProfileField = keyof EditableProfileFormValues;
