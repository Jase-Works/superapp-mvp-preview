/* 出門（地圖路徑、乘車碼、活動・景點）與主動通知：畫面情境，點亮起來的地方往下走。
   v3：每條故事線結尾都接到下一步，不停在 toast。 */
async function typeT(elm, text, speed = 170) { elm.textContent = ''; for (const ch of text) { elm.textContent += ch; await sleep(speed); } }
/* 乘車碼倒數：回傳停止函式 */
function runQR(root, seed = 7) {
  let n = 30;
  const q = root.querySelector('[data-k="qr"]'), ring = root.querySelector('[data-k="ring"]'), sec = root.querySelectorAll('[data-k="sec"]');
  const paint = () => { sec.forEach(s => s.textContent = n); ring.style.background = `conic-gradient(#2346D8 0 ${n / 30 * 100}%,#E2E8F0 ${n / 30 * 100}% 100%)`; };
  const iv = setInterval(() => {
    n--; if (n <= 0) { n = 30; seed += 12; q.classList.add('flash'); setTimeout(() => { q.innerHTML = qrCells(seed); q.classList.remove('flash'); }, 170); }
    paint();
  }, 250);   // 示意：4 倍速倒數
  paint(); cleanups.push(() => clearInterval(iv));
}

/* 地圖兩個畫面（路線、地點）共用同一排類別：路線｜活動｜景點｜市政服務｜道路施工 */
const MAPCATS = [['route', '🧭 路線'], ['evt', '🎪 活動'], ['spot', '🏛️ 景點'], ['gov', '🏢 市政服務'], ['road', '🚧 道路施工']];
const mapCats = (active, top) => `<div class="mapcats" style="top:${top}px">${MAPCATS.map(([k, t]) => `<span data-mc="${k}" class="${k === active ? 'on' : ''}">${t.replace(' ', '<br>')}</span>`).join('')}</div>`;

