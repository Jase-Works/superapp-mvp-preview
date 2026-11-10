/* City Super APP · 第一版 MVP 互動示意 v2
   展示方式改成 demo_mockup_v2 的做法：沒有自動播放，使用者點畫面推進。
   - 畫面情境（首頁、出門、乘車碼、主動通知）：下一步要點的地方會亮起，旁邊有一句提示。
   - 對話情境（CityGPT）：AI 一則一則回，使用者點選項或按鈕往下走。
   天氣、案號、人名、店家、跨城介接皆為示意。 */
const IMG = 'img/';
const Q = new URLSearchParams(location.search);
const STOP = Symbol('stop');
const $phone = document.getElementById('phone');
const $screen = document.getElementById('screen');
const $hint = document.getElementById('hint');
const PAUSED = false;
let gen = 0;            // 世代編號：換情境時 +1，舊流程的等待會自動中止
let current = null;
let cleanups = [];

const SB = (light) => `<div class="sb${light ? ' light' : ''}">9:41<span>▮▮▮ ᯤ 🔋</span></div>`;
const el = (html) => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; };
const later = (fn, ms) => { const t = setTimeout(fn, ms); cleanups.push(() => clearTimeout(t)); };
const on = (e) => e && e.classList.add('in');
/* 會被換情境中止的 sleep */
const sleep = (ms) => { const g = gen; return new Promise((res, rej) => setTimeout(() => (g === gen ? res() : rej(STOP)), ms)); };
const P = { $(k) { return $screen.querySelector(`[data-k="${k}"]`); } };

/* setTimeout 驅動的平滑捲動（原生 smooth scroll 在背景分頁會停住） */
function animScroll(elm, prop, to, ms, done) {
  const from = elm[prop], t0 = Date.now();
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const stepFn = () => {
    const t = Math.min(1, (Date.now() - t0) / ms);
    elm[prop] = from + (to - from) * ease(t);
    if (t < 1) setTimeout(stepFn, 16); else if (done) done();
  };
  stepFn();
}
/* 可重現的假 QR 圖樣 */
function qrCells(seed) {
  const n = 25; let s = seed; const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const out = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const inF = (a, b) => a >= 0 && a < 7 && b >= 0 && b < 7;
    const f = [[r, c], [r, c - (n - 7)], [r - (n - 7), c]].find(([a, b]) => inF(a, b));
    let o;
    if (f) { const [a, b] = f; o = a === 0 || a === 6 || b === 0 || b === 6 || (a >= 2 && a <= 4 && b >= 2 && b <= 4); }
    else o = rnd() < 0.48;
    out.push(`<i class="${o ? 'on' : ''}"></i>`);
  }
  return out.join('');
}

/* ---------- 下一步提示：讓某個元素亮起＋一句提示，點了才往下走 ---------- */
function tapOn(target, text) {
  const g = gen;
  return new Promise((res, rej) => {
    if (!target) return res();
    target.classList.add('coach');
    let tip = null;
    if (text) {
      tip = el(`<div class="coach-tip">${text}</div>`);
      $phone.appendChild(tip);
      const r = target.getBoundingClientRect(), pr = $phone.getBoundingClientRect();
      const cx = r.left - pr.left + r.width / 2;
      const up = r.top - pr.top > 120;   // 目標上方有空間就放上面
      const w = tip.offsetWidth;
      const left = Math.max(16, Math.min(pr.width - w - 16, cx - w / 2));
      tip.style.left = left + 'px';
      tip.style.setProperty('--ax', (cx - left) + 'px');
      if (up) { tip.classList.add('up'); tip.style.top = (r.top - pr.top - tip.offsetHeight - 10) + 'px'; }
      else { tip.classList.add('down'); tip.style.top = (r.bottom - pr.top + 10) + 'px'; }
      requestAnimationFrame(() => tip.classList.add('in'));
      setTimeout(() => tip.classList.add('in'), 30);
    }
    const clear = () => { target.classList.remove('coach'); if (tip) tip.remove(); target.removeEventListener('click', h, true); };
    const h = (e) => { e.stopPropagation(); clear(); g === gen ? res() : rej(STOP); };
    target.addEventListener('click', h, true);
    cleanups.push(clear);
  });
}
/* v5 引導：按鈕本身都有真的功能；引導只負責「亮起＋提示」，
   直到 cond() 成立才進下一步。使用者不照提示、點別的地方，也不會卡住或點了沒反應。
   target 可傳元素或回傳元素的函式（畫面會變，每次重新找）。 */
