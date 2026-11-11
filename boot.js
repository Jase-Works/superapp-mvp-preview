/* 情境清單、切換與啟動 */
Object.assign(SCENES.home, { grp: '一個 App 走遍城市' });
Object.assign(SCENES.wallet, { grp: '一個 App 走遍城市' });
Object.assign(SCENES.me, { grp: '主動通知與我的', tag: 'F-06' });
const NAV = ['home', 'wallet', 'f2', 'f1', 'f3', 'quest', 'ask', 'go', 'photo', 'play', 'lost', 'f5', 'me'];

const $nav = document.getElementById('sideNav');
let lastGrp = '';
$nav.innerHTML = NAV.map(id => {
  const s = SCENES[id];
  const head = s.grp !== lastGrp ? `<div class="nav-grp">${s.grp}</div>` : ''; lastGrp = s.grp;
  const hot = s.tag.includes('★') || s.tag.includes('新');
  return `${head}<button class="nav-it" data-s="${id}"><span class="no">${s.no}</span>${s.title}<span class="tag${hot ? ' new' : ''}">${s.tag}</span></button>`;
}).join('');
$nav.addEventListener('click', (e) => { const b = e.target.closest('[data-s]'); if (b) go(b.dataset.s); });

function go(id, opts = {}) {
  gen++;
  cleanups.forEach(f => { try { f(); } catch (_) { /* 已移除的節點 */ } }); cleanups = [];
  document.querySelectorAll('.coach-tip').forEach(t => t.remove());
  current = id; const sc = SCENES[id];
  if (id !== 'home') CITY_SHORT = '高雄';
  [...$nav.querySelectorAll('.nav-it')].forEach(b => b.classList.toggle('on', b.dataset.s === id));
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
}
document.addEventListener('gm-fail', mapBadge);
GM.ready.then(() => { mapBadge(); go(SCENES[Q.get('s')] ? Q.get('s') : 'home'); });