/* ---------- F-01 地圖路徑與即時動態 ---------- */
def({
  id: 'f1', grp: '地圖', no: '1', tag: 'F-01', title: '地圖',
  note: '<b>打開就是地圖，免登入</b><br>輸入目的地，給捷運＋公車的跨運具路線；點路線看即時到站，車快到時直接出示 <span class="k">MeNGo 乘車碼</span>，刷碼上車、快到站提醒下車。<br><br>上方類別跟「活動・景點・市政服務」是同一排，點活動、景點、市政服務、道路施工就切過去。<br>想用講的？請看「CityGPT → 一句話出門」。資料：iBus+ 動態、TDX。',
  render() {
    $screen.innerHTML = `
    ${SB()}
    <div class="body">
      <div class="map" style="background-image:url('${IMG}osm_zuoying.jpg')">
        <svg viewBox="0 0 360 700" preserveAspectRatio="none">
          <path data-k="leg1" class="route-path" pathLength="1" d="M70 470 C 120 430, 150 400, 175 340" stroke="#E05A6F" stroke-width="7" fill="none" stroke-linecap="round"/>
          <path data-k="leg2" class="route-path" pathLength="1" d="M175 340 C 200 290, 230 250, 270 190" stroke="#2346D8" stroke-width="7" fill="none" stroke-linecap="round"/>
          <circle cx="70" cy="470" r="10" fill="#2E7DF2" stroke="#fff" stroke-width="4"/>
          <g data-k="dest" class="fx-pop" style="transform-origin:270px 190px"><circle cx="270" cy="190" r="11" fill="#2346D8" stroke="#fff" stroke-width="4"/></g>
          <g data-k="bus" style="opacity:0"><circle r="9" fill="#141A2E" stroke="#fff" stroke-width="3"><animateMotion data-k="busmove" dur="3.2s" begin="indefinite" fill="freeze" path="M175 340 C 200 290, 230 250, 270 190"/></circle></g>
        </svg>
      </div>
      <div class="search">
        <div class="l"><span class="dot" style="background:#2E7DF2"></span>目前位置</div>
        <div class="l" data-k="qline" style="border-top:1px solid #E2E8F0;cursor:text"><span class="dot" style="background:#2346D8"></span><b data-k="q"></b><span class="small" data-k="ph" style="font-size:13px">輸入你的目的地</span><span class="pill p-gray" style="margin-left:auto">免登入</span></div>
      </div>
      ${mapCats('route', 94)}
      <div class="arrive fx-down" data-k="arrive">📍 <b>下一站：榮總站</b>　請準備下車<div class="small" style="color:#AEBBDD;margin-top:3px">轉乘後第 6 站 · 預計 2 分鐘到</div></div>
      <div class="sheet fx-up" data-k="sheet">
        <div class="grab"></div>
        <div class="row"><b style="font-size:15px">建議路線</b><span class="live" style="margin-left:auto">● 即時動態</span></div>
        <div class="route best" data-k="best" style="cursor:pointer">
          <div class="row"><span class="leg" style="background:#E05A6F">捷 紅線</span>›<span class="leg" style="background:#2346D8">🚌 紅 51</span><span class="pill p-green" style="margin-left:auto">推薦</span></div>
          <div class="row mt6"><span class="eta">約 35 分</span><span class="small" style="margin-left:8px">紅 51 · <b data-k="eta" style="color:#1C3BB8">3 分鐘後到站</b></span></div>
        </div>
        <div class="route">
          <div class="row"><span class="leg" style="background:#2E7DF2">🚌 市區公車直達</span><span class="small" style="margin-left:auto">免轉乘</span></div>
          <div class="row mt6"><span class="eta" style="font-size:18px">約 45 分</span><span class="small" style="margin-left:8px">8 分鐘後到站</span></div>
        </div>
        <div class="row mt10" style="gap:8px">
          <div class="btn btn-green" data-k="ticket" style="flex:1.3;cursor:pointer">🎫 出示乘車碼</div>
          <div class="btn btn-ghost" style="flex:1">🚏 站牌到站</div>
        </div>
        <div class="src">資料：<b>iBus+ 動態</b>、TDX　地圖 © OpenStreetMap</div>
      </div>
      <div class="scrim fx" data-k="scrim"></div>
      <div class="qr-sheet" data-k="qrs">
        <div class="grab"></div>
        <div class="row"><b style="font-size:16px">南高屏 TPASS 定期票</b><span class="pill p-green" style="margin-left:auto">有效</span></div>
        <div class="small mt6">捷運紅線 → 紅 51 都在定期票範圍，刷碼即可，不用另外買票</div>
        <div class="qrbox"><div class="qr" data-k="qr">${qrCells(21)}</div><div class="ring" data-k="ring"><span data-k="sec">30</span></div></div>
        <div style="text-align:center;font-size:12px;margin-top:10px;color:#566079">⟳ <span data-k="sec">30</span> 秒自動換碼　·　截圖無效　·　由 MeNGo 票證中台發碼</div>
        <div class="btn btn-green mt12" data-k="board" style="cursor:pointer">✓ 已刷碼上車</div>
      </div>
    </div>
    ${tabs('地圖')}`;
    /* 每顆按鈕都有真的功能，不依賴引導順序 */
    const st = { routed: false, live: false, qr: false, boarded: false, busy: false };
    const route = async () => {
      if (st.routed || st.busy) return; st.busy = true;
      P.$('ph').textContent = ''; await typeT(P.$('q'), '高雄榮總', 180);
      on(P.$('dest')); on(P.$('leg1')); await sleep(600); on(P.$('leg2')); await sleep(400); on(P.$('sheet'));
      st.routed = true; st.busy = false;
    };
    const live = async () => {
      if (!st.routed || st.live) return; st.live = true;
      P.$('bus').style.opacity = 1; P.$('busmove').beginElement();
      for (const t of ['2 分鐘後到站', '1 分鐘後到站', '即將進站']) { await sleep(900); P.$('eta').textContent = t; }
    };
    const showQR = () => { if (!st.routed) return; st.qr = true; on(P.$('scrim')); on(P.$('qrs')); if (!st.qrRun) { runQR(P.$('qrs'), 21); st.qrRun = true; } };
    const board = async () => { st.boarded = true; P.$('qrs').classList.remove('in'); P.$('scrim').classList.remove('in'); await sleep(900); on(P.$('arrive')); };
    P.$('qline').onclick = () => route().catch(() => {});
    P.$('best').onclick = () => live().catch(() => {});
    P.$('ticket').onclick = showQR;
    P.$('board').onclick = () => board().catch(() => {});
    P.$('scrim').onclick = () => { P.$('qrs').classList.remove('in'); P.$('scrim').classList.remove('in'); };
    $screen.querySelectorAll('[data-mc]').forEach(c => c.onclick = () => { if (c.dataset.mc !== 'route') go('f3', { cat: c.dataset.mc }); });
    return st;
  },
  async flow(st) {
    await guide(() => P.$('qline'), '點這裡，輸入你的目的地', () => st.routed);
    await guide(() => P.$('best'), '點推薦路線，看即時到站', () => st.live);
    await sleep(2600);
    await guide(() => P.$('ticket'), '車進站了，出示乘車碼', () => st.qr);
    await sleep(900);
    await guide(() => P.$('board'), '刷完碼，按這裡上車', () => st.boarded);
    await sleep(2400);
    softTip($screen.querySelector('[data-mc="evt"]'), '到了！看看附近有什麼活動 →', 7000);
  },
});

