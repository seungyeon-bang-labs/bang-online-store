import type { UserAddressFormViewModel } from '@/domains/member';

export type MypageAddressFormMode = 'create' | 'edit';

export type MypageAddressFormValues = Omit<UserAddressFormViewModel, 'id'>;
