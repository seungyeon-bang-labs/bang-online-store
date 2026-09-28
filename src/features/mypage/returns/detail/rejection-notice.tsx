import type { OrderClaimDetailRejectionNoticeViewModel } from '@/domains/order/claim/view-model';

interface MypageClaimDetailRejectionNoticeProps {
  notice: OrderClaimDetailRejectionNoticeViewModel;
}

export function MypageClaimDetailRejectionNotice({
  notice,
}: MypageClaimDetailRejectionNoticeProps) {
  return (
    <section className="rounded-md border border-red-200 bg-red-50 p-4 md:p-5">
      <h3 className="font-black text-red-700">
        교환·반품 신청이 반려되었습니다.
      </h3>
      <div className="mt-2 text-sm">
        <p className="font-bold text-red-700">반려 사유</p>
        <p className="mt-1.5 whitespace-pre-wrap wrap-break-word font-bold leading-relaxed text-red-700">
          {notice.reason}
        </p>
      </div>
    </section>
  );
}
