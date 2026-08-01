import { MypageFilterLinks, type MypageFilterOption } from './filter-links';

export interface MypageFilterCardFilter {
  id: string;
  label: string;
  options: readonly MypageFilterOption<string>[];
}

interface MypageFilterCardProps {
  filters: readonly MypageFilterCardFilter[];
  values: Readonly<Record<string, string>>;
  getHref: (values: Readonly<Record<string, string>>) => string;
}

export function MypageFilterCard({
  filters,
  values,
  getHref,
}: MypageFilterCardProps) {
  return (
    <section className="divide-y divide-zinc-200 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50">
      {filters.map(filter => (
        <div key={filter.id} className="p-4 md:p-5">
          <MypageFilterLinks
            label={filter.label}
            options={filter.options}
            current={values[filter.id]}
            mobileScrollable
            scrollTargetId={`mypage-filter-${filter.id}`}
            getHref={value => getHref({ ...values, [filter.id]: value })}
          />
        </div>
      ))}
    </section>
  );
}
