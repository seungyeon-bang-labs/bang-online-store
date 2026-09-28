import { MypageFilterLinks, type MypageFilterOption } from './filter-links';
import type { ReactNode } from 'react';
import {
  MypageMobileFilterDrawer,
  type MypageMobileFilterDrawerToggle,
} from './mobile-filter-drawer';
import { getMypageFilterSelectionKey } from './filter-selection-key';

export interface MypageFilterCardFilter {
  id: string;
  label: string;
  mobileSummaryLabel?: string;
  options: readonly MypageFilterOption<string>[];
}

interface MypageFilterCardProps {
  filters: readonly MypageFilterCardFilter[];
  values: Readonly<Record<string, string>>;
  getHref: (values: Readonly<Record<string, string>>) => string;
  children?: ReactNode;
  mobileToggles?: readonly MypageMobileFilterDrawerToggle[];
  desktopLayout?: 'card' | 'chips';
}

function getMobileFilterHrefBySelection(
  filters: readonly MypageFilterCardFilter[],
  values: Readonly<Record<string, string>>,
  getHref: MypageFilterCardProps['getHref'],
  toggles: readonly MypageMobileFilterDrawerToggle[],
): Record<string, string> {
  const controls = [
    ...filters.map(filter => ({
      id: filter.id,
      values: filter.options.map(option => option.value),
    })),
    ...toggles.map(toggle => ({ id: toggle.id, values: ['false', 'true'] })),
  ];
  const controlIds = controls.map(control => control.id);
  const hrefBySelection: Record<string, string> = {};

  function visit(index: number, selectedValues: Record<string, string>) {
    if (index === controls.length) {
      const nextValues = { ...values, ...selectedValues };
      hrefBySelection[getMypageFilterSelectionKey(controlIds, nextValues)] =
        getHref(nextValues);
      return;
    }

    const control = controls[index];
    control.values.forEach(value => {
      visit(index + 1, { ...selectedValues, [control.id]: value });
    });
  }

  visit(0, {});
  return hrefBySelection;
}

export function MypageFilterCard({
  filters,
  values,
  getHref,
  children,
  mobileToggles = [],
  desktopLayout = 'card',
}: MypageFilterCardProps) {
  const useMobileDrawer = filters.length > 1;
  const useMobileChipOnly = filters.length === 1 && !children;
  const mobileHrefBySelection = useMobileDrawer
    ? getMobileFilterHrefBySelection(filters, values, getHref, mobileToggles)
    : null;
  const filterRows = filters.map(filter => (
    <div key={filter.id} className="px-4 py-3 md:px-5 md:py-3.5">
      <MypageFilterLinks
        label={filter.label}
        options={filter.options}
        current={values[filter.id]}
        mobileScrollable
        scrollTargetId={`mypage-filter-${filter.id}`}
        getHref={value => getHref({ ...values, [filter.id]: value })}
      />
    </div>
  ));

  if (useMobileDrawer && mobileHrefBySelection) {
    return (
      <>
        <section className="md:hidden">
          <MypageMobileFilterDrawer
            filters={filters}
            values={values}
            hrefBySelection={mobileHrefBySelection}
            toggles={mobileToggles}
          />
        </section>
        <section className="hidden divide-y divide-zinc-200 overflow-hidden rounded-md border border-zinc-200 bg-white md:block">
          {filterRows}
          {children ? <div className="px-4 py-3 md:px-5 md:py-3.5">{children}</div> : null}
        </section>
      </>
    );
  }

  if (useMobileChipOnly) {
    const [filter] = filters;
    const filterLinks = (
      <MypageFilterLinks
        label={filter.label}
        options={filter.options}
        current={values[filter.id]}
        mobileScrollable
        scrollTargetId={`mypage-filter-${filter.id}`}
        getHref={value => getHref({ ...values, [filter.id]: value })}
      />
    );

    return (
      <>
        <section className={desktopLayout === 'chips' ? '' : 'md:hidden'}>
          {filterLinks}
        </section>
        {desktopLayout === 'card' ? (
          <section className="hidden divide-y divide-zinc-200 overflow-hidden rounded-md border border-zinc-200 bg-white md:block">
            {filterRows}
          </section>
        ) : null}
      </>
    );
  }

  return (
    <section className="divide-y divide-zinc-200 overflow-hidden rounded-md border border-zinc-200 bg-white">
      {filterRows}
      {children ? <div className="px-4 py-3 md:px-5 md:py-3.5">{children}</div> : null}
    </section>
  );
}
