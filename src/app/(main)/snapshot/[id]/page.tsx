import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Container } from '@/shared/components/layout/container';
import { PageTitle } from '@/shared/components/common/page-title';
import { snapshotRepository } from '@/domains/snapshot';

async function SnapshotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const snapshot = await snapshotRepository.findById(id);

  if (!snapshot) notFound();

  return (
    <Container>
      <PageTitle current="SNAPSHOT" className="hidden md:flex" />

      <article className="grid gap-8 md:grid-cols-[minmax(0,1fr)_360px]">
        <div className="relative aspect-3/4 overflow-hidden rounded-md bg-zinc-100">
          <Image
            src={`/images/${snapshot.images[0].url}`}
            alt={`${snapshot.author.nickname}'s Snap`}
            fill
            sizes="(max-width: 768px) 100vw, 60vw"
            className="object-cover"
            priority
          />
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm font-bold text-zinc-500">작성자</p>
            <h1 className="mt-1 text-2xl font-black">
              {snapshot.author.nickname}
            </h1>
          </div>

          <p className="text-sm leading-7 text-zinc-700">{snapshot.content}</p>

          <dl className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-md bg-zinc-100 p-3">
              <dt className="text-xs text-zinc-500">좋아요</dt>
              <dd className="font-bold">{snapshot.stats.likes}</dd>
            </div>
            <div className="rounded-md bg-zinc-100 p-3">
              <dt className="text-xs text-zinc-500">댓글</dt>
              <dd className="font-bold">{snapshot.stats.comments}</dd>
            </div>
            <div className="rounded-md bg-zinc-100 p-3">
              <dt className="text-xs text-zinc-500">조회</dt>
              <dd className="font-bold">{snapshot.stats.views}</dd>
            </div>
          </dl>
        </div>
      </article>
    </Container>
  );
}

export default SnapshotDetailPage;
