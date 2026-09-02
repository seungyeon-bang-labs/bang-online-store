export function MypageLoadingState() {
  return (
    <section aria-busy="true" aria-live="polite" className="space-y-8">
      <p className="sr-only">마이페이지 내용을 불러오는 중입니다.</p>
      <div className="h-8 w-32 animate-pulse rounded-sm bg-zinc-200" />
      <div className="h-28 animate-pulse rounded-md border border-zinc-200 bg-zinc-100" />
      <div className="space-y-3" aria-hidden="true">
        {[0, 1, 2].map(index => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-md border border-zinc-200 bg-zinc-100"
          />
        ))}
      </div>
    </section>
  );
}