/* ---------- F-02 MeNGo 乘車碼 ---------- */
def({
  id: 'f2', grp: '一個 App 走遍城市', no: '2', tag: 'F-02', title: 'MeNGo 乘車碼',
  note: '<b>票卡直接在 App 裡</b><br>由 MeNGo 票證中台發碼；<span class="k">每 30 秒換碼</span>，截圖無效；地下月台沒訊號也能離線刷幾次。<br><br>這張定期票同時收在「憑證夾」。示意版倒數加速播放。',
  render() {
    $screen.innerHTML = `
    ${SB()}
    <div class="body">
      <div class="offline-bar fx-down" data-k="offbar">📶 目前離線　乘車碼仍可出示（剩 <span data-k="left2">3</span> 次）</div>
      <div class="ttl">我的乘車碼</div>
      <div class="sub">由 MeNGo 票證中台發碼 · 捷運、公車、輕軌通用</div>
      <div class="ticket" data-k="tk">
        <div class="row" style="position:relative"><b style="font-size:16px">南高屏 TPASS 定期票</b><span class="pill p-green" style="margin-left:auto">有效</span></div>
        <div class="small" style="color:#AEBBDD;margin-top:4px;position:relative">效期至 2026/11/15　·　已綁定 MeNGo</div>
        <div class="qrbox"><div class="qr" data-k="qr">${qrCells(7)}</div><div class="ring" data-k="ring"><span data-k="sec">30</span></div></div>
        <div style="text-align:center;font-size:12.5px;margin-top:10px;position:relative">⟳ <span data-k="sec">30</span> 秒後自動更新　·　<b>截圖無效</b></div>
      </div>
      <div style="padding:12px 16px 0">
        <div class="card row" style="justify-content:space-between">
          <div><div style="font-weight:800;font-size:14px">📶 離線也能刷</div><div class="small">地下月台沒訊號時使用</div></div>
          <div class="row" style="gap:8px"><span class="pill p-blue">剩 <span data-k="left">3</span> 次</span><div class="tog" data-k="tog" style="cursor:pointer"></div></div>
        </div>
        <div class="card row mt8" style="justify-content:space-between;cursor:pointer" data-k="shotbtn">
          <div><div style="font-weight:800;font-size:14px">📸 截圖可以用嗎？</div><div class="small">點這裡試試看</div></div>
          <span class="pill p-gray">試試 ›</span>
        </div>
      </div>
      <div class="shot" data-k="shot"></div>
      <div class="toast fx" data-k="toast" style="bottom:80px">📸 截圖的碼 30 秒後就失效<div class="small" style="color:#AEBBDD;margin-top:3px">閘門只認目前這一組　·　這張票也收在「憑證夾」</div></div>
    </div>
    ${tabs('憑證夾')}`;
    runQR(P.$('tk'), 7);
    return {};
  },
  async flow() {
    await sleep(2500);
    await tapOn(P.$('tog'), '地下月台沒訊號？打開「離線也能刷」');
    P.$('tog').classList.add('on'); on(P.$('offbar')); await sleep(900);
    P.$('left').textContent = '2'; P.$('left2').textContent = '2';
    await tapOn(P.$('shotbtn'), '那截圖給別人用呢？點這裡');
    const sh = P.$('shot'); on(sh); await sleep(150); sh.classList.remove('in'); on(P.$('toast'));
    await sleep(2600);
    softTip($screen.querySelector('[data-tab="wallet"]'), '定期票也收在憑證夾，點這裡看', 7000);
  },
});

/* ---------- F-03 POI：活動、景點、市政服務、道路施工 ----------
   kind：main＝活動頁報名、nav＝步行導航、alt＝施工替代路線、ok＝直接完成（取號、提醒、收藏） */
