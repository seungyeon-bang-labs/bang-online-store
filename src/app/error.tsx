'use client';

import { Button } from '@/shared/components/ui/button';

export default function ErrorPage() {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">정보를 불러오지 못했습니다.</h1>
      <p className="text-sm text-muted-foreground">
        잠시 후 다시 시도해주세요.
      </p>
      <Button onClick={() => window.location.reload()}>다시 시도</Button>
    </main>
  );
}
