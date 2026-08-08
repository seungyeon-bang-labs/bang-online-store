interface MypageRecentProductPolicyProps {
  description: string;
}

export function MypageRecentProductPolicy({
  description,
}: MypageRecentProductPolicyProps) {
  return (
    <section className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-sm font-medium leading-relaxed text-zinc-600">
      <p>{description}</p>
    </section>
  );
}
