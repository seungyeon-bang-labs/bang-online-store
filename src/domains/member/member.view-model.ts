export interface MemberProfileViewModel {
  name: string;
  email: string;
  phoneNumber: string;
  birthDate: string;
}

export interface UserAddressViewModel {
  id: string;
  label: string;
  recipientName: string;
  phoneNumber: string;
  postalCode: string;
  addressText: string;
  deliveryNote: string | null;
  isDefault: boolean;
}
