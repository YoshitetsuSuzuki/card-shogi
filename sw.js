/**
 * カード将棋 Service Worker
 * 役割1: COOP/COEP ヘッダーの付与（GitHub Pages では設定できないため）。
 *        SharedArrayBuffer（やねうら王・Fairy-Stockfish のスレッド）に必須。
 * 役割2: オフラインキャッシュ（PWA）。同一オリジンのアセットを保存し、
 *        圏外でもCPU対戦・ふたりで対戦が動くようにする。
 */
const CACHE = 'card-shogi-v3';

/** エンジンのバイナリ（水匠5評価28MB・wasm等）は不変。キャッシュ優先で再取得しない
 *  （非ハッシュ資産の裏側再取得で毎回28MBを再DLしないため）。更新時は CACHE 版を上げる。 */
function isImmutableEngineAsset(pathname) {
  return /\/engine(-hk|2)?\//.test(pathname);
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

function withCoiHeaders(response) {
  if (!response || response.status === 0) return response; // opaque はそのまま
  const headers = new Headers(response.headers);
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function handleNavigation(request) {
  const cache = await caches.open(CACHE);
  try {
    // ページ本体はネットワーク優先（更新を確実に配る）
    const fresh = await fetch(request);
    if (fresh.ok) cache.put('./index.html', fresh.clone());
    return withCoiHeaders(fresh);
  } catch {
    const cached = (await cache.match(request)) || (await cache.match('./index.html'));
    return cached ? withCoiHeaders(cached) : Response.error();
  }
}

async function handleAsset(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const pathname = new URL(request.url).pathname;
  // ハッシュ付き資産・エンジンバイナリはキャッシュ優先で固定（裏側再取得しない）。
  const isImmutable = pathname.includes('/assets/') || isImmutableEngineAsset(pathname);
  // 注意: ワーカースクリプト（やねうら王のスレッド等）にも COOP/COEP が必要。
  // 同一オリジンの応答すべてにヘッダーを付与する（本家 coi-serviceworker と同方式）
  if (cached && isImmutable) return withCoiHeaders(cached);
  if (cached) {
    // エンジン・アイコン等（URL据え置き）は表示はキャッシュ、裏で更新確認
    fetch(request)
      .then((res) => { if (res.ok) cache.put(request, res.clone()); })
      .catch(() => {});
    return withCoiHeaders(cached);
  }
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return withCoiHeaders(response);
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }
  const url = new URL(request.url);
  if (url.origin === location.origin) {
    event.respondWith(handleAsset(request));
  }
  // クロスオリジン（Google Fonts等）はブラウザに任せる
});
