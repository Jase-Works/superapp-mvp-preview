/* 首頁、憑證夾、我的：沿用 mvp_app，拿掉自動示範，改為自由操作＋提示。 */
/* =====================================================================
   首頁（v13）：停在使用者目前所在的城市，不再切換城市。
   上面是天氣、市民身分、今天先告訴你、附近即時到站；
   下面「各城市服務捷徑」按城市分頁，點服務就在 App 內開啟該服務的網頁（in-app web view，示意）。
   ===================================================================== */
const OPEN = 0, NEED = 1;
const BASE_CITIES = [
  { id: 'khh', name: '高雄市', loc: true, temp: 28, cond: '多雲時晴', hi: 31, lo: 24, sky: 'cloudy', g: ['#3E78C9', '#8AB5E8'],
    ident: { st: 'ok', name: '高雄數位市民', sub: '已綁定　開 MeNGo、1999 報修都不用再登入' },
    alert: '🚧 明早你常走的博愛二路有施工，已幫你排好替代路線',
    svc: [['🎫', 'MeNGo', NEED], ['🚌', 'iBus+', OPEN], ['📮', '1999 報修', NEED], ['🎪', '活動報名', NEED], ['🌧️', '天氣告警', OPEN], ['🅿️', '路邊停車', OPEN]],
    bus: [['🚇', '捷運紅線 · 巨蛋站', '2 分'], ['🚌', '紅 51 · 往高雄榮總', '5 分']], tenant: '高雄市政府' },
  { id: 'tpe', name: '台北市', temp: 23, cond: '午後短暫雨', hi: 25, lo: 20, sky: 'rain', g: ['#4D5E76', '#8E9CB0'],
    ident: { st: 'need', name: '台北通', sub: '尚未綁定　公車、天氣不用綁也能用' },
    alert: '🌧️ 下午 3 點後可能下雨，出門記得帶傘',
    svc: [['🪪', '台北通', NEED], ['🚍', '台北公車', OPEN], ['📮', '1999 陳情', NEED], ['🎡', '活動報名', NEED], ['🌧️', '天氣告警', OPEN], ['🅿️', '路邊停車', OPEN]],
    bus: [['🚇', '捷運板南線 · 市政府站', '3 分'], ['🚍', '公車 · 往信義區', '6 分']], tenant: '台北市政府' },
  { id: 'txg', name: '台中市', temp: 26, cond: '晴', hi: 29, lo: 19, sky: 'clear', g: ['#2A78DE', '#6FB4F3'],
    ident: { st: 'need', name: '台中通', sub: '尚未綁定　公車、停車不用綁也能用' },
    alert: '☀️ 中午紫外線偏高，出門注意防曬',
    svc: [['🪪', '台中通', NEED], ['🚌', '市區公車', OPEN], ['📮', '1999 陳情', NEED], ['🎪', '活動報名', NEED], ['🌧️', '天氣告警', OPEN], ['🅿️', '路邊停車', OPEN]],
    bus: [['🚌', '公車 · 往台中車站', '4 分'], ['🚌', '公車 · 往逢甲', '9 分']], tenant: '台中市政府' },
];
const ST_TXT = { ok: '✓ 已綁定', need: '綁定', guest: '訪客' };
function skyHTML(c) {
  const fx = c.sky === 'rain' ? '<div class="rain"></div>'
    : c.sky === 'cloudy' ? '<div class="cloud" style="width:220px;height:90px;left:-40px;top:120px"></div><div class="cloud" style="width:180px;height:70px;right:-30px;top:210px;animation-delay:-5s"></div>'
    : '<div class="cloud" style="width:160px;height:160px;right:-50px;top:60px;background:rgba(255,236,170,.35)"></div>';
  return `<div class="wx-bg" style="opacity:1;background:linear-gradient(180deg,${c.g[0]} 0%,${c.g[1]} 100%)">${fx}</div>`;
}