async function guide(target, text, cond) {
  const g = gen;
  let cur = null, tip = null;
  const clear = () => { if (cur) cur.classList.remove('coach'); if (tip) tip.remove(); cur = null; tip = null; };
  cleanups.push(clear);
  const place = (t) => {
    clear(); if (!t) return;
    /* 目標不在畫面上（被收起的抽屜、捲出畫面）就先不提示，等它回來再亮 */
    const vr = t.getBoundingClientRect(), vp = $screen.getBoundingClientRect();
    if (!vr.width || vr.top > vp.bottom - 70 || vr.bottom < vp.top + 10) return;
    cur = t; t.classList.add('coach');
    if (!text) return;
    tip = el(`<div class="coach-tip">${text}</div>`); $phone.appendChild(tip);
    const r = t.getBoundingClientRect(), pr = $phone.getBoundingClientRect();
    const cx = r.left - pr.left + r.width / 2, w = tip.offsetWidth;
    const left = Math.max(16, Math.min(pr.width - w - 16, cx - w / 2));
    tip.style.left = left + 'px'; tip.style.setProperty('--ax', (cx - left) + 'px');
    if (r.top - pr.top > 120) { tip.classList.add('up'); tip.style.top = (r.top - pr.top - tip.offsetHeight - 10) + 'px'; }
    else { tip.classList.add('down'); tip.style.top = (r.bottom - pr.top + 10) + 'px'; }
    setTimeout(() => tip && tip.classList.add('in'), 30);
  };
  let last = null, lastTop = null;
  while (!cond()) {
    if (g !== gen) { clear(); throw STOP; }
    const t = typeof target === 'function' ? target() : target;
    const top = t ? Math.round(t.getBoundingClientRect().top) : null;
    if (t !== last || top !== lastTop) { place(t); last = t; lastTop = top; }
    await new Promise(r => setTimeout(r, 150));
  }
  clear();
  if (g !== gen) throw STOP;
}
/* 非阻擋式提示（首頁、憑證夾這類自由操作的畫面）：顯示幾秒或使用者一碰就消失 */
function softTip(target, text, ms = 4500) {
  if (!target) return;
  const tip = el(`<div class="coach-tip">${text}</div>`); $phone.appendChild(tip);
  const r = target.getBoundingClientRect(), pr = $phone.getBoundingClientRect();
  const cx = r.left - pr.left + r.width / 2, w = tip.offsetWidth;
  const left = Math.max(16, Math.min(pr.width - w - 16, cx - w / 2));
  tip.style.left = left + 'px'; tip.style.setProperty('--ax', (cx - left) + 'px');
  tip.classList.add('up'); tip.style.top = (r.top - pr.top - tip.offsetHeight - 10) + 'px';
  setTimeout(() => tip.classList.add('in'), 30);
  const kill = () => tip.remove();
  setTimeout(kill, ms); $screen.addEventListener('pointerdown', kill, { once: true }); cleanups.push(kill);
}