const CATS = {
  evt: { color: '#F0922A', head: '這週末 · 你附近 3 場', items: [
    { x: 150, y: 400, ic: '🎪', t: '駁二港邊週末市集', d: '11/15（六）14:00–21:00 · 免費', r: '步行 6 分', kind: 'main', act: '立即參與' },
    { x: 70, y: 235, ic: '🎭', t: '駁二在地劇團展演（示意）', d: '11/15（六）19:00 · 需報名', r: '步行 8 分', kind: 'ok', act: '📝 報名', ok: '已報名，入場憑證收進憑證夾' },
    { x: 245, y: 310, ic: '🖼️', t: '市集手作展（示意）', d: '11/16（日）10:00–17:00', r: '步行 11 分', kind: 'nav', act: '🧭 帶我去', min: 11 } ] },
  spot: { color: '#2346D8', head: '附近景點 · 3 處', items: [
    { x: 95, y: 275, ic: '🏛️', t: '駁二藝術特區', d: '倉庫群、公共藝術 · 全天開放', r: '步行 7 分', kind: 'nav', act: '🧭 帶我去', min: 7 },
    { x: 225, y: 365, ic: '🌉', t: '大港橋（示意）', d: '旋轉橋 · 傍晚看夕陽', r: '步行 9 分', kind: 'nav', act: '🧭 帶我去', min: 9 },
    { x: 160, y: 215, ic: '🏮', t: '鹽埕老街（示意）', d: '在地老店與小吃', r: '步行 12 分', kind: 'nav', act: '🧭 帶我去', min: 12 } ] },
  gov: { color: '#2D7857', head: '附近市政服務 · 3 處', items: [
    { x: 115, y: 345, ic: '🪪', t: '鹽埕區戶政事務所（示意）', d: '現在等候 6 人 · 可線上取號', r: '步行 10 分', kind: 'ok', act: '🎫 線上取號', ok: '已取號 A027，前面還有 6 人，快到時提醒你' },
    { x: 235, y: 255, ic: '🏢', t: '鹽埕區公所（示意）', d: '08:00–17:30', r: '步行 12 分', kind: 'nav', act: '🧭 帶我去', min: 12 },
    { x: 60, y: 420, ic: '♻️', t: '垃圾車停靠點（示意）', d: '今晚 19:40 到 · 還有 3 站', r: '步行 2 分', kind: 'ok', act: '🔔 到前提醒我', ok: '垃圾車到前 5 分鐘提醒你' } ] },
  road: { color: '#C2410C', head: '附近施工 · 2 處', items: [
    { x: 185, y: 295, ic: '🚧', t: '五福四路 管線工程（示意）', d: '今日 09:00–16:00 封閉一線道', r: '影響 2 條公車', kind: 'alt', act: '🔀 看替代路線' },
    { x: 85, y: 375, ic: '🚧', t: '大勇路 路面刨鋪（示意）', d: '11/12–11/14 夜間 22:00–06:00', r: '夜間施工', kind: 'alt', act: '🔀 看替代路線' } ] },
};
const ME = { x: 196, y: 560 };   // 使用者目前位置（畫面座標）
def({
  id: 'f3', grp: '地圖', no: '3', tag: 'F-03', title: '活動・景點・市政服務',
  note: '<b>先選你要找什麼，再給結果</b><br>同一張地圖查<span class="k">活動、景點、市政服務、道路施工</span>：選一個類別，地圖和清單才出現附近的點。<br><br>活動可一鍵報名，身分由數位市民帶入；景點、市政據點可直接步行導航；道路施工會畫出封閉路段和替代路線。<br><br>資料：文化部藝文活動 API、觀光署 TDX、市府開放資料、道路挖掘管理系統（示意）。',
  render(opts = {}) {
    $screen.innerHTML = `
    ${SB()}
    <div class="body">
      <div class="map" style="background-image:url('${IMG}osm_sanmin.jpg')"></div>
      <svg class="navsvg" data-k="navsvg"></svg>
      <div class="me-dot" style="left:${ME.x - 9}px;top:${ME.y - 9}px"></div>
      <div class="search"><div class="l" data-k="sq" style="cursor:text">🔎 <span class="small" style="font-size:13px">搜尋活動、景點、市政服務</span></div></div>
      ${mapCats('', 60)}
      <div data-k="pins"></div>
      <div class="empty-sheet" data-k="empty">
        <div class="grab"></div>
        <b style="font-size:15px">想找什麼？</b>
        <div class="small mt6" style="line-height:1.6">選上面的類別：活動、景點、市政服務、道路施工。<br>地圖會標出你附近的點。</div>
      </div>
      <div class="sheet fx-up poi-sheet" data-k="list"></div>
      <div class="sheet fx-up" data-k="card" style="z-index:4"></div>
      <div class="nav-top fx-down" data-k="navtop"></div>
      <div class="sheet fx-up" data-k="navbot" style="z-index:5"></div>
      <div class="page fx-right" data-k="page">
        <div class="hero-img" style="height:180px;background-image:linear-gradient(180deg,rgba(15,23,42,.35),rgba(15,23,42,.05) 40%,rgba(15,23,42,.55)),url('${IMG}nightmarket.jpg')"><div class="tag"><span class="pill p-orange">在地活動 · 示意</span></div><div class="pg-back" data-k="pgback">‹ 地圖</div></div>
        <div style="padding:12px 16px 0;flex:1;overflow-y:auto">
          <div style="font-size:18px;font-weight:900">駁二港邊週末市集</div>
          <div class="small mt6">📍 駁二藝術特區　·　11/15（六）14:00–21:00　·　免費　·　剩 32 位</div>
          <div class="btn btn-green mt10" data-k="signup" style="cursor:pointer">一鍵報名</div>
          <div class="card mt10 row fx" data-k="ok" style="justify-content:space-between;background:#E3F1EA;border-color:#B7DDC9;margin-top:-46px">
            <div><div style="font-weight:800;font-size:13.5px;color:#2D7857">✓ 已報名　身分自動帶入</div><div class="small">入場憑證已收進憑證夾 · 已加入行事曆</div></div>
            <div class="qr" style="width:46px;height:46px">${qrCells(3)}</div>
          </div>
          <div class="small mt10" style="font-weight:800;color:#566079">活動當天到現場</div>
          <div class="tiles">
            <div class="tile stamp" data-k="s1" style="cursor:pointer"><b>📍</b>現場報到</div>
            <div class="tile stamp" data-k="s2" style="cursor:pointer"><b>🗳️</b>人氣攤位投票</div>
            <div class="tile stamp" data-k="s3" style="cursor:pointer"><b>🎯</b>集章小遊戲</div>
          </div>
          <div class="fx" data-k="done" style="margin-top:14px;text-align:center">
            <div style="font-weight:900;font-size:14px">🎉 集章完成，+20 點收進「城市獎勵」</div>
            <div class="small mt6">可在合作店家折抵</div>
            <div class="next-pill mt10" data-k="gome">看我報名的活動 ›</div>
          </div>
          <div class="src" style="margin-bottom:16px">資料：<b>文化部藝文活動 API</b>、觀光署 TDX</div>
        </div>
      </div>
    </div>
    ${tabs('地圖')}`;
    const ctx = { cat: null, item: null, page: false, signed: false, stamps: 0, nav: false };
    const svg = P.$('navsvg');
    ctx.endNav = () => { ctx.nav = false; svg.innerHTML = ''; P.$('navtop').classList.remove('in'); P.$('navbot').classList.remove('in'); };
    ctx.showCat = (k) => {
      const c = CATS[k]; ctx.endNav();
      $screen.querySelectorAll('[data-mc]').forEach(s => s.classList.toggle('on', s.dataset.mc === k));
      P.$('empty').classList.add('out'); P.$('card').classList.remove('in'); ctx.item = null;
      P.$('pins').innerHTML = c.items.map((it, i) => `<div class="pin fx-pop" data-pin="${i}" style="left:${it.x}px;top:${it.y}px;cursor:pointer"><b style="background:${c.color}"><span>${it.ic}</span></b><div class="lab">${it.t.replace('（示意）', '')}</div></div>`).join('');
      [...P.$('pins').children].forEach((p, i) => later(() => on(p), 60 + i * 180));
      P.$('list').innerHTML = `<div class="grab"></div><div class="small" style="font-weight:800;color:${c.color}">${c.head}</div>` +
        c.items.map((it, i) => `<div class="it" data-it="${i}"><div class="ic" style="background:${c.color}22">${it.ic}</div><div><div class="t">${it.t}</div><div class="d">${it.d}</div></div><span class="r" style="color:${c.color}">${it.r}</span></div>`).join('');
      on(P.$('list')); ctx.cat = k;
    };
    ctx.showItem = (i) => {
      const c = CATS[ctx.cat], it = c.items[i]; ctx.endNav(); ctx.item = it;
      const C = P.$('card');
      C.innerHTML = `<div class="grab"></div>
        <div class="row"><div style="font-size:26px">${it.ic}</div><div style="flex:1"><b style="font-size:15px">${it.t}</b><div class="small">${it.d}</div></div><span class="pill" style="background:${c.color}1F;color:${c.color};white-space:nowrap">${it.r}</span></div>
        <div class="btn btn-green mt10" data-k="act" style="cursor:pointer">${it.act}</div>
        <div class="small mt8" data-k="actok" style="text-align:center;display:none;color:#2D7857;font-weight:800"></div>
        <div class="small mt8" data-k="back2list" style="text-align:center;cursor:pointer;color:#566079">‹ 回到清單</div>`;
      P.$('list').classList.remove('in'); on(C);
      P.$('act').onclick = () => ctx.doAct(it, c);
      P.$('back2list').onclick = () => { C.classList.remove('in'); on(P.$('list')); ctx.item = null; };
    };
    /* 導航：從目前位置畫折線到目的地 */
    ctx.startNav = (it, c) => {
      const tx = it.x + 17, ty = it.y + 34, my = Math.round((ME.y + ty) / 2);
      const d = `M ${ME.x} ${ME.y} V ${my} H ${tx} V ${ty}`;
      svg.innerHTML = `<path d="${d}" stroke="#141A2E" stroke-opacity=".25" stroke-width="11" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path class="navline" pathLength="1" d="${d}" stroke="${c.color}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      P.$('navtop').innerHTML = `🚶 <b>步行導航中</b>　前往 ${it.t.replace('（示意）', '')}<div class="small" style="color:#AEBBDD;margin-top:3px">直走 120 公尺後右轉 · 約 ${it.min} 分鐘</div>`;
      P.$('navbot').innerHTML = `<div class="grab"></div><div class="row"><b style="font-size:15px">約 ${it.min} 分鐘 · ${(it.min * 0.08).toFixed(1)} 公里</b><span class="pill p-green" style="margin-left:auto">步行</span></div>
        <div class="small mt6">抵達後會自動結束導航</div><div class="btn btn-ghost mt10" data-k="endnav" style="cursor:pointer">結束導航</div>`;
      P.$('card').classList.remove('in'); on(P.$('navtop')); on(P.$('navbot')); ctx.nav = true;
      P.$('endnav').onclick = () => { ctx.endNav(); on(P.$('card')); };
    };
    /* 施工：紅色封閉段＋藍色替代路線 */
    ctx.startAlt = (it) => {
      const x = it.x + 17, y = it.y + 34;
      svg.innerHTML = `<path d="M ${x - 45} ${y + 10} H ${x + 55}" stroke="#C2410C" stroke-width="8" stroke-dasharray="6 6" fill="none" stroke-linecap="round"/>
        <path d="M ${ME.x} ${ME.y} V ${y + 10} H ${x - 45} V ${y + 70} H ${x + 55} V ${y + 10}" stroke="#141A2E" stroke-opacity=".25" stroke-width="11" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <path class="navline" pathLength="1" d="M ${ME.x} ${ME.y} V ${y + 10} H ${x - 45} V ${y + 70} H ${x + 55} V ${y + 10}" stroke="#2346D8" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      P.$('navtop').innerHTML = `🔀 <b>已幫你改走替代路線</b><div class="small" style="color:#AEBBDD;margin-top:3px">紅色虛線是施工封閉段 · 多 3 分鐘</div>`;
      P.$('navbot').innerHTML = `<div class="grab"></div><b style="font-size:15px">${it.t.replace('（示意）', '')}</b><div class="small mt6">${it.d}</div>
        <div class="row mt8" style="gap:8px"><span class="pill p-orange">影響公車：紅 21、50（示意）</span></div>
        <div class="btn btn-green mt10" data-k="endnav" style="cursor:pointer">開始導航（替代路線）</div>`;
      P.$('card').classList.remove('in'); on(P.$('navtop')); on(P.$('navbot')); ctx.nav = true;
      P.$('endnav').onclick = () => { P.$('navtop').innerHTML = '🧭 <b>導航中 · 替代路線</b><div class="small" style="color:#AEBBDD;margin-top:3px">前方 200 公尺左轉，避開施工段</div>'; P.$('endnav').textContent = '結束導航'; P.$('endnav').onclick = () => { ctx.endNav(); on(P.$('card')); }; };
    };
    ctx.doAct = (it, c) => {
      if (it.kind === 'main') { on(P.$('page')); ctx.page = true; }
      else if (it.kind === 'nav') ctx.startNav(it, c);
      else if (it.kind === 'alt') ctx.startAlt(it);
      else { const o = P.$('actok'); o.style.display = 'block'; o.textContent = '✓ ' + it.ok; }
    };
    P.$('pgback').onclick = () => { P.$('page').classList.remove('in'); ctx.page = false; };
    P.$('signup').onclick = () => { P.$('signup').style.visibility = 'hidden'; on(P.$('ok')); ctx.signed = true; };
    ['s1', 's2', 's3'].forEach(k => P.$(k).onclick = () => {
      const t = P.$(k); if (t.classList.contains('got')) return;
      t.classList.add('got'); t.querySelector('b').textContent = '✓'; ctx.stamps++;
      if (ctx.stamps === 3) on(P.$('done'));
    });
    P.$('gome').onclick = () => go('me', { focus: 'evts' });
    $screen.querySelectorAll('[data-mc]').forEach(s => s.onclick = () => (s.dataset.mc === 'route' ? go('f1') : ctx.showCat(s.dataset.mc)));
    P.$('pins').addEventListener('click', (e) => { const p = e.target.closest('[data-pin]'); if (p) ctx.showItem(+p.dataset.pin); });
    P.$('list').addEventListener('click', (e) => { const p = e.target.closest('[data-it]'); if (p) ctx.showItem(+p.dataset.it); });
    P.$('sq').addEventListener('click', () => { if (!ctx.cat) P.$('empty').querySelector('.small').innerHTML = '可以直接搜尋，例如「駁二」「戶政」「施工」；<br>也可以先選上面的類別。'; });
    if (opts.cat) later(() => ctx.showCat(opts.cat), 300);
    ctx.opts = opts;
    return ctx;
  },
  async flow(ctx) {
    const cat = ctx.opts.cat;
    if (cat && cat !== 'evt') {   // 從路線頁點景點／市政服務／施工過來：引導到導航
      await guide(() => P.$('list').querySelector('[data-it="0"]'), '點一個看詳情', () => ctx.item);
      await guide(() => P.$('act'), '點這裡', () => ctx.nav);
      return;
    }
    await guide(() => $screen.querySelector('[data-mc="evt"]'), '先選你想找的：這週末的活動', () => ctx.cat);
    if (ctx.cat !== 'evt') return;   // 使用者自己選了別的類別，就讓他自由逛，不再跳提示
    await sleep(700);
    await guide(() => P.$('list').querySelector('[data-it="0"]') || $screen.querySelector('[data-pin="0"]'), '點駁二港邊週末市集看詳情', () => ctx.item && ctx.item.kind === 'main');
    await guide(() => P.$('act'), '有興趣？立即參與', () => ctx.page);
    await guide(() => P.$('signup'), '一鍵報名，不用填姓名電話', () => ctx.signed);
    const tips = ['到了現場，點這裡報到', '幫喜歡的攤位投一票', '集滿章領點數'];
    for (let i = 0; i < 3; i++) {
      await guide(() => ['s1', 's2', 's3'].map(k => P.$(k)).find(t => !t.classList.contains('got')), tips[ctx.stamps] || '', () => ctx.stamps > i);
    }
    await sleep(400);
    await guide(() => P.$('gome'), '報名紀錄在「我的」，以城市收攏', () => false);
  },
});