/* ---- App 內網頁（in-app web view，示意）：每個服務捷徑點下去開這個 ---- */
const wvRow = (ic, t, d) => `<div class="wv-row"><span class="ic">${ic}</span><div><b>${t}</b>${d ? `<small>${d}</small>` : ''}</div></div>`;
/* 回傳 { rows: HTML, acts: [[按鈕文字, 動作, 是否主按鈕]] }；動作在畫面上點了才執行 */
function webContent(city, name) {
  const tp = STATE.renewed ? '2026/12/15' : '2026/11/15';
  switch (name) {
    case 'MeNGo': return { rows: wvRow('🎫', '南高屏 TPASS 定期票', '效期至 ' + tp + ' · 本月搭乘 27 次') + wvRow('🪙', '高雄幣', '餘額 85 枚') + wvRow('🌱', '減碳兌換', '本季減碳 28.5 kg'), acts: [['🎫 出示乘車碼', () => go('f2'), true]] };
    case 'iBus+': return { rows: city.bus.map(([i, t, e]) => wvRow(i, t, '約 ' + e + '後到站')).join(''), acts: [['🧭 查路線與即時動態', () => go('f1'), true]] };
    case '1999 報修': return { rows: wvRow('📸', '拍照陳情', '拍一張照片，AI 幫你填好地點與類別') + wvRow('📮', '我的案件', '2 件，1 件處理中'), acts: [['📸 拍照陳情', () => go('photo'), true], ['看我的案件', () => go('me', { focus: 'case' })]] };
    case '活動報名': return { rows: wvRow('🎪', '駁二港邊週末市集', '11/15（六）14:00–21:00 · 免費') + wvRow('🎭', '駁二在地劇團展演（示意）', '11/15（六）19:00 · 需報名'), acts: [['看活動與報名', () => go('f3', { cat: 'evt' }), true]] };
    case '天氣告警': return { rows: wvRow('🌧️', '今日告警', city.alert.replace(/^\S+\s*/, '')) + wvRow('🔔', '豪雨、淹水、高溫', '有狀況會主動通知你'), acts: [['管理提醒', () => go('me')]] };
    case '路邊停車': return { rows: wvRow('🪪', '住戶路邊停車證', '三民區 · 灣成里 · 效期至 2027/03/31') + wvRow('🅿️', '附近停車場', '剩 46 格（示意）'), acts: [] };
    default: return { rows: wvRow('ℹ️', name + '首頁', '由' + city.tenant + '提供（示意）') + wvRow('📄', '常見問題', '服務說明與申請方式'), acts: [] };
  }
}
function webHTML(city, svc) {
  const [ic, name, need] = svc, locked = need === NEED && city.ident.st !== 'ok';
  let body;
  if (locked) {
    body = `<div class="wv-hero"><div class="big">🔒</div><b>需要先綁定${city.ident.name}</b><small>綁定後，${name}會用你的市民身分直接登入，不用再輸入帳號密碼。</small></div>
      <div class="wv-acts"><div class="btn btn-green" data-wva="bind" style="cursor:pointer">綁定${city.ident.name}</div><div class="btn btn-ghost" data-wva="close" style="cursor:pointer">先逛逛開放的服務</div></div>`;
  } else {
    const c = webContent(city, name);
    body = `<div class="wv-hero"><div class="big">${ic}</div><b>${name}</b><small>由${city.tenant}提供${city.ident.st === 'ok' && need === NEED ? ' · 已用' + city.ident.name + '登入' : ''}</small></div>
      <div class="wv-list">${c.rows}</div>
      <div class="wv-acts">${c.acts.map(([t, , pri], i) => `<div class="btn ${pri ? 'btn-green' : 'btn-ghost'}" data-wva="${i}" style="cursor:pointer">${t}</div>`).join('')}</div>`;
  }
  return `<div class="page fx-right mg-page wv" data-k="web">${SB()}
    <div class="wv-bar"><span class="wv-x" data-k="wvx">✕</span><div class="wv-t"><b>${name}</b><small>🔒 App 內網頁 · ${city.tenant}（示意）</small></div><span class="wv-dots">⋯</span></div>
    <div class="wv-load"><i></i></div>
    <div class="wv-body">${body}<div class="src" style="text-align:center;margin:14px 0">內嵌網頁示意，實際內容由各局處在租戶後台上架</div></div>
  </div>`;
}

function homeHTML(c) {
  const bound = c.ident.st === 'ok';
  const qSub = STATE.quest ? '已完成 · 下週任務：鹽埕在地夜市' : '駁二港邊週末市集 · 集滿 3 章 +20 點';
  const qGo = STATE.quest ? '看紀錄 ›' : '看任務 ›';
  return `<section class="cpage hm" data-k="hm">
    <div style="height:44px"></div>
    <div class="chead">
      <div class="loc">目前位置 ➤</div>
      <div class="cname">${c.name}</div>
      <div class="temp">${c.temp}°</div>
      <div class="cond">${c.cond}</div>
      <div class="hl">最高 ${c.hi}°　最低 ${c.lo}°</div>
    </div>
    <div class="mod">
      <div class="mh">🪪 市民身分</div>
      <div class="idrow"><div class="badge">🪪</div>
        <div><div class="big">${c.ident.name}</div><div class="sm">${c.ident.sub}</div></div>
        <span class="st ${c.ident.st}">${ST_TXT[c.ident.st]}</span></div>
    </div>
    <div class="mod"><div class="mh">🔔 今天先告訴你</div><div class="big" style="font-size:14px;font-weight:700;line-height:1.5">${c.alert}</div>
      <div class="hm-quest" data-k="hquest"><b>🗺️</b><div><span class="t">本週城市任務</span><small>${qSub}</small></div><span class="go">${qGo}</span></div>
    </div>
    <div class="mod"><div class="mh">🚏 附近即時到站</div>
      ${c.bus.map(([i, t, e]) => `<div class="trow">${i} ${t}<span class="eta2">${e}</span></div>`).join('')}
    </div>
    <div class="mod"><div class="mh">🏙️ 各城市服務捷徑</div>
      <div class="hm-ct" data-k="hct">${BASE_CITIES.map((x, i) => `<span data-hc="${i}" class="${i === 0 ? 'on' : ''}">${x.loc ? '📍 ' : ''}${x.name}</span>`).join('')}</div>
      <div class="svc" data-k="hsvc"></div>
      <div class="sm" data-k="hnote" style="margin-top:9px;opacity:.75"></div>
    </div>
    <div class="cfoot">天氣、到站為示意　資料來源：氣象署、TDX</div>
  </section>`;
}

