/**
 * Service Worker の登録（本番のみ）。
 * 開発サーバー（vite）は COOP/COEP ヘッダーを直接送るため SW 不要。
 * 初回訪問時は SW がまだフェッチを仲介していないため、
 * SharedArrayBuffer を有効にするべく一度だけ自動リロードする（coi-serviceworker と同じ方式）。
 */
(function () {
  if (!('serviceWorker' in navigator)) return;
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;

  navigator.serviceWorker.register('./sw.js').then(function (reg) {
    if (window.crossOriginIsolated) return;
    if (sessionStorage.getItem('coi-reloaded')) return;
    sessionStorage.setItem('coi-reloaded', '1');
    if (navigator.serviceWorker.controller) {
      location.reload();
    } else {
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        location.reload();
      }, { once: true });
      // 念のため: activate 済みなのに controllerchange が来ない場合
      if (reg.active) setTimeout(function () { location.reload(); }, 800);
    }
  }).catch(function () { /* SW不可の環境ではオンライン時のみ動作 */ });
})();
