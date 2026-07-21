import { Heart, Plus, Tag } from 'lucide-react';
import { Suspense } from 'react';
import { ButtonLink } from '@/components/ui/button';
import Link from 'next/link';
import { PageTitle } from '@/components/common/page-title';
import { SearchInput } from '@/components/common/search-input';
import Image from 'next/image';
import { snapshotData } from '@/lib/snapshot-data';
import { Container } from '@/components/layout/container';

const SnapshotPage = () => {
  return (
    <Container>
      <PageTitle current="SNAPSHOT">
        <div className="flex items-center gap-4">
          <Suspense fallback={<div className="w-full md:w-80" />}>
            <SearchInput initialValue={''} />
          </Suspense>
          <ButtonLink href="/snapshot/upload" variant="default" size="lg">
            <Plus className="size-4" /> 업로드
          </ButtonLink>
        </div>
      </PageTitle>

      {/* 2. 스냅샷 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-20">
        {snapshotData.map(snap => (
          <Link
            href={`/snapshots/${snap.id}`}
            key={snap.id}
            className="group relative block aspect-3/4 w-full overflow-hidden rounded-md bg-zinc-100 transition-all duration-300 hover:shadow-2xl hover:shadow-black/10"
          >
            <Image
              src={`/images/${snap.images[0].url}`}
              alt={`${snap.author.nickname}'s Snap`}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105" // hover 시 이미지 살짝 확대
              priority
            />

            <div className="absolute bottom-0 h-1/2 w-full bg-linear-to-t from-black/80 to-transparent" />

            <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
              <div className="space-y-3 translate-y-2 transition-transform duration-300 group-hover:translate-y-0">
                <div className="flex items-center gap-3 justify-between">
                  <p className="text-sm font-black tracking-tighter uppercase text-white/90">
                    {snap.author.nickname}
                  </p>

                  <div className="flex items-center gap-2">
                    <Heart className="size-4 text-white hover:text-red-500 transition-colors" />
                    <span className="text-sm font-bold">
                      {snap.stats.likes.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
};

export default SnapshotPage;
