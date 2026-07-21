import { CheckCircle2, Clock, Lock } from 'lucide-react';

const guideItems = [
  {
    icon: Clock,
    title: '답변 시간',
    description: '문의 답변은 영업일 기준 1~2일 내 순차적으로 등록됩니다.',
  },
  {
    icon: CheckCircle2,
    title: '문의 확인',
    description: '접수한 문의와 답변은 마이페이지의 1:1 문의 내역에서 확인할 수 있습니다.',
  },
  {
    icon: Lock,
    title: '개인정보 보호',
    description: '문의 처리를 위해 수집된 정보는 관련 법령에 따라 안전하게 관리됩니다.',
  },
];

export function InquiryGuide() {
  return (
    <section className="mt-12 border-t border-zinc-200 pt-6">
      <div className="grid gap-4 md:grid-cols-3">
        {guideItems.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex gap-3">
            <Icon className="mt-0.5 size-5 shrink-0 text-zinc-500" />
            <div>
              <p className="text-sm font-black text-black">{title}</p>
              <p className="mt-1 text-sm font-medium leading-relaxed text-zinc-500">
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
