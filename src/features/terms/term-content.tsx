import type { TermDetailViewModel } from '@/domains/terms/view-model';

interface TermContentProps {
  term: TermDetailViewModel;
}

export function TermContent({ term }: TermContentProps) {
  return (
    <article className="space-y-6">
      <p className="border-b pb-4 text-sm text-muted-foreground">
        버전 {term.version} · 시행일 {term.effectiveDateLabel}
      </p>
      <div className="whitespace-pre-wrap wrap-break-word text-base leading-7">
        {term.content}
      </div>
    </article>
  );
}