def({
  id: 'home', no: '⌂', tag: 'F-06 · 新', title: '首頁',
  steps: ['打開就是你目前所在的城市', '附近即時到站放在最上面', '各城市服務捷徑：按城市分頁', '點服務，在 App 內開啟那個服務的網頁', '還沒綁定的城市，點了會請你先綁定市民身分'],
  note: `<b>打開就是你現在所在的城市</b><br>不用切換城市：定位在哪，首頁就顯示哪座城市的<b>天氣、市民身分、今天先告訴你、附近即時到站</b>。<br><br>下面是<span class="k">各城市服務捷徑</span>：按城市分頁（高雄、台北、台中），點任一個服務，就在 App 內開啟那個服務的網頁（in-app web view），不用再下載各縣市的 App。<br><br>已綁定的城市全部服務都能用；沒綁定的只鎖住需要實名的服務（🔒），點了會請你先綁定，公車、天氣照樣直接用。<br><br>服務網頁為示意；實際由各局處在租戶後台上架。`,
  render() {
    const c = BASE_CITIES[0], ctx = { city: 0, web: null };
    CITY_SHORT = '高雄';
    $screen.innerHTML = `<div class="wx" data-k="wx">
      ${skyHTML(c)}
      ${homeHTML(c)}
      <div style="position:absolute;top:0;left:0;right:0;z-index:5;pointer-events:none">${SB(true)}</div>
      ${tabs('首頁', 'dark')}
    </div>`;
    const paint = (i) => {
      ctx.city = i; const x = BASE_CITIES[i], bound = x.ident.st === 'ok';
      $screen.querySelectorAll('[data-hc]').forEach(s => s.classList.toggle('on', +s.dataset.hc === i));
      P.$('hsvc').innerHTML = x.svc.map(([ic, t, need], k) => `<div data-hs="${k}" style="cursor:pointer"><b>${ic}</b>${t}${need && !bound ? '<span class="lk">🔒</span>' : ''}</div>`).join('');
      P.$('hnote').textContent = i === 0
        ? '服務由' + x.tenant + '在租戶後台上架　·　點服務在 App 內開啟'
        : '你目前在高雄。到' + x.name.slice(0, 2) + '時，這些服務一樣在 App 內開；🔒 要先綁定' + x.ident.name;
    };
    paint(0);
    ctx.closeWeb = () => { const w = P.$('web'); if (!w) return; w.classList.remove('in'); setTimeout(() => w.remove(), 400); ctx.web = null; };
    ctx.openWeb = (ci, k) => {
      const x = BASE_CITIES[ci], svc = x.svc[k]; ctx.closeWeb();
      const w = el(webHTML(x, svc)); P.$('wx').appendChild(w); void w.offsetWidth; on(w);
      const acts = svc[2] === NEED && x.ident.st !== 'ok' ? null : webContent(x, svc[1]).acts;
      ctx.web = { city: ci, name: svc[1] };
      P.$('wvx').onclick = () => ctx.closeWeb();
      w.querySelectorAll('[data-wva]').forEach(b => b.onclick = () => {
        const a = b.dataset.wva;
        if (a === 'bind') go('wallet'); else if (a === 'close') ctx.closeWeb(); else acts[+a][1]();
      });
    };
    P.$('hct').addEventListener('click', (e) => { const t = e.target.closest('[data-hc]'); if (t) paint(+t.dataset.hc); });
    P.$('hsvc').addEventListener('click', (e) => { const t = e.target.closest('[data-hs]'); if (t) ctx.openWeb(ctx.city, +t.dataset.hs); });
    P.$('hquest').addEventListener('click', () => (STATE.quest ? go('me', { focus: 'did' }) : go('quest')));
    return ctx;
  },
});

/* =====================================================================
   憑證夾（Apple 錢包式）
   ===================================================================== */
/* 憑證分類：市民身分｜交通｜活動｜城市獎勵。
   資格（志工、設籍、學生…）不是憑證，是市民身分上的 tag，掛在數位市民卡上。 */
const WCATS = [['id', '🪪 市民身分'], ['tr', '🚋 交通'], ['ev', '🎟️ 活動'], ['rw', '🎁 城市獎勵']];
const TAG_NOT_YET = '其他資格（例如學生）目前不符合；符合時會自動加上';
const PASSES = [
  { cat: 'id', id: 'kh', iss: '高雄市政府', nm: '高雄數位市民', st: '已實名核驗', g: ['#2346D8', '#0F5A45'], lb1: '持有人', v1: '林○明', lb2: '有效至', v2: '2027/10/31', no: 'KH ••• 0412', chip: true,
    tags: [['🏠', '設籍三民區', '戶政 · 住戶停車、區域活動優先'], ['🤝', '志工', '社會局 · 36 小時 · 場館志工優惠']],
    fields: [['發證機關', '高雄市政府', ''], ['已授權給 Super APP', '實名核驗標記、身分標籤', 'ok'], ['不會提供', '家庭收入、病歷等非必要資料', 'no']] },
  { cat: 'tr', id: 'tp', iss: 'MeNGo 票證中台', nm: '南高屏 TPASS 定期票', st: '有效', g: ['#2C4DA6', '#13235A'], lb1: '適用', v1: '捷運・公車・輕軌', lb2: '效期至', v2: '2026/11/15', no: 'MG ••• 7731',
    fields: [['發卡', 'MeNGo（高雄市交通局）', ''], ['本月搭乘', '捷運 18 次・公車 9 次', ''], ['離線可刷', '剩 3 次', 'ok']] },
  { cat: 'tr', id: 'pk', iss: '高雄市交通局', nm: '住戶路邊停車證（示意）', st: '有效', g: ['#475569', '#1E293B'], lb1: '區域', v1: '三民區 · 灣成里', lb2: '效期至', v2: '2027/03/31', no: 'PK ••• 5530',
    fields: [['核發', '高雄市交通局（示意）', ''], ['車牌', 'ABC-•••8', ''], ['可停路段', '住家周邊 500 公尺', 'ok']] },
  { cat: 'ev', id: 'ev', iss: '活動模組 · 駁二藝術特區', nm: '駁二港邊週末市集', st: '已報名', g: ['#F0922A', '#B8480E'], lb1: '時間', v1: '11/15（六）14:00', lb2: '入場', v2: '出示即可', no: 'EV ••• 1115',
    fields: [['主辦', '駁二藝術特區（示意）', ''], ['身分', '由高雄數位市民帶入', 'ok'], ['集章進度', '3 / 3', 'ok']] },
  { cat: 'rw', id: 'coin', iss: '高雄市政府 · 高雄幣', nm: '高雄幣', st: '可使用', g: ['#E0A21B', '#9C5E09'], lb1: '餘額', v1: '85 枚', lb2: '到期', v2: '2026/12/31', no: 'KC ••• 0085',
    fields: [['可用店家', '全家、Let\'s Café 等合作店家', ''], ['最近入帳', '+20（駁二市集集章）', 'ok'], ['使用方式', '到店出示，店家掃碼折抵', '']] },
  { cat: 'rw', id: 'cpn', iss: 'MeNGo 減碳兌換', nm: '美濃小農券 NT$50（示意）', st: '未使用', g: ['#3E9B5F', '#1F5C37'], lb1: '兌換自', v1: '減碳 5 kg', lb2: '有效期', v2: '30 天', no: 'CP ••• 7K2D',
    fields: [['合作店家', '美濃小農（示意）', ''], ['限制', '限用一次', ''], ['本季減碳', '28.5 kg', 'ok']] },
];
const NEW_PASS = { cat: 'id', id: 'tpe', iss: '台北市政府', nm: '台北通', st: '已綁定', g: ['#0F7C93', '#0B4A61'], lb1: '持有人', v1: '林○明', lb2: '綁定日', v2: '2026/11/09', no: 'TP ••• 2203', chip: true,
  fields: [['發證機關', '台北市政府（示意）', ''], ['已授權給 Super APP', '實名核驗標記', 'ok'], ['不會提供', '戶籍地址、繳費紀錄', 'no']] };
