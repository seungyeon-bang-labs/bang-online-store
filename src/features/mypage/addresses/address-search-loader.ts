'use client';

const DAUM_POSTCODE_SCRIPT_ID = 'daum-postcode-script';
const DAUM_POSTCODE_SCRIPT_URL =
  'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

let loadingPromise: Promise<void> | null = null;

function isDaumPostcodeReady(): boolean {
  return window.daum?.Postcode !== undefined;
}

function getDaumPostcodeScript(): HTMLScriptElement | null {
  return document.getElementById(
    DAUM_POSTCODE_SCRIPT_ID,
  ) as HTMLScriptElement | null;
}

function createDaumPostcodeScript(): HTMLScriptElement {
  const script = document.createElement('script');
  script.id = DAUM_POSTCODE_SCRIPT_ID;
  script.src = DAUM_POSTCODE_SCRIPT_URL;
  script.async = true;
  return script;
}

export function loadDaumPostcodeScript({
  retry = false,
}: {
  retry?: boolean;
} = {}): Promise<void> {
  if (isDaumPostcodeReady()) return Promise.resolve();

  if (retry) {
    getDaumPostcodeScript()?.remove();
    loadingPromise = null;
  }

  if (loadingPromise) return loadingPromise;

  const script = getDaumPostcodeScript() ?? createDaumPostcodeScript();
  const nextLoadingPromise = new Promise<void>((resolve, reject) => {
    script.addEventListener(
      'load',
      () => {
        if (isDaumPostcodeReady()) {
          resolve();
          return;
        }

        reject(new Error('Daum postcode script loaded without its API.'));
      },
      { once: true },
    );
    script.addEventListener('error', () => reject(), { once: true });

    if (!script.isConnected) document.head.append(script);
  }).catch(error => {
    getDaumPostcodeScript()?.remove();
    loadingPromise = null;
    throw error;
  });

  loadingPromise = nextLoadingPromise;
  return nextLoadingPromise;
}
