/* v8：把 F-01、F-03、F-05、對話小地圖接上真實 Google 地圖。
   做法是包住原本的 render／動作函式：GM.ok 時換成 Google 地圖，否則原樣（示意底圖）執行。 */
const POI_LL = {   // F-03 各地點座標（示意地點以「（示意）」標註）
  evt: [{ lat: 22.6200, lng: 120.2853 }, { lat: 22.6203, lng: 120.2815 }, { lat: 22.6192, lng: 120.2782 }],
  spot: [{ lat: 22.6205, lng: 120.2817 }, { lat: 22.6170, lng: 120.2808 }, { lat: 22.6256, lng: 120.2870 }],
  gov: [{ lat: 22.6262, lng: 120.2838 }, { lat: 22.6249, lng: 120.2842 }, { lat: 22.6228, lng: 120.2885 }],
  road: [{ lat: 22.6265, lng: 120.2880 }, { lat: 22.6238, lng: 120.2860 }],
};
/* 施工封閉段（示意）：起點、終點；替代路線的目的地 */
const ROAD_SEG = [
  { a: { lat: 22.6266, lng: 120.2858 }, b: { lat: 22.6264, lng: 120.2902 }, to: { lat: 22.6268, lng: 120.2925 } },
  { a: { lat: 22.6222, lng: 120.2860 }, b: { lat: 22.6255, lng: 120.2861 }, to: { lat: 22.6272, lng: 120.2866 } },
];
const pinHTML = (color, ic, lab) => `<div class="pin" style="position:relative"><b style="background:${color}"><span>${ic}</span></b>${lab ? `<div class="lab">${lab}</div>` : ''}</div>`;

/* 把畫面裡 .map 的背景圖換成 Google 地圖 */
function mountGMap(center, zoom) {
  const m = $screen.querySelector('.map');
  m.style.backgroundImage = 'none'; m.innerHTML = '<div class="gmap"></div>';
  return gMap(m.firstChild, center, zoom);
}

/* ---------- F-01 地圖路徑與即時動態 ---------- */
(function () {
  const sc = SCENES.f1, r0 = sc.render;
  sc.note = sc.note.replace('資料：iBus+ 動態、TDX。', '資料：iBus+ 動態、TDX。地圖：Google 地圖（示意路線）。');
  sc.render = function (opts) {
    const st = r0.call(this, opts);
    if (!GM.ok) return st;
    const map = mountGMap({ lat: 22.6735, lng: 120.3125 }, 15);
    meMarker(map, LL.juDan);
    $screen.querySelectorAll('.src').forEach(s => s.innerHTML = s.innerHTML.replace('地圖 © OpenStreetMap', '地圖 © Google'));
    /* 換掉輸入目的地與即時到站兩個動作，其他（乘車碼、上車）沿用 */
    let path = null;
    P.$('qline').onclick = async () => {
      if (st.routed || st.busy) return; st.busy = true;
      P.$('ph').textContent = ''; await typeT(P.$('q'), '高雄榮總', 180).catch(() => {});
      let r = await gRoute(LL.juDan, LL.vgh, 'TRANSIT');
      if (r.via === 'straight') r = await gRoute(LL.juDan, LL.vgh, 'DRIVING');
      path = r.path; drawRoute(map, path, '#2346D8');
      htmlMarker(map, LL.vgh, pinHTML('#2346D8', '🏥', '高雄榮總'));
      await sleep(500).catch(() => {}); on(P.$('sheet'));
      st.routed = true; st.busy = false;
    };
    P.$('best').onclick = async () => {
      if (!st.routed || st.live) return; st.live = true;
      const tail = path.slice(Math.floor(path.length * 0.5));
      moveAlong(map, tail, '<div style="transform:translateY(50%);width:22px;height:22px;border-radius:50%;background:#141A2E;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;font-size:11px">🚌</div>', 3000);
      for (const t of ['2 分鐘後到站', '1 分鐘後到站', '即將進站']) { await sleep(900).catch(() => {}); if (P.$('eta')) P.$('eta').textContent = t; }
    };
    return st;
  };
})();