/* 在「一句話玩高雄」報名的活動，會出現在活動類 */
const STATE_PASSES = {
  yancheng: { cat: 'ev', id: 'yc', iss: '活動模組 · 鹽埕在地商圈', nm: '鹽埕港邊樂團之夜（示意）', st: '已預約', g: ['#DB2777', '#831843'], lb1: '時間', v1: '11/15（六）19:00', lb2: '入場', v2: '出示即可', no: 'EV ••• 1119',
    fields: [['主辦', '鹽埕在地商圈（示意）', ''], ['身分', '由高雄數位市民帶入', 'ok'], ['座位', '自由入座', '']] },
  pier2: { cat: 'ev', id: 'p2', iss: '活動模組 · 在地劇團', nm: '駁二在地劇團展演（示意）', st: '已報名', g: ['#0E7490', '#164E63'], lb1: '時間', v1: '11/15（六）19:00', lb2: '入場', v2: '出示即可', no: 'EV ••• 1120',
    fields: [['主辦', '在地劇團（示意）', ''], ['身分', '由高雄數位市民帶入', 'ok'], ['入場', '18:40 開放', '']] },
};
const GAP = 64;

function passHTML(p, i) {
  return `<div class="pass" data-i="${i}" style="background:linear-gradient(150deg,${p.g[0]},${p.g[1]});z-index:${i + 1}">
    <div class="ph"><div><div class="iss">${p.iss}</div><div class="nm">${p.nm}</div></div><span class="st2">${p.st}</span></div>
    ${p.tags ? `<div class="ptags">${p.tags.map(([i, t]) => `<span>${i} ${t}</span>`).join('')}</div>` : ''}
    <div class="pm"${p.tags ? ' style="margin-top:8px"' : ''}><div><div class="lb">${p.lb1}</div><div class="vl">${p.v1}</div></div><div style="text-align:right"><div class="lb">${p.lb2}</div><div class="vl">${p.v2}</div></div></div>
    ${p.chip ? '<div class="chip"></div>' : ''}<div class="pno">${p.no}</div>
  </div>`;
}

