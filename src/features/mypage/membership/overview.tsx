import type {
  MembershipCurrentTierViewModel,
  MembershipProgressViewModel,
} from '@/domains/benefit';
import { MypageMembershipCurrentTierCard } from './current-tier-card';
import { MypageMembershipProgressCard } from './progress-card';

interface MypageMembershipOverviewProps {
  currentTier: MembershipCurrentTierViewModel;
  progress: MembershipProgressViewModel;
}

export function MypageMembershipOverview({
  currentTier,
  progress,
}: MypageMembershipOverviewProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <MypageMembershipCurrentTierCard currentTier={currentTier} />
      <MypageMembershipProgressCard progress={progress} />
    </div>
  );
}
