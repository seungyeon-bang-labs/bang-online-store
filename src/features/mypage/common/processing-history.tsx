import { MypageCard, type MypageCardMobileLayout } from './card';
import { MYPAGE_TYPOGRAPHY } from './styles';

export interface MypageProcessingHistoryItem {
  id: string;
  label: string;
  occurredAt: string;
  isCurrent: boolean;
}

interface MypageProcessingHistoryProps {
  collapsible?: boolean;
  mobileLayout?: MypageCardMobileLayout;
  title: string;
  histories: readonly MypageProcessingHistoryItem[];
}

export function MypageProcessingHistory({
  collapsible = false,
  mobileLayout,
  title,
  histories,
}: MypageProcessingHistoryProps) {
  const content = (
    <MypageCard.Body>
      <MypageProcessingHistoryList histories={histories} />
    </MypageCard.Body>
  );

  if (collapsible) {
    return (
      <MypageCard.Collapsible title={title} mobileLayout={mobileLayout}>
        {content}
      </MypageCard.Collapsible>
    );
  }

  return (
    <MypageCard mobileLayout={mobileLayout}>
      <MypageCard.Header>
        <MypageCard.Title>{title}</MypageCard.Title>
      </MypageCard.Header>
      {content}
    </MypageCard>
  );
}

interface MypageProcessingHistoryListProps {
  histories: readonly MypageProcessingHistoryItem[];
}

export function MypageProcessingHistoryList({
  histories,
}: MypageProcessingHistoryListProps) {
  return (
    <ol>
      {histories.map((history, index) => (
        <li
          key={history.id}
          className="relative grid grid-cols-[0.75rem_minmax(0,1fr)] gap-3"
        >
          {index < histories.length - 1 ? (
            <span
              className="absolute top-4.5 -bottom-1.5 left-1.25 w-0.5 bg-zinc-200"
              aria-hidden="true"
            />
          ) : null}
          <span
            className={`z-10 mt-1.5 size-3 shrink-0 rounded-full border-2 ${
              history.isCurrent
                ? 'border-black bg-black'
                : 'border-zinc-300 bg-white'
            }`}
            aria-hidden="true"
          />
          <div
            className={`grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-0.5 sm:flex sm:flex-wrap sm:gap-x-1.5 ${
              index < histories.length - 1 ? 'pb-5' : ''
            }`}
          >
            <p
              className={
                history.isCurrent
                  ? 'min-w-0 truncate font-black text-black'
                  : 'min-w-0 truncate font-bold text-zinc-500'
              }
            >
              {history.label}
            </p>
            <time className={`whitespace-nowrap ${MYPAGE_TYPOGRAPHY.meta}`}>
              <span className="sm:hidden">{history.occurredAt}</span>
              <span className="hidden sm:inline">· {history.occurredAt}</span>
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
}