def({
  id: 'wallet', no: '🪪', tag: 'F-06 · 新', title: '憑證夾',
  steps: ['各城市的市民憑證、票卡、活動入場，收在同一處', '點高雄數位市民，出示動態身分碼', '授權了什麼、沒授權什麼，一眼看清楚', '收回卡片', '到台北出差：新增台北通', '只取必要欄位，同意後收進憑證夾'],
  note: `<b>像 Apple 錢包一樣收憑證</b><br>各城市的數位市民、MeNGo 定期票、活動入場憑證疊在一起；點一張就放大，出示 <span class="k">30 秒換一次</span>的動態碼。<br><br>每張憑證都寫清楚<b>授權給 Super APP 的欄位</b>與<b>不會提供的資料</b>，可一鍵解除綁定。<br><br>右上 ＋ 可加入其他城市的市民憑證。<span class="k">跨城介接需各市同意，畫面為示意。</span>`,
  render(opts = {}) {
    const ctx = { passes: PASSES.map(p => (p.id === 'tp' && STATE.renewed ? { ...p, v2: '2026/12/15' } : p)).concat(Object.keys(STATE_PASSES).filter(k => STATE[k]).map(k => STATE_PASSES[k])), open: -1, cat: opts.cat || 'id' };
    ctx.view = () => ctx.passes.filter(p => p.cat === ctx.cat);
    $screen.innerHTML = `<div class="wal">
      ${SB()}
      <div class="wal-top"><h2>憑證夾</h2><span class="plus" data-k="plus">＋</span></div>
      <div class="wal-sub">一個帳號，帶著每座城市的市民身分</div>
      <div class="wcats" data-k="wcats"></div>
      <div class="stack" data-k="stack"></div>
      ${tabs('憑證夾')}
      <div class="toast fx" data-k="toast"></div>
      <div class="scrim fx" data-k="scrim" style="z-index:30"></div>
      <div class="bsheet fx-up" data-k="sheet" style="z-index:31"></div>
    </div>`;
    const stack = P.$('stack');
    const layout = () => {
      const H = stack.clientHeight || 560;
      const cards = [...stack.querySelectorAll('.pass:not(.add)')], add = stack.querySelector('.pass.add');
      cards.forEach((c, i) => {
        if (ctx.open < 0) c.style.transform = `translateY(${i * GAP}px)`;
        else if (i === ctx.open) c.style.transform = 'translateY(4px)';
        else { const k = i < ctx.open ? i : i - 1; c.style.transform = `translateY(${H - 16 + k * 6}px) scale(${0.94 - k * 0.02})`; }
      });
      if (add) {
        add.style.transform = `translateY(${(cards.length - 1) * GAP + 220}px)`;
        add.style.opacity = ctx.open < 0 ? 1 : 0; add.style.pointerEvents = ctx.open < 0 ? 'auto' : 'none';
      }
      const d = P.$('detail');
      if (d) d.classList.toggle('in', ctx.open >= 0);
    };
    const qrTimer = { n: 30, seed: 5 };
    const tick = () => {
      const ring = P.$('ring'); if (!ring) return;
      qrTimer.n--; if (qrTimer.n <= 0) { qrTimer.n = 30; qrTimer.seed += 7; const q = P.$('qr'); q.classList.add('flash'); setTimeout(() => { q.innerHTML = qrCells(qrTimer.seed); q.classList.remove('flash'); }, 160); }
      P.$('sec').textContent = qrTimer.n;
      ring.style.background = `conic-gradient(#2346D8 0 ${qrTimer.n / 30 * 100}%,#E2E8F0 ${qrTimer.n / 30 * 100}% 100%)`;
    };
    const iv = setInterval(() => { if (!PAUSED && ctx.open >= 0) tick(); }, 200); // 加速 5 倍，示範時看得到換碼
    cleanups.push(() => clearInterval(iv));
    const build = () => {
      P.$('wcats').innerHTML = WCATS.map(([k, t]) => `<span data-wc="${k}" class="${k === ctx.cat ? 'on' : ''}">${t.replace(' ', '<br>')}<i>${ctx.passes.filter(p => p.cat === k).length}</i></span>`).join('');
      stack.innerHTML = ctx.view().map(passHTML).join('') +
        (ctx.cat === 'id' ? `<div class="pass add" data-k="addcard"><b>＋ 加入其他城市的市民憑證</b><small>到外縣市也不用再下載一個 App</small></div>` : '') +
        `<div class="detail" data-k="detail" style="z-index:40"></div>`;
      layout();
    };
    ctx.expand = (i) => {
      ctx.open = i; const p = ctx.view()[i]; qrTimer.n = 30;
      P.$('detail').innerHTML = `
        <div class="qrbox" style="width:152px;padding:11px"><div class="qr" data-k="qr" style="width:130px;height:130px">${qrCells(qrTimer.seed)}</div><div class="ring" data-k="ring"><span data-k="sec">30</span></div></div>
        <div class="qr-note">⟳ 動態碼定時更新　截圖無效</div>
        ${p.tags ? `<div class="dtags"><div class="dh">身分標籤 <small>由各局處依你的資料自動標記</small></div>${p.tags.map(([i, t, d]) => `<div class="dt"><b>${i} ${t}</b><span>${d}</span></div>`).join('')}<div class="dt no">${TAG_NOT_YET}</div></div>` : ''}
        <div class="dfields" data-k="fields">${p.fields.map(([a, b, c]) => `<div class="field"><span style="color:#64748B">${a}</span><span class="${c}" style="text-align:right;max-width:62%">${c === 'ok' ? '✓ ' : c === 'no' ? '✕ ' : ''}${b}</span></div>`).join('')}</div>
        <div class="dbtns"><span>授權紀錄</span><span>解除綁定</span><span class="pri" data-k="done">完成</span></div>`;
      P.$('done').onclick = (e) => { e.stopPropagation(); ctx.collapse(); };
      layout();
    };
    ctx.collapse = () => { ctx.open = -1; layout(); };
    stack.addEventListener('click', (e) => {
      if (e.target.closest('.detail')) return;
      const c = e.target.closest('.pass'); if (!c) return;
      if (c.classList.contains('add')) return ctx.openAdd();
      const i = +c.dataset.i; ctx.open === i ? ctx.collapse() : ctx.expand(i);
    });
    /* 新增憑證：選城市 → 同意授權 → 收進憑證夾 */
    const sheet = P.$('sheet'), scrim = P.$('scrim');
    ctx.openAdd = () => {
      ctx.collapse(); if (ctx.cat !== 'id') { ctx.cat = 'id'; build(); }
      sheet.innerHTML = `<div class="grab"></div>
        <div style="font-size:17px;font-weight:900">加入市民憑證</div>
        <div class="small mt6">選擇要綁定的城市，之後在那座城市的服務都不用再登入。</div>
        <div class="sheet-list">
          <div class="opt" data-k="opt-tpe"><div class="ic" style="background:#0F7C93">🪪</div><div class="tx">台北通<small>台北市政府</small></div>›</div>
          <div class="opt" data-k="opt-txg"><div class="ic" style="background:#2A78DE">🪪</div><div class="tx">台中通<small>台中市政府</small></div>›</div>
          <div class="opt" style="opacity:.55"><div class="ic" style="background:#94A3B8">🧳</div><div class="tx">台南市<small>尚未上架市民身分，可先用訪客模式</small></div></div>
        </div>
        <div class="note2">示意：跨城綁定需該市政府同意介接，實際名單以租戶上架為準</div>`;
      on(scrim); on(sheet);
      P.$('opt-tpe').onclick = () => ctx.consent();
      P.$('opt-txg').onclick = () => ctx.consent();
    };
    ctx.closeSheet = () => { sheet.classList.remove('in'); scrim.classList.remove('in'); };
    scrim.addEventListener('click', ctx.closeSheet);
    ctx.consent = () => {
      sheet.innerHTML = `<div class="grab"></div>
        <div style="font-size:17px;font-weight:900">綁定台北通</div>
        <div class="small mt6">Super APP 只會取得下面勾選的欄位，可隨時解除。</div>
        <div style="margin-top:10px;font-size:12.5px;font-weight:800;color:#1C3BB8">只會取得</div>
        <div class="field"><span>實名核驗標記</span><span class="ok chk" data-k="c1">✓</span></div>
        <div class="field"><span>市民身分效期</span><span class="ok chk" data-k="c2">✓</span></div>
        <div style="margin-top:10px;font-size:12.5px;font-weight:800;color:#64748B">不會取得</div>
        <div class="field"><span class="no">戶籍地址、繳費紀錄</span><span class="no chk" data-k="c3">✕</span></div>
        <div class="btn btn-green mt12" data-k="agree">同意並收進憑證夾</div>
        <div class="note2">示意：跨城綁定需台北市政府同意介接</div>`;
      ['c1', 'c2', 'c3'].forEach((k, i) => later(() => on(P.$(k)), 120 + i * 220));
      P.$('agree').onclick = () => ctx.addPass();
    };
    ctx.addPass = () => {
      ctx.closeSheet();
      if (!ctx.passes.find(p => p.id === NEW_PASS.id)) ctx.passes.push(NEW_PASS);
      Object.assign(BASE_CITIES[1].ident, { st: 'ok', sub: '已綁定　開台北通、1999 陳情都不用再登入' });   // 綁定後，首頁台北的 🔒 服務解鎖
      build();
      const n = stack.querySelector(`.pass[data-i="${ctx.view().length - 1}"]`);
      const final = n.style.transform; n.style.transition = 'none'; n.style.transform = 'translateY(640px)'; n.style.opacity = '0';
      void n.offsetWidth; n.style.transition = ''; n.style.transform = final; n.style.opacity = '1';
      const t = P.$('toast'); t.innerHTML = '🪪 <b>台北通已收進憑證夾</b><div class="small" style="color:#AEBBDD;margin-top:3px">首頁「各城市服務捷徑」裡，台北的 🔒 服務會自動解鎖</div>';
      later(() => on(t), 450); later(() => t.classList.remove('in'), 3200);
    };
    P.$('plus').addEventListener('click', () => ctx.openAdd());
    P.$('wcats').addEventListener('click', (e) => { const t = e.target.closest('[data-wc]'); if (!t) return; ctx.cat = t.dataset.wc; ctx.open = -1; build(); });
    build();
    later(() => softTip(stack.querySelector('.pass[data-i="0"] .nm'), '點卡片出示動態碼　上方切換類別', 6000), 500);
    return ctx;
  },
});

