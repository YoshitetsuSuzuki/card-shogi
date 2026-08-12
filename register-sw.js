/**
 * Service Worker の登録（本番のみ）。
 * 開発サーバー（vite）は COOP/COEP ヘッダーを直接送るため SW 不要。
 * 初回訪問時は SW がまだフェッチを仲介していないため、
 * SharedArrayBuffer を有効にするべく一度だけ自動リロードする（coi-serviceworker と同じ方式）。
 * 診断: 登録の結果を window.__swDiag に記録し、エンジンバッジに表示する
 * （iOSのプライベートブラウズ/ロックダウン等で SW が使えない環境を特定するため）。
 */
(function () {
  window.__swDiag = '初期化中';
  if (!('serviceWorker' in navigator)) {
    // iOSのロックダウンモード等では serviceWorker API 自体が存在しない
    window.__swDiag = 'SW-API無し(ﾛｯｸﾀﾞｳﾝ/旧iOS?)';
    return;
  }
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    window.__swDiag = 'dev(SW不要)';
    return;
  }

  // プライベートブラウズでは sessionStorage の書き込みが例外を投げる環境があるため保護
  var alreadyReloaded = false;
  try { alreadyReloaded = !!sessionStorage.getItem('coi-reloaded'); } catch (e) { /* 無視 */ }
  function markReloaded() {
    try { sessionStorage.setItem('coi-reloaded', '1'); } catch (e) { /* 無視 */ }
  }

  navigator.serviceWorker.register('./sw.js').then(function (reg) {
    window.__swDiag = '登録OK';
    if (window.crossOriginIsolated) return;
    if (alreadyReloaded) { window.__swDiag = '登録OK/COI未達'; return; }
    if (navigator.serviceWorker.controller) {
      markReloaded();
      location.reload();
      return;
    }
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      markReloaded();
      location.reload();
    }, { once: true });
    // 念のため: activate 済みなのに controllerchange が来ない場合
    if (reg.active) setTimeout(function () { markReloaded(); location.reload(); }, 800);
    // 保険: 5秒待っても制御が始まらないが SW は活きている場合、一度だけリロード
    setTimeout(function () {
      if (!navigator.serviceWorker.controller && (reg.active || reg.waiting)) {
        markReloaded();
        location.reload();
      }
    }, 5000);
  }).catch(function (e) {
    // プライベートブラウズ等では register が SecurityError で失敗する
    window.__swDiag = '登録失敗:' + (e && e.name ? e.name : String(e).slice(0, 30));
  });
})();
