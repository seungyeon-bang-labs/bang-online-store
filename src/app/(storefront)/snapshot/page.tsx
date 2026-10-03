import { Heart, Plus } from 'lucide-react';
import { Suspense } from 'react';
import { ButtonLink } from '@/shared/components/ui/button';
import Link from 'next/link';
import { PageTitle } from '@/shared/components/common/page-title';
import { SearchInput } from '@/shared/components/common/search-input';
import Image from 'next/image';
import { snapshotData } from '@/domains/snapshot';
import { Container } from '@/shared/components/layout/container';

const compactNumberFormatter = new Intl.NumberFormat('ko-KR', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

interface SnapshotPageProps {
  searchParams: Promise<{ q?: string }>;
}

const SnapshotPage = async ({ searchParams }: SnapshotPageProps) => {
  const { q } = await searchParams;
  const query = q?.trim() ?? '';
  const normalizedQuery = query.toLocaleLowerCase();
  const snapshots = normalizedQuery
    ? snapshotData.filter(snapshot =>
        [
          snapshot.author.nickname,
          snapshot.content,
          ...snapshot.taggedProducts.map(product => product.productName),
        ].some(value => value.toLocaleLowerCase().includes(normalizedQuery)),
      )
    : snapshotData;

  return (
    <Container className="mb-20 pb-6 pt-4 md:py-10">
      <div className="flex items-center gap-2 md:hidden">
        <Suspense fallback={<div className="h-10 min-w-0 flex-1" />}>
          <SearchInput initialValue={query} className="min-w-0 flex-1" />
        </Suspense>
        <ButtonLink
          href="/snapshot/upload"
          aria-label="스냅샷 업로드"
          variant="default"
          size="icon-lg"
        >
          <Plus className="size-5" aria-hidden="true" />
        </ButtonLink>
      </div>

      <PageTitle current="SNAPSHOT" className="hidden md:flex">
        <div className="flex items-center gap-4">
          <Suspense fallback={<div className="w-full md:w-80" />}>
            <SearchInput initialValue={query} />
          </Suspense>
          <ButtonLink href="/snapshot/upload" variant="default" size="lg">
            <Plus className="size-4" /> 업로드
          </ButtonLink>
        </div>
      </PageTitle>

      {/* 2. 스냅샷 그리드 */}
      <div className="mb-20 mt-4 grid grid-cols-2 gap-2 md:mt-0 md:grid-cols-3 md:gap-3 lg:grid-cols-4">
        {snapshots.map(snap => (
          <Link
            href={`/snapshots/${snap.id}`}
            key={snap.id}
            className="group relative block aspect-3/4 w-full overflow-hidden rounded-md bg-zinc-100 transition-all duration-300 md:hover:shadow-2xl md:hover:shadow-black/10"
          >
            <Image
              src={`/images/${snap.images[0].url}`}
              alt={`${snap.author.nickname}'s Snap`}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 md:group-hover:scale-105"
              priority
            />

            <div className="absolute bottom-0 h-1/2 w-full bg-linear-to-t from-black/80 to-transparent" />

            <div className="absolute inset-0 flex flex-col justify-end p-3 text-white md:p-5">
              <div className="space-y-2 transition-transform duration-300 md:translate-y-2 md:space-y-3 md:group-hover:translate-y-0">
                <div className="flex items-center justify-between gap-1.5 md:gap-3">
                  <p className="min-w-0 truncate text-[10px] font-black tracking-tighter uppercase text-white/90 md:text-sm">
                    {snap.author.nickname}
                  </p>

                  <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
                    <Heart className="size-3.5 text-white transition-colors md:size-4 md:hover:text-red-500" />
                    <span className="text-xs font-bold md:hidden">
                      {compactNumberFormatter.format(snap.stats.likes)}
                    </span>
                    <span className="hidden text-sm font-bold md:inline">
                      {snap.stats.likes.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {snapshots.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center gap-4 py-20 text-center">
            <p className="text-sm font-medium text-gray-500">
              &quot;{query}&quot;에 대한 스냅샷이 없습니다.
            </p>
            <ButtonLink href="/snapshot" variant="outline" size="sm">
              전체 스냅샷 보기
            </ButtonLink>
          </div>
        ) : null}
      </div>
    </Container>
  );
};

export default SnapshotPage;
