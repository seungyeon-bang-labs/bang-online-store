const MAX_DEVELOPMENT_DELAY_MS = 30_000;
const MYPAGE_LOADING_DELAY_ENV_KEY = 'MYPAGE_LOADING_DELAY_MS';

function getMypageLoadingDelayMs(): number {
  if (process.env.NODE_ENV !== 'development') {
    return 0;
  }

  const delayMs = Number(process.env[MYPAGE_LOADING_DELAY_ENV_KEY]);

  if (!Number.isFinite(delayMs) || delayMs <= 0) {
    return 0;
  }

  return Math.min(Math.floor(delayMs), MAX_DEVELOPMENT_DELAY_MS);
}

export async function waitForMypageLoadingForDevelopment(): Promise<void> {
  const delayMs = getMypageLoadingDelayMs();

  if (delayMs === 0) {
    return;
  }

  await new Promise<void>((resolve) => {
    setTimeout(resolve, delayMs);
  });
}