/* ---------- F-05 情境主動通知 ---------- */
def({
  id: 'f5', grp: '主動通知與我的', no: '5', tag: 'F-05', title: '情境主動通知',
  note: '<b>在你開口前先告訴你</b><br>慣用公車誤點給替代路線、出門前提醒施工、<span class="k">定期票到期前 3 天提醒，一鍵跳 MeNGo 續購</span>（付款在 MeNGo 完成，Super APP 不經手金流）、豪雨時提醒住家附近的人移車，並直接導航到地勢較高的停車場。<br><br><span class="k">每週一則城市任務</span>（週四晚上推「本週城市任務」，點進去就是任務卡）。<br><br>按下方「快轉」看一天裡的提醒。要收哪些提醒，在「我的 → 主動提醒」逐項開關。<br>依據：個人常用路線＋氣象署、水利署開放資料（觸發條件待團隊定案）。',
  render() {
    $screen.innerHTML = `
    <div class="lock"></div>
    <div style="position:relative">${SB(true)}</div>
    <div class="body" style="position:relative">
      <div class="clock"><div class="d">11 月 12 日 星期三</div><div class="t" data-k="clock">6:57</div></div>
      <div class="notis" data-k="notis" style="margin-top:22px"></div>
      <div class="lock-ff" data-k="ff">⏩ 快轉到 6:58</div>
      <div class="nav-card" data-k="navc">
        <div class="mp" style="background-image:url('${IMG}osm_zuoying.jpg')">
          <svg viewBox="0 0 340 150" preserveAspectRatio="none"><path class="route-path in" pathLength="1" d="M 40 120 L 40 80 L 180 80 L 180 40 L 290 40" stroke="#2346D8" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="bd"><b>🧭 導航中：鼎山公有停車場</b>（地勢較高）<div class="small mt6">剩 46 格 · 開車約 4 分 · 停好後回報，我會繼續盯雨勢</div></div>
      </div>
    </div>
    <div class="toast fx" data-k="toast" style="bottom:80px;z-index:25"></div>
    <div class="page fx-right mg-page" data-k="mg">
      ${SB()}
      <div class="mg-bar"><span class="mg-back" data-k="mgback">‹ Super APP</span><b>MeNGo</b><span class="pill p-gray">Mini App · 示意</span></div>
      <div style="padding:14px 16px 0;flex:1;overflow-y:auto">
        <div class="small" style="font-weight:800;color:#566079">定期票續購</div>
        <div class="ticket mt8" style="margin:8px 0 0">
          <div class="row" style="position:relative"><b style="font-size:16px">南高屏 TPASS 定期票　30 天</b><span class="pill p-orange" style="margin-left:auto">3 天後到期</span></div>
          <div class="small" style="color:#AEBBDD;margin-top:4px;position:relative">捷運・公車・輕軌　·　目前效期至 2026/11/15</div>
          <div class="row" style="position:relative;margin-top:14px;align-items:flex-end"><div><div class="small" style="color:#AEBBDD">續購後效期</div><b style="font-size:14px">2026/11/16 – 2026/12/15</b></div><b style="margin-left:auto;font-size:24px">NT$999</b></div>
        </div>
        <div class="card mt10">
          <div class="field"><span style="color:#64748B">卡號</span><span>MG ••• 7731</span></div>
          <div class="field"><span style="color:#64748B">付款方式</span><span>在 MeNGo 選擇</span></div>
        </div>
        <div class="btn btn-green mt12" data-k="pay" style="cursor:pointer">前往 MeNGo 付款</div>
        <div class="small mt8" style="text-align:center">付款在 MeNGo 完成，Super APP 不經手金流</div>
        <div class="src" style="text-align:center">金額與效期依 MeNGo 公告為準（示意）</div>
      </div>
    </div>`;
    const st = { choice: null, paid: false };
    const toast = (h) => { const t = P.$('toast'); t.innerHTML = h; t.classList.remove('in'); void t.offsetWidth; on(t); later(() => t.classList.remove('in'), 2600); };
    st.toast = toast;
    st.openMg = () => { st.choice = 'renew'; on(P.$('mg')); };
    st.later = () => { st.choice = 'later'; toast('🔔 好的，明天早上 8:00 再提醒你'); };
    P.$('mgback').onclick = () => { P.$('mg').classList.remove('in'); };
    P.$('pay').onclick = async () => {
      if (st.paid || st.paying) return; st.paying = true;
      P.$('pay').textContent = 'MeNGo 付款處理中…';
      try { await sleep(900); } catch (_) { return; }   // 中途換情境就不再更新畫面
      P.$('mg').classList.remove('in'); st.paid = true; STATE.renewed = true;
      toast('✓ <b>續購完成，效期延至 2026/12/15</b><div class="small" style="color:#AEBBDD;margin-top:3px">這筆紀錄會出現在「我的 → 替你做過的事」</div>');
    };
    return st;
  },
  async flow(st) {
    const box = P.$('notis'), ff = P.$('ff');
    const push = async (time, title, body, acts, label = '主動提醒') => {
      const e = el(`<div class="noti fx-down"><div class="h"><span class="app" style="background:#2346D8">S</span>Super APP · ${label}<span style="margin-left:auto">${time}</span></div><div class="t">${title}</div><div class="c">${body}</div>${acts || ''}</div>`);
      box.prepend(e); await sleep(30); e.classList.add('in');
      $phone.classList.remove('shake'); void $phone.offsetWidth; $phone.classList.add('shake'); return e;
    };
    await tapOn(ff, '手機放著就好，點這裡快轉時間');
    P.$('clock').textContent = '6:58'; await push('6:58', '🚌 慣用公車誤點 10 分鐘', '改搭捷運紅線可省 8 分鐘，乘車碼已準備好。');
    ff.textContent = '⏩ 快轉到 7:05';
    await tapOn(ff, '');
    P.$('clock').textContent = '7:05'; await push('7:05', '🚧 通勤路線今天有施工', '博愛二路 9:00 起封閉一線道，建議提早 10 分鐘。');
    ff.textContent = '⏩ 快轉到 8:00';
    await tapOn(ff, '');
    /* 定期票到期前 3 天：一鍵跳 MeNGo 續購，付款在 MeNGo 完成 */
    P.$('clock').textContent = '8:00';
    const rn = await push('8:00', '🎫 定期票 3 天後到期', '南高屏 TPASS 11/15 到期，可直接續購下個月', '<div class="acts"><span class="pri" data-k="renew" style="cursor:pointer;background:#2346D8">一鍵續購</span><span data-k="later" style="cursor:pointer">稍後提醒</span></div>');
    rn.querySelector('[data-k="renew"]').onclick = () => { if (!st.choice) st.openMg(); };
    rn.querySelector('[data-k="later"]').onclick = () => { if (!st.choice) st.later(); };
    ff.style.visibility = 'hidden';
    await guide(() => rn.querySelector('[data-k="renew"]'), '', () => st.choice);
    if (st.choice === 'renew') {
      await guide(() => P.$('pay'), '', () => st.paid);
      await sleep(1600);
    } else await sleep(1200);
    rn.querySelector('.acts').innerHTML = st.paid ? '<span style="background:#E3F1EA;color:#2D7857">✓ 已續購，效期至 2026/12/15</span>' : '<span>明天 8:00 再提醒你</span>';
    ff.style.visibility = '';
    ff.textContent = '⏩ 快轉到下午，豪雨特報';
    await tapOn(ff, '');
    P.$('clock').textContent = '15:20'; ff.style.display = 'none';
    const n = await push('現在', '🌧️ 豪雨特報：住家附近可能積水', '鼎山街一帶感測器連續兩次超過警戒，建議把車移到地勢較高處。', '<div class="acts"><span class="pri" data-k="nav" style="cursor:pointer;background:#2346D8">導航到停車場</span><span>我知道了</span></div>');
    await sleep(400);
    await tapOn(n.querySelector('[data-k="nav"]'), '車停路邊？點這裡導航到高處');
    box.style.opacity = '.35'; on(P.$('navc'));
    /* 隔天：週四晚上，每週一則的城市任務通知（點「看任務」進任務卡） */
    await sleep(2800);
    P.$('navc').classList.remove('in'); box.style.opacity = '1';
    ff.style.display = ''; ff.textContent = '⏩ 快轉到週四晚上';
    await tapOn(ff, '');
    ff.style.display = 'none'; box.innerHTML = '';
    $screen.querySelector('.clock .d').textContent = '11 月 13 日 星期四'; P.$('clock').textContent = '20:00';
    const qn = await push('20:00', '🗺️ 本週城市任務：駁二港邊週末市集', '搭車到駁二、參加活動，集滿 3 章可得 20 點', '<div class="acts"><span class="pri" data-k="goq" style="cursor:pointer;background:#2346D8">看任務</span><span data-k="noq" style="cursor:pointer">先不要</span></div>', '城市任務');
    qn.querySelector('[data-k="goq"]').onclick = () => go('quest', { from: 'noti' });
    qn.querySelector('[data-k="noq"]').onclick = () => { qn.querySelector('.acts').innerHTML = '<span>好，這週不提醒了，任務還是看得到</span>'; };
    await guide(() => qn.querySelector('[data-k="goq"]'), '', () => false);
  },
});
