/* 情境清單、切換與啟動 */
Object.assign(SCENES.me, { tag: 'F-06' });
/* v13：左邊清單的第一層對齊手機下方的分頁（首頁｜地圖｜CityGPT｜憑證夾｜我的），只有地圖、CityGPT 有第二層。
   [情境 id, 是否第二層]。主動通知不是分頁，放在最後。 */
const NAV = [['home', 0], ['f1', 0], ['f3', 1], ['ask', 0], ['go', 1], ['photo', 1], ['play', 1], ['lost', 1], ['wallet', 0], ['me', 0], ['f5', 0]];
/* 不在清單上、但仍能從畫面點進去的情境：側欄高亮它所屬的那一項 */
const NAV_ALIAS = { quest: 'f1', f2: 'wallet' };
const $nav = document.getElementById('sideNav');
$nav.innerHTML = NAV.map(([id, sub]) => {
  const s = SCENES[id];
  const hot = s.tag.includes('★') || s.tag.includes('新');
  return `<button class="nav-it${sub ? ' sub' : ''}" data-s="${id}"><span class="no">${s.no}</span>${s.title}<span class="tag${hot ? ' new' : ''}">${s.tag}</span></button>`;
}).join('');
$nav.addEventListener('click', (e) => { const b = e.target.closest('[data-s]'); if (b) go(b.dataset.s); });

function go(id, opts = {}) {
  gen++;
  cleanups.forEach(f => { try { f(); } catch (_) { /* 已移除的節點 */ } }); cleanups = [];
  document.querySelectorAll('.coach-tip').forEach(t => t.remove());
  current = id; const sc = SCENES[id];
  if (id !== 'home') CITY_SHORT = '高雄';
  [...$nav.querySelectorAll('.nav-it')].forEach(b => b.classList.toggle('on', b.dataset.s === (NAV_ALIAS[id] || id)));
  document.getElementById('sideNote').innerHTML = sc.note;
  $phone.classList.remove('shake');
  const ctx = sc.render(opts);
  if (sc.flow) sc.flow(ctx).catch(e => { if (e !== STOP) console.error(e); });
}
/* 手機內：底部分頁、出門頁的路線／活動切換 */
$screen.addEventListener('click', (e) => {
  const sg = e.target.closest('[data-seg]'); if (sg) { if (sg.dataset.seg !== current) go(sg.dataset.seg); return; }
  const t = e.target.closest('[data-tab]'); if (t && SCENES[t.dataset.tab] && t.dataset.tab !== current) go(t.dataset.tab);
});
document.getElementById('btnReplay').onclick = () => go(current);
/* v8：等 Google 地圖載入（或確定載不到）再開第一個畫面；金鑰中途失效就退回示意底圖 */
document.addEventListener('gm-fail', () => { GM.ok = false; go(current); });
/* 左側顯示目前地圖來源，一眼就知道是不是 Google 地圖 */
function mapBadge() {
  let b = document.getElementById('mapSrc');
  if (!b) { b = document.createElement('div'); b.id = 'mapSrc'; b.className = 'map-src'; document.querySelector('.side-ctrl').after(b); }
  b.innerHTML = GM.ok
    ? '🗺️ 地圖來源：<b>Google 地圖</b>'
    : `⚠️ 地圖來源：<b>示意地圖</b><br><span>Google 地圖沒有載入成功，請重新整理</span>`;
  b.classList.toggle('bad', !GM.ok);
  /* 頁尾的地圖著作權跟著實際載入的底圖走：Google 地圖成功才寫 Google，退回示意地圖才寫 OpenStreetMap */
  const cr = document.getElementById('mapCredit');
  if (cr) cr.textContent = GM.ok ? '地圖 © Google' : '地圖 © OpenStreetMap contributors';
}
document.addEventListener('gm-fail', mapBadge);
GM.ready.then(() => { mapBadge(); go(SCENES[Q.get('s')] ? Q.get('s') : 'home'); });