/* ---------- 對話引擎（參考 demo_mockup_v2 的 Chat，class 改 c- 前綴） ---------- */
class Chat {
  constructor(mount) { this.box = mount; this.c = el('<div class="c-chat"></div>'); mount.appendChild(this.c); }
  _add(node) { this.c.appendChild(node); const s = this.box; later(() => animScroll(s, 'scrollTop', s.scrollHeight, 260), 30); return node; }
  user(text) { return this._add(el(`<div class="c-msg user">${text}</div>`)); }
  async ai(html, tag = 'CityGPT', src = '') {
    const t = this._add(el('<div class="c-typing"><i></i><i></i><i></i></div>'));
    await sleep(780); t.remove();
    this._add(el(`<div class="c-msg ai"><span class="tag">${tag}</span>${html}${src ? `<span class="src">資料：${src}</span>` : ''}</div>`));
    await sleep(240);
  }
  card(html, cls = '') { return this._add(el(`<div class="c-card ${cls}">${html}</div>`)); }
  push(ic, t, b, style = '') { return this._add(el(`<div class="c-push" style="${style}"><div class="ic">${ic}</div><div><div class="t">${t}</div><div class="b">${b}</div></div></div>`)); }
  choose(opts) {
    const g = gen;
    return new Promise((res, rej) => {
      const row = el('<div class="c-chips"></div>');
      opts.forEach(o => { const c = el(`<span class="c-chip">${o.label}</span>`);
        c.onclick = () => { row.remove(); this.user(o.say || o.label); g === gen ? res(o.value) : rej(STOP); };
        row.appendChild(c); });
      this._add(row);
    });
  }
  button(label) {
    const g = gen;
    return new Promise((res, rej) => {
      const b = el(`<button class="c-btn">${label}</button>`);
      b.onclick = () => { b.disabled = true; g === gen ? res() : rej(STOP); };
      this._add(b);
    });
  }
  photo(src, mk = 'AI 示意圖') { return this._add(el(`<div class="c-photo"><img src="${src}" alt=""><span class="mk">${mk}</span></div>`)); }
  async done(t, s) { await sleep(150); this._add(el(`<div class="c-done"><div class="cir"><svg viewBox="0 0 48 48"><path d="M 12 25 L 20 33 L 36 15"/></svg></div><div class="t">${t}</div><div class="s">${s}</div></div>`)); await sleep(500); }
  async prog(steps) {
    const box = this._add(el(`<div class="c-prog">${steps.map((s, i) => `<div class="st"><i>${i + 1}</i>${s}</div>`).join('')}</div>`));
    for (const st of box.children) { await sleep(480); st.classList.add('on'); }
  }
  async gap(text) { await sleep(400); this._add(el(`<div class="c-gap"><span>⏱ ${text}</span></div>`)); await sleep(400); }
  ticket(b1, b2, b3, seed = 11) { return this._add(el(`<div class="c-ticket"><div class="b1">${b1}</div><div class="b2">${b2}</div><div class="b3">${b3}</div><div class="c-qr">${qrCells(seed)}</div></div>`)); }
  map({ img = 'osm_sanmin.jpg', bar, eta, route = 'M 40 170 L 40 120 L 220 120 L 220 60 L 300 60' }) {
    return this._add(el(`<div class="c-map" style="background-image:url('${IMG}${img}')">
      <svg viewBox="0 0 340 200" preserveAspectRatio="none"><path d="${route}" stroke="#13235A" stroke-opacity=".3" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path class="line" pathLength="1" d="${route}" stroke="#2346D8" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <div class="bar">🧭 ${bar}</div><div class="eta">${eta}</div><div class="attr">© OpenStreetMap</div></div>`));
  }
}
/* 對話畫面外框：標題＋可捲動對話區＋輸入列（裝飾）＋底部分頁 */
function chatShell(title, sub, tabOn = 'ASK') {
  $screen.innerHTML = `${SB()}
    <div class="c-wrap">
      <div class="c-head">${current !== 'ask' ? '<span class="c-back" data-k="back">‹ CityGPT</span>' : ''}<div class="c-title"><small>${sub}</small>${title}</div></div>
      <div class="c-scroll" data-k="cs"></div>
      <div class="c-input"><div class="box">說說看，或拍照…</div><div class="mic">🎙️</div></div>
    </div>${tabs(tabOn)}`;
  const back = P.$('back'); if (back) back.onclick = () => go('ask');
  return new Chat(P.$('cs'));
}

/* ---------- 底部分頁：首頁｜地圖｜CityGPT（中間 AI）｜憑證夾｜我的 ----------
   中間 AI 的名字集中在 ASK_NAME，要換名字改這一行。備選：小城、CityGPT。 */
const ASK_NAME = 'CityGPT';
let CITY_SHORT = '高雄';
const ASK_SVG = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="currentColor" d="M12 2.5l1.9 5.6 5.6 1.9-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9zM18.5 15l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z"/></svg>';
const TABS = [['home', '🏠', '首頁'], ['f1', '🗺️', '地圖'], ['ask', '', 'ASK'], ['wallet', '🪪', '憑證夾'], ['me', '👤', '我的']];
const tabs = (onTab, cls = '') => `<div class="tabs ${cls}">${TABS.map(([id, i, t]) => t === 'ASK'
  ? `<div class="ask${onTab === 'ASK' ? ' on' : ''}" data-tab="${id}" style="cursor:pointer"><i>${ASK_SVG}</i><span data-ask>${ASK_NAME}</span></div>`
  : `<div class="${t === onTab ? 'on' : ''}" data-tab="${id}" style="cursor:pointer"><i>${i}</i>${t}</div>`).join('')}</div>`;
const goSeg = (which, top) => `<div class="seg" style="top:${top}px"><span class="${which === 'route' ? 'on' : ''}" data-seg="f1">🧭 路線</span><span class="${which === 'poi' ? 'on' : ''}" data-seg="f3">🎪 活動・景點</span></div>`;

/* 跨情境的示意狀態：在「一句話玩高雄」報名後，「我的」會跟著變 */
const STATE = { pier2: false, yancheng: false };

const SCENES = {};
const ORDER = [];
const def = (s) => { SCENES[s.id] = s; ORDER.push(s.id); };
