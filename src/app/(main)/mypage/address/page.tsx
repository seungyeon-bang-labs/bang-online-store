import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  currentUserRepository,
  toUserAddressViewModel,
  userAddressRepository,
} from '@/domains/member';
import {
  MypageEmptyState,
  MypageSectionHeader,
} from '@/features/mypage/common';

async function AddressPage() {
  const user = await currentUserRepository.findCurrent();
  const addresses = user
    ? (await userAddressRepository.findByUserId(user.id)).map(
        toUserAddressViewModel,
      )
    : [];

  return (
    <div className="space-y-8">
      <MypageSectionHeader
        title="배송지 관리"
        action={
          <Button
            type="button"
            size="lg"
            className="w-full bg-black font-bold text-white hover:bg-zinc-800 md:w-auto"
          >
            배송지 추가
          </Button>
        }
      />
      {addresses.length === 0 ? (
        <MypageEmptyState
          icon={MapPin}
          title="등록된 배송지가 없습니다."
          description="자주 사용하는 배송지를 등록하면 주문할 때 빠르게 선택할 수 있습니다."
        />
      ) : (
        <div className="space-y-4">
          {addresses.map(address => (
            <article
              key={address.id}
              className="rounded-md border border-zinc-300 bg-white p-5 md:p-6"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-black text-black">
                  {address.label}
                </h3>
                {address.isDefault && (
                  <span className="rounded-sm bg-black px-2 py-1 text-xs font-black text-white">
                    기본 배송지
                  </span>
                )}
              </div>
              <p className="mt-4 text-sm font-bold text-black">
                {address.recipientName} · {address.phoneNumber}
              </p>
              <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-600">
                [{address.postalCode}] {address.addressText}
              </p>
              {address.deliveryNote && (
                <p className="mt-2 text-sm font-medium text-zinc-500">
                  배송 메모: {address.deliveryNote}
                </p>
              )}
              <div className="mt-5 flex gap-2 border-t border-zinc-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-zinc-300 font-bold shadow-none hover:border-black hover:bg-black hover:text-white"
                >
                  수정
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-zinc-300 font-bold shadow-none hover:border-black hover:bg-black hover:text-white"
                >
                  삭제
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default AddressPage;
