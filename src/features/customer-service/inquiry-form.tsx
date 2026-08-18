'use client';

import type { FormEvent } from 'react';
import { Camera } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const inputClassName =
  'border-zinc-300 bg-white font-medium shadow-none hover:ring-[3px] hover:ring-black/70 focus-visible:border-zinc-300 focus-visible:ring-black/70';

const labelClassName = 'text-sm font-black text-black';

function RequiredMark() {
  return <span className="text-red-500">*</span>;
}

export function InquiryForm() {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-5 rounded-md border border-zinc-300 bg-white p-5 md:p-6">
        <div>
          <h2 className="text-base font-black text-black">문의 정보</h2>
          <p className="mt-1 text-sm font-medium text-zinc-500">
            문의 유형과 관련 정보를 입력해 주세요.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-[140px_1fr] md:items-center">
          <label className={labelClassName}>
            문의 유형 <RequiredMark />
          </label>
          <select
            name="inquiryType"
            className="h-12 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium outline-none transition-[color,box-shadow] hover:ring-[3px] hover:ring-black/70 focus:border-zinc-300 focus:ring-[3px] focus:ring-black/70"
            defaultValue=""
          >
            <option value="" disabled>
              문의 유형을 선택해 주세요
            </option>
            <option value="order">주문/결제</option>
            <option value="delivery">배송</option>
            <option value="return">교환·반품</option>
            <option value="product">상품</option>
            <option value="coupon">쿠폰/이벤트</option>
            <option value="account">회원/계정</option>
            <option value="etc">기타</option>
          </select>
        </div>

        <div className="grid gap-3 md:grid-cols-[140px_1fr] md:items-center">
          <label htmlFor="orderInfo" className={labelClassName}>
            주문/상품 정보
          </label>
          <Input
            id="orderInfo"
            name="orderInfo"
            placeholder="주문번호 또는 상품명을 입력해 주세요"
            className={inputClassName}
          />
        </div>
      </section>

      <section className="space-y-5 rounded-md border border-zinc-300 bg-white p-5 md:p-6">
        <div>
          <h2 className="text-base font-black text-black">문의 내용</h2>
          <p className="mt-1 text-sm font-medium text-zinc-500">
            내용을 자세히 남겨주시면 더 정확한 답변이 가능합니다.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-[140px_1fr] md:items-center">
          <label htmlFor="title" className={labelClassName}>
            제목 <RequiredMark />
          </label>
          <Input
            id="title"
            name="title"
            placeholder="제목을 입력해 주세요"
            className={inputClassName}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-[140px_1fr] md:items-start">
          <label htmlFor="content" className={`${labelClassName} md:pt-3`}>
            내용 <RequiredMark />
          </label>
          <Textarea
            id="content"
            name="content"
            rows={10}
            placeholder="문의 내용을 입력해 주세요. 주문번호, 상품명, 요청 사항을 함께 적어주시면 좋습니다."
            className={`${inputClassName} min-h-56 resize-none`}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-[140px_1fr] md:items-start">
          <label className={`${labelClassName} md:pt-2`}>파일 첨부</label>
          <div className="space-y-3">
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-zinc-300 px-5 py-3 transition-[color,box-shadow] hover:ring-[3px] hover:ring-black/70">
              <Camera className="size-5 text-zinc-500" />
              <span className="text-sm font-bold text-zinc-700">
                이미지 업로드
              </span>
              <input type="file" accept="image/*" className="hidden" />
            </label>
            <p className="text-xs font-medium text-zinc-400">
              10MB 이하의 JPG, PNG 이미지를 첨부할 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-5 rounded-md border border-zinc-300 bg-white p-5 md:p-6">
        <div>
          <h2 className="text-base font-black text-black">답변 정보</h2>
          <p className="mt-1 text-sm font-medium text-zinc-500">
            답변 확인에 필요한 정보를 입력해 주세요.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-[140px_1fr] md:items-center">
          <label htmlFor="email" className={labelClassName}>
            이메일
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="답변 받을 이메일을 입력해 주세요"
            className={inputClassName}
          />
        </div>

        <div className="rounded-md bg-zinc-50 p-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="agree"
              name="agree"
              className="mt-1 size-4 accent-black"
            />
            <label
              htmlFor="agree"
              className="cursor-pointer text-sm font-medium leading-relaxed text-zinc-600"
            >
              <span className="mr-1 font-black text-black">[필수]</span>
              개인정보 수집 및 이용에 동의합니다. 수집된 정보는 문의 응대와
              기록 보존을 위해 사용됩니다.
            </label>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 pt-2 md:flex-row md:justify-end">
        <ButtonLink
          href="/cs"
          variant="outline"
          size="xl"
          className="w-full border-zinc-300 font-bold hover:bg-zinc-100 md:w-40"
        >
          취소
        </ButtonLink>
        <Button
          type="submit"
          size="xl"
          className="w-full bg-black font-black text-white hover:bg-zinc-800 md:w-48"
        >
          문의 등록
        </Button>
      </div>
    </form>
  );
}