/* 替你做過的事：系統替市民做的動作與用到的資料（也是給政府的稽核紀錄）。內容對應其他情境的故事，皆為示意。 */
const DID_TYPE = { '提醒': 'p-blue', '帶入資料': 'p-orange', '送出': 'p-green', '續購': 'p-gray' };
/* 第一筆依 F-05 是否續購切換：續購後記「續購」，還沒續購只記到期提醒 */
const DID_RENEWED = { tm: '11/12 08:00', ty: '續購', t: '定期票一鍵續購，前往 MeNGo 付款（付款在 MeNGo 完成）', fresh: true };
const DID_REMIND = { tm: '11/12 08:00', ty: '提醒', t: '定期票 3 天後到期提醒（尚未續購）' };
const DID_QUEST = { tm: '11/15 16:40', ty: '提醒', t: '週末城市任務完成，20 點入帳' };   // 只在完成週末城市任務後出現；點數沿用同一筆 20 點
const didList = () => [...(STATE.quest ? [DID_QUEST] : []), STATE.renewed ? DID_RENEWED : DID_REMIND, ...DID];
const DID = [
  { tm: '11/12 07:05', ty: '提醒', t: '通勤路線施工提醒：博愛二路 9:00 起封閉一線道' },
  { tm: '11/12 06:58', ty: '提醒', t: '慣用公車誤點，建議改搭捷運紅線' },
  { tm: '11/9', ty: '送出', t: '拍照陳情已送出，案號 KH-1999-20261109-088', data: '手機號碼、所在位置' },
  { tm: '11/7', ty: '帶入資料', t: '駁二港邊週末市集報名，帶入姓名', data: '姓名' },
];

/* =====================================================================
   我的：身分、授權、提醒、案件（取代原本放 AI 客服的位置）
   ===================================================================== */
