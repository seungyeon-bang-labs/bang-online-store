interface MypageClaimCardInformationProps {
  reason: string;
  requestedAt: string;
  completedAt: string | null;
}

export function MypageClaimCardInformation({
  reason,
  requestedAt,
  completedAt,
}: MypageClaimCardInformationProps) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-5 border-t border-zinc-100 p-4 text-sm md:grid-cols-[minmax(0,1fr)_auto_auto] md:px-8 md:py-5">
      <div className="col-span-2 min-w-0 md:col-span-1 md:flex md:items-baseline md:gap-3">
        <dt className="font-bold text-zinc-500">사유</dt>
        <dd className="mt-1 font-bold text-zinc-700 md:mt-0">{reason}</dd>
      </div>
      <div className="min-w-0 md:flex md:items-baseline md:gap-3">
        <dt className="font-bold text-zinc-500">신청일</dt>
        <dd className="mt-1 font-bold text-zinc-700 md:mt-0">
          {requestedAt}
        </dd>
      </div>
      <div className="min-w-0 md:flex md:items-baseline md:gap-3">
        <dt className="font-bold text-zinc-500">완료일</dt>
        <dd className="mt-1 font-bold text-zinc-700 md:mt-0">
          {completedAt ?? '-'}
        </dd>
      </div>
    </dl>
  );
}