/* ---------- F-03 活動・景點・市政服務 ---------- */
(function () {
  const sc = SCENES.f3, r0 = sc.render;
  sc.render = function (opts) {
    const ctx = r0.call(this, Object.assign({}, opts, { cat: null }));
    if (!GM.ok) { if (opts && opts.cat) later(() => ctx.showCat(opts.cat), 300); ctx.opts = opts || {}; return ctx; }
    const map = mountGMap({ lat: 22.6225, lng: 120.2845 }, 16);
    meMarker(map, LL.yanchengMRT);
    $screen.querySelectorAll('.body > .me-dot').forEach(d => d.remove());
    P.$('navsvg').style.display = 'none';
    let pins = [], lines = [];
    const clearAll = () => { clearLines(lines); lines = []; };
    /* 類別：地圖上的圖釘改放在真實座標 */
    const show0 = ctx.showCat;
    ctx.showCat = (k) => {
      show0(k); P.$('pins').innerHTML = '';
      pins.forEach(p => p.setMap(null)); pins = []; clearAll();
      const c = CATS[k];
      c.items.forEach((it, i) => pins.push(htmlMarker(map, POI_LL[k][i], pinHTML(c.color, it.ic, it.t.replace('（示意）', '')), () => ctx.showItem(i))));
      const b = new google.maps.LatLngBounds(); POI_LL[k].forEach(p => b.extend(p)); b.extend(LL.yanchengMRT);
      map.fitBounds(b, { top: 170, bottom: 330, left: 50, right: 50 });
    };
    const end0 = ctx.endNav;
    ctx.endNav = () => { end0(); clearAll(); };
    /* 帶我去：真實步行路線 */
    ctx.startNav = async (it, c) => {
      const i = CATS[ctx.cat].items.indexOf(it), to = POI_LL[ctx.cat][i];
      const r = await gRoute(LL.yanchengMRT, to, 'WALKING');
      clearAll(); lines = drawRoute(map, r.path, c.color);
      const min = r.min || it.min, km = r.km || (it.min * 0.08).toFixed(1);
      P.$('navtop').innerHTML = `🚶 <b>步行導航中</b>　前往 ${it.t.replace('（示意）', '')}<div class="small" style="color:#AEBBDD;margin-top:3px">約 ${min} 分鐘 · ${km} 公里</div>`;
      P.$('navbot').innerHTML = `<div class="grab"></div><div class="row"><b style="font-size:15px">約 ${min} 分鐘 · ${km} 公里</b><span class="pill p-green" style="margin-left:auto">步行</span></div>
        <div class="small mt6">抵達後會自動結束導航</div><div class="btn btn-ghost mt10" data-k="endnav" style="cursor:pointer">結束導航</div>`;
      P.$('card').classList.remove('in'); on(P.$('navtop')); on(P.$('navbot')); ctx.nav = true;
      P.$('endnav').onclick = () => { ctx.endNav(); on(P.$('card')); };
    };
    /* 施工：紅色虛線封閉段＋避開它的替代路線 */
    ctx.startAlt = async (it) => {
      const i = CATS.road.items.indexOf(it), seg = ROAD_SEG[i];
      clearAll();
      lines = drawRoute(map, [toLL(seg.a), toLL(seg.b)], '#C2410C', { dashed: true, fit: false, animate: false });
      const r = await gRoute(LL.yanchengMRT, seg.to, 'DRIVING');
      lines = lines.concat(drawRoute(map, r.path, '#2346D8'));
      P.$('navtop').innerHTML = `🔀 <b>已幫你改走替代路線</b><div class="small" style="color:#AEBBDD;margin-top:3px">紅色虛線是施工封閉段${r.min ? ` · 約 ${r.min} 分鐘` : ''}</div>`;
      P.$('navbot').innerHTML = `<div class="grab"></div><b style="font-size:15px">${it.t.replace('（示意）', '')}</b><div class="small mt6">${it.d}</div>
        <div class="row mt8" style="gap:8px"><span class="pill p-orange">影響公車：紅 21、50（示意）</span></div>
        <div class="btn btn-green mt10" data-k="endnav" style="cursor:pointer">開始導航（替代路線）</div>`;
      P.$('card').classList.remove('in'); on(P.$('navtop')); on(P.$('navbot')); ctx.nav = true;
      P.$('endnav').onclick = () => { P.$('navtop').innerHTML = '🧭 <b>導航中 · 替代路線</b><div class="small" style="color:#AEBBDD;margin-top:3px">避開施工段，沿藍色路線前進</div>'; P.$('endnav').textContent = '結束導航'; P.$('endnav').onclick = () => { ctx.endNav(); on(P.$('card')); }; };
    };
    /* 重新綁定類別按鈕（原本綁的是舊的 showCat） */
    $screen.querySelectorAll('[data-mc]').forEach(s => s.onclick = () => (s.dataset.mc === 'route' ? go('f1') : ctx.showCat(s.dataset.mc)));
    if (opts && opts.cat) later(() => ctx.showCat(opts.cat), 400);
    ctx.opts = opts || {};
    return ctx;
  };
})();

/* ---------- F-05 導航卡：開車到地勢較高的停車場 ---------- */
(function () {
  const sc = SCENES.f5, f0 = sc.flow;
  sc.flow = async function (ctx) {
    if (GM.ok) {
      const card = P.$('navc'), mp = card.querySelector('.mp');
      const obs = new MutationObserver(async () => {
        if (!card.classList.contains('in') || mp.dataset.g) return; mp.dataset.g = 1;
        mp.style.backgroundImage = 'none'; mp.innerHTML = '<div class="gmap"></div>';
        const map = gMap(mp.firstChild, LL.dingshan, 15);
        meMarker(map, LL.dingshan);
        htmlMarker(map, LL.dingshanPark, pinHTML('#2346D8', '🅿️', ''));
        const r = await gRoute(LL.dingshan, LL.dingshanPark, 'DRIVING');
        drawRoute(map, r.path, '#2346D8');
        map.fitBounds(new google.maps.LatLngBounds().extend(LL.dingshan).extend(LL.dingshanPark), 30);
      });
      obs.observe(card, { attributes: true, attributeFilter: ['class'] }); cleanups.push(() => obs.disconnect());
    }
    return f0.call(this, ctx);
  };
})();

/* ---------- 對話裡的小地圖（找東西問市政：導航到派出所） ---------- */
(function () {
  const m0 = Chat.prototype.map;
  Chat.prototype.map = function (o) {
    const node = m0.call(this, o);
    if (!GM.ok) return node;
    node.style.backgroundImage = 'none';
    node.querySelector('svg').remove();
    node.querySelector('.attr').textContent = '© Google';
    const g = el('<div class="gmap"></div>'); node.prepend(g);
    const map = gMap(g, LL.police, 15);
    meMarker(map, LL.juDan);
    htmlMarker(map, LL.police, pinHTML('#2346D8', '🚓', ''));
    gRoute(LL.juDan, LL.police, 'TRANSIT').then(r => (r.via === 'straight' ? gRoute(LL.juDan, LL.police, 'DRIVING') : r)).then(r => {
      drawRoute(map, r.path, '#2346D8', { fit: false });
      map.fitBounds(new google.maps.LatLngBounds().extend(LL.juDan).extend(LL.police), { top: 50, bottom: 40, left: 30, right: 30 });
    });
    return node;
  };
})();
