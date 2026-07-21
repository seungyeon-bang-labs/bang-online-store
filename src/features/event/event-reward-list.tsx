import { EventRewardItem } from '@/features/event/event-reward-item';
import type { EventRewardSectionViewModel } from '@/domains/event';
import { cn } from '@/shared/lib/utils';

const REWARD_NOTICE_ITEMS = [
  '리워드는 이벤트 조건 충족 여부에 따라 지급됩니다.',
  '지급 일정과 대상은 이벤트 안내 기준을 따릅니다.',
  '종료된 이벤트는 리워드 참여가 마감됩니다.',
];

interface EventRewardListProps {
  rewardSection: EventRewardSectionViewModel;
  disabled?: boolean;
}

export function EventRewardList({
  rewardSection,
  disabled = false,
}: EventRewardListProps) {
  if (!rewardSection.rewards.length) return null;

  return (
    <section className="mx-auto mt-8 max-w-6xl rounded-lg bg-white px-4 py-8 shadow-sm sm:px-6 md:mt-10 md:px-8 md:py-12">
      <div className="mb-8 pb-2 md:mb-12 md:pb-6">
        <h2 className="text-xl md:text-2xl font-black tracking-tight text-neutral-900">
          {rewardSection.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500 md:text-base">
          {disabled
            ? '종료된 이벤트로 리워드 참여가 마감되었습니다.'
            : '이벤트 참여로 받을 수 있는 리워드 혜택을 확인하세요.'}
        </p>
      </div>

      <div
        className={cn(
          'grid grid-cols-1 justify-items-center gap-8 pb-4 md:pb-6',
          rewardSection.rewards.length > 1 && 'md:grid-cols-2',
        )}
      >
        {rewardSection.rewards.map(reward => (
          <EventRewardItem
            key={`${reward.title}-${reward.valueLabel}`}
            reward={reward}
            disabled={disabled}
          />
        ))}
      </div>

      <div className="mt-8 rounded-lg bg-neutral-100 p-4 md:mt-12 md:p-6">
        <ul className="text-sm text-neutral-700 space-y-1 list-disc list-inside">
          {REWARD_NOTICE_ITEMS.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
