import { MYPAGE_ACTION_CLASS_NAME } from '@/features/mypage/common/styles';
import { ButtonLink } from '@/shared/components/ui/button';
import type { InquiryViewModel } from '@/domains/inquiry';
import { MypageCard, MypageCardContentBlock } from '@/features/mypage/common';
import { getMypageInquiryEditHref } from '@/shared/lib/mypage-routes';
import { MypageBadge } from '../common/badge';
import { MypageInquiryContext } from './context';
import { MypageInquiryCancelButton } from './cancel-button';

interface MypageInquiryCardProps {
  inquiry: InquiryViewModel;
  returnHref: string;
  cancelInquiryAction: (inquiryId: string) => Promise<boolean>;
}

export function MypageInquiryCard({
  inquiry,
  returnHref,
  cancelInquiryAction,
}: MypageInquiryCardProps) {
  const hasActions = inquiry.actions.canCancel || inquiry.actions.canEdit;

  return (
    <MypageCard as="article">
      <MypageCard.Header
        className="gap-3"
        right={
          <p className="shrink-0 whitespace-nowrap text-right text-xs font-medium text-zinc-400 sm:text-sm">
            {inquiry.createdAt}
          </p>
        }
      >
        <div className="flex min-w-0 items-center gap-2">
          <MypageBadge
            label={inquiry.typeLabel}
            tone="neutral"
            size="responsive"
          />
          <MypageBadge {...inquiry.status} size="responsive" />
        </div>
      </MypageCard.Header>

      <MypageCard.Body className={hasActions ? 'pb-0 md:pb-0' : undefined}>
        {inquiry.context ? (
          <MypageInquiryContext context={inquiry.context} />
        ) : null}
        {inquiry.context ? (
          <div className="my-4 -mx-4 border-t border-zinc-200 md:-mx-5" />
        ) : null}
        <div className="px-4">
          <h3 className="font-black text-black">{inquiry.title}</h3>
          <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-relaxed text-zinc-700">
            {inquiry.content}
          </p>
        </div>

        {inquiry.answerContent && inquiry.answeredAt ? (
          <MypageCardContentBlock
            title="답변"
            meta={inquiry.answeredAt}
            className="mt-4"
          >
            {inquiry.answerContent}
          </MypageCardContentBlock>
        ) : null}
      </MypageCard.Body>
      {hasActions ? (
        <MypageCard.Footer>
          <div
            className={`grid gap-2 ${
              inquiry.actions.canCancel && inquiry.actions.canEdit
                ? 'grid-cols-2'
                : 'grid-cols-1'
            }`}
          >
            {inquiry.actions.canCancel ? (
              <MypageInquiryCancelButton
                inquiryId={inquiry.id}
                cancelInquiryAction={cancelInquiryAction}
              />
            ) : null}
            {inquiry.actions.canEdit ? (
              <ButtonLink
                href={getMypageInquiryEditHref(inquiry.id, returnHref)}
                variant="outline"
                size="sm"
                className={`w-full ${MYPAGE_ACTION_CLASS_NAME.outline}`}
              >
                수정
              </ButtonLink>
            ) : null}
          </div>
        </MypageCard.Footer>
      ) : null}
    </MypageCard>
  );
}
