'use client';

import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { MemberProfileViewModel } from '@/domains/member';

const inputClassName =
  'border-zinc-300 bg-white font-medium shadow-none hover:ring-[3px] hover:ring-black/70 focus-visible:border-zinc-300 focus-visible:ring-black/70';

export function MypageProfileForm({
  profile,
}: {
  profile: MemberProfileViewModel;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-md border border-zinc-300 bg-white p-5 md:p-6"
    >
      <div className="grid gap-3 md:grid-cols-[120px_1fr] md:items-center">
        <label htmlFor="name" className="text-sm font-black text-black">
          이름
        </label>
        <Input
          id="name"
          name="name"
          defaultValue={profile.name}
          className={inputClassName}
        />
      </div>
      <div className="grid gap-3 md:grid-cols-[120px_1fr] md:items-center">
        <label htmlFor="email" className="text-sm font-black text-black">
          이메일
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={profile.email}
          className={inputClassName}
        />
      </div>
      <div className="grid gap-3 md:grid-cols-[120px_1fr] md:items-center">
        <label htmlFor="phone" className="text-sm font-black text-black">
          휴대폰 번호
        </label>
        <Input
          id="phone"
          name="phone"
          defaultValue={profile.phoneNumber}
          placeholder="휴대폰 번호를 입력해 주세요"
          className={inputClassName}
        />
      </div>
      <div className="grid gap-3 md:grid-cols-[120px_1fr] md:items-center">
        <label htmlFor="birthDate" className="text-sm font-black text-black">
          생년월일
        </label>
        <Input
          id="birthDate"
          name="birthDate"
          type="date"
          defaultValue={profile.birthDate}
          className={inputClassName}
        />
      </div>
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          size="lg"
          className="w-full bg-black font-bold text-white hover:bg-zinc-800 md:w-40"
        >
          저장
        </Button>
      </div>
    </form>
  );
}
