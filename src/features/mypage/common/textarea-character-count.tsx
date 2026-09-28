interface MypageTextareaCharacterCountProps {
  current: number;
  max: number;
}

export function MypageTextareaCharacterCount({
  current,
  max,
}: MypageTextareaCharacterCountProps) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute right-3 bottom-3 select-none text-sm font-medium text-zinc-400"
    >
      {current} / {max}자
    </span>
  );
}