def({
  id: 'me', no: '👤', tag: 'MVP · 改', title: '我的',
  steps: ['一個帳號，看清楚自己在各城市的身分', '授權了哪些資料、誰用過，都查得到', '主動提醒收不收，自己決定', '報修案件進度追得到', '系統替你做過的事，一筆一筆查得到'],
  note: '<b>「我的」管的是「我跟城市的關係」</b><br>不是會員中心，是一個市民的控制台：<br>・<span class="k">以城市收攏</span>：每座城市一格，裡面是那座城市的身分、報名的活動、陳情案件、票卡<br>・授權給 Super APP 哪些欄位、<span class="k">誰在什麼時候用過</span><br>・主動提醒逐項開關（豪雨移車會用到住家位置，預設要問過才開）<br>・1999 案件進度<br>・<span class="k">系統替你做過的事，一筆一筆查得到</span>：提醒、帶入資料、送出、續購都有紀錄，用了哪些資料也寫清楚，覺得不對可以回報。這也是給政府看的稽核紀錄<br><br>「替你做過的事」記系統的行為；「最近誰用過」記哪個服務用了你的資料。<br><br>點數、客服、設定放在最下面。',
  render(opts = {}) {
    const row = (ic, t, sub, right, k = '') => `<div class="me-row"${k ? ` data-k="${k}"` : ''}><span class="mi">${ic}</span><div class="mt"><b>${t}</b>${sub ? `<small>${sub}</small>` : ''}</div>${right}</div>`;
    const tog = (k, onn) => `<div class="tog${onn ? ' on' : ''}" data-k="${k}" style="cursor:pointer;flex:none"></div>`;
    $screen.innerHTML = `
    ${SB()}
    <div class="body mepg" data-k="me">
      <div class="me-scroll" data-k="scroll">
        <div class="me-hero">
          <div class="av">林</div>
          <div><div class="nm">林○明</div><div class="small">Super APP 帳號 · 一個帳號走遍各城市</div></div>
          <span class="pill p-green" style="margin-left:auto">✓ 已實名</span>
        </div>

        <div class="me-h">我的城市</div>
        <div class="city-tabs" data-k="ctabs"><span class="on" data-ct="khh">高雄市</span><span data-ct="tpe">台北市</span><span data-ct="txg">台中市</span></div>
        <div class="me-card cpanel" data-cp="khh">
          <div class="cp-head"><div><b>🪪 高雄數位市民</b><small>開 MeNGo、1999 報修、活動報名都免登入</small><div class="ptags lt"><span>🏠 設籍三民區</span><span>🤝 志工</span></div></div><span class="pill p-green">已綁定</span></div>
          <div class="cp-sec" data-k="evts">
            <div class="cp-t">🎪 報名的活動<span>${3 + (STATE.yancheng ? 1 : 0)}</span></div>
            ${STATE.yancheng ? `<div class="evt-row" data-go-wallet><img src="${IMG}nightmarket.jpg" alt=""><div style="flex:1;min-width:0"><div class="t">鹽埕港邊樂團之夜（示意）</div><div class="d">11/15（六）19:00 · 剛剛預約</div></div><span class="pill p-green">已預約 ›</span></div>` : ''}
            <div class="evt-row" data-k="ev1"><img src="${IMG}nightmarket.jpg" alt=""><div style="flex:1;min-width:0"><div class="t">駁二港邊週末市集</div><div class="d">11/15（六）14:00–21:00 · 集章 3/3</div></div><span class="pill p-green">已報名 ›</span></div>
            <div class="evt-row"><img src="${IMG}theater.jpg" alt=""><div style="flex:1;min-width:0"><div class="t">駁二在地劇團展演（示意）</div><div class="d">11/15（六）19:00 · ${STATE.pier2 ? '剛剛報名' : '有名額會通知你'}</div></div>${STATE.pier2 ? '<span class="pill p-green">已報名 ›</span>' : '<span class="pill p-orange">候補第 3 位</span>'}</div>
            <div class="evt-row"><img src="${IMG}farmmarket.jpg" alt=""><div style="flex:1;min-width:0"><div class="t">美濃小農市集（示意）</div><div class="d">11/16（日）· 活動前一天提醒你</div></div><span class="pill p-gray">已收藏</span></div>
          </div>
          <div class="cp-sec" data-k="case">
            <div class="cp-t">📮 陳情案件<span>2</span></div>
            <div style="padding:6px 0 10px">
              <div class="row"><b style="font-size:13px">路面坑洞 · 三民區建工路</b><span class="pill p-orange" style="margin-left:auto" data-k="cst">已派工</span></div>
              <div class="small mt6">案號 …0088 · 11/9 立案 · 工務局養工處</div>
              <div class="prog"><i data-k="bar"></i></div>
              <div class="pl"><span class="on">立案</span><span class="on">派工</span><span data-k="p3">處理中</span><span data-k="p4">完工</span></div>
            </div>
            <div class="row" style="padding:8px 0;border-top:1px solid var(--line)"><b style="font-size:13px">路燈不亮 · 鼓山區（示意）</b><span class="pill p-green" style="margin-left:auto">已完工</span></div>
          </div>
          <div class="cp-sec">
            <div class="cp-t">🎫 票卡與憑證<span>2</span></div>
            ${row('🚋', '南高屏 TPASS 定期票', `效期至 ${STATE.renewed ? '2026/12/15' : '2026/11/15'} · 本月搭乘 27 次`, '<span class="small">›</span>', 'pass1')}
            ${row('🎟️', '駁二市集入場憑證', '11/15 出示即可入場', '<span class="small">›</span>', 'pass2')}
          </div>
        </div>
        <div class="me-card cpanel" data-cp="tpe" style="display:none">
          <div class="cp-head"><div><b>🪪 台北通</b><small>尚未綁定 · 公車、天氣不用綁也能用</small></div><span class="pill p-blue" data-bind style="cursor:pointer">綁定 ›</span></div>
          <div class="cp-empty">在台北還沒有報名或陳情紀錄。<br>綁定台北通後，你在台北報名的活動、陳情案件、票卡都會收在這裡。</div>
          <div class="cp-sec"><div class="cp-t">🕘 最近在台北用過</div><div class="small" style="padding:4px 0 10px">捷運到站、天氣告警（開放服務，不需綁定）</div></div>
        </div>
        <div class="me-card cpanel" data-cp="txg" style="display:none">
          <div class="cp-head"><div><b>🪪 台中通</b><small>尚未綁定 · 公車、停車不用綁也能用</small></div><span class="pill p-blue" data-bind style="cursor:pointer">綁定 ›</span></div>
          <div class="cp-empty">在台中還沒有報名或陳情紀錄。<br>綁定台中通後，在台中的紀錄都會收在這裡。</div>
        </div>

        <div class="me-h">🗂 替你做過的事</div>
        <div class="me-card" data-k="did">
          <div class="small" style="padding:10px 2px 2px">系統替你做的每一件事和用到的資料，都記在這裡</div>
          ${didList().map((d, i) => `<div class="did-row">
            <div class="did-tm">${d.tm}</div>
            <div class="did-bd"><div class="did-h"><span class="pill ${DID_TYPE[d.ty]}">${d.ty}</span>${d.fresh ? '<span class="pill p-green">剛剛</span>' : ''}</div>
              <div class="did-t">${d.t}</div>${d.data ? `<div class="did-d">用到的資料：${d.data}</div>` : ''}</div>
            <span class="did-no" data-notme="${i}">這不是我</span>
          </div>`).join('')}
          <div class="row" style="gap:8px;margin:10px 0 12px"><span class="me-btn" data-k="didall">查看完整紀錄</span><span class="me-btn" data-k="diddl">下載紀錄</span></div>
        </div>

        <div class="me-h">隱私與授權</div>
        <div class="me-card" data-k="priv">
          <div class="small" style="padding:10px 2px 4px">Super APP 目前拿到的資料</div>
          <div class="chips"><span>實名核驗標記</span><span>身分標籤</span><span>常用路線（只存在手機）</span></div>
          <div class="me-sub" data-k="log">
            <div class="small" style="font-weight:800;color:#1E293B;margin:10px 0 4px">最近誰用過</div>
            <div class="lg"><b>11/8 07:12</b>MeNGo 以數位市民登入</div>
            <div class="lg"><b>11/7 21:40</b>駁二市集報名帶入姓名</div>
            <div class="lg"><b>11/7 09:05</b>1999 報修帶入手機號碼</div>
          </div>
          <div class="row" style="gap:8px;margin:10px 0 4px"><span class="me-btn" data-k="logbtn">查看完整紀錄</span><span class="me-btn red">解除所有綁定</span></div>
        </div>

        <div class="me-h">主動提醒</div>
        <div class="me-card">
          ${row('🚌', '慣用公車誤點', '給替代路線', tog('t1', true))}
          ${row('🚧', '通勤路線施工', '出門前一晚提醒', tog('t2', true))}
          ${row('🌧️', '豪雨：住家附近積水', '需要用到住家位置', tog('t3', true))}
          ${row('🎪', '附近的在地活動', '每週最多 2 則', tog('t4', true), 'r4')}
          ${row('🎫', '定期票到期', '到期前 3 天提醒，一鍵續購', tog('t5', true))}
          ${row('🗺️', '每週城市任務', '每週最多 1 則', tog('t6', true))}
        </div>

        <div class="me-card" style="margin-top:12px">
          ${row('🎁', '我的點數', '合作店家折抵', '<b style="color:#1C3BB8">20 點 ›</b>')}
          ${row('📞', '客服與 1999', 'AI 答不出來就找真人', '<span class="small">›</span>')}
          ${row('⚙️', '設定', '', '<span class="small">›</span>')}
        </div>
        <div class="src" style="text-align:center;margin:12px 0 20px">人名、案號、紀錄皆為示意</div>
      </div>
      <div class="toast fx" data-k="toast" style="bottom:14px"></div>
    </div>
    ${tabs('我的')}`;
    const toast = (h) => { const t = P.$('toast'); t.innerHTML = h; t.classList.remove('in'); void t.offsetWidth; on(t); later(() => t.classList.remove('in'), 2400); };
    $screen.querySelectorAll('.tog').forEach(t => t.addEventListener('click', () => {
      t.classList.toggle('on');
      if (t.dataset.k === 'big') P.$('me').classList.toggle('bigtext', t.classList.contains('on'));
      else if (t.dataset.k === 't4') toast(t.classList.contains('on') ? '🎪 已開啟：附近的在地活動' : '🔕 不再推播在地活動<div class="small" style="color:#AEBBDD;margin-top:3px">其他提醒照常</div>');
    }));
    $screen.querySelectorAll('[data-notme]').forEach(x => x.addEventListener('click', () => toast('✓ 已回報，我們會確認這筆紀錄')));
    P.$('didall').addEventListener('click', () => toast('🗂 完整紀錄（示意）<div class="small" style="color:#AEBBDD;margin-top:3px">可依城市、類型、日期篩選</div>'));
    P.$('diddl').addEventListener('click', () => toast('⬇ 紀錄已匯出（示意）<div class="small" style="color:#AEBBDD;margin-top:3px">含時間、動作與用到的資料</div>'));
    P.$('logbtn').addEventListener('click', () => P.$('log').classList.toggle('glow'));
    P.$('ev1').addEventListener('click', () => go('wallet', { cat: 'ev' }));
    P.$('pass1').addEventListener('click', () => go('wallet', { cat: 'tr' }));
    P.$('pass2').addEventListener('click', () => go('wallet', { cat: 'ev' }));
    $screen.querySelectorAll('[data-go-wallet]').forEach(x => x.addEventListener('click', () => go('wallet', { cat: 'ev' })));
    $screen.querySelectorAll('[data-bind]').forEach(b => b.addEventListener('click', () => go('wallet')));
    P.$('ctabs').addEventListener('click', (e) => {
      const t = e.target.closest('[data-ct]'); if (!t) return;
      $screen.querySelectorAll('[data-ct]').forEach(x => x.classList.toggle('on', x === t));
      $screen.querySelectorAll('[data-cp]').forEach(x => { x.style.display = x.dataset.cp === t.dataset.ct ? '' : 'none'; });
    });
    /* 從其他情境跳過來時，捲到相關區塊並閃一下 */
    if (opts.focus === 'case') { P.$('bar').style.transform = 'scaleX(1)'; P.$('p3').classList.add('on'); P.$('p4').classList.add('on'); P.$('cst').textContent = '已完工'; }
    if (opts.focus && P.$(opts.focus)) {
      const t = P.$(opts.focus), sc = P.$('scroll');
      later(() => { animScroll(sc, 'scrollTop', Math.max(0, t.offsetTop - 50), 600); t.classList.add('glow'); }, 200);
      later(() => t.classList.remove('glow'), 2600);
    }
    return { toast };
  },
});

