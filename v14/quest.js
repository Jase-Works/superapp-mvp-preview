/* v12：週末城市任務（回訪機制最小版）
   把既有的路線（F-01）、乘車碼（F-02）、活動（F-03）、主動通知（F-05）串成一個故事，
   只新增三個畫面：任務卡、到站打卡、地圖點亮。不做寵物養成、RPG 地圖、貨幣兌換、城市 IP。
   每顆按鈕都有真的功能（自己換到下一個畫面）；flow 只負責亮起＋提示，照 v5 guide() 寫法。
   店家、點數、座標皆為示意。地圖：GM.ok 時用 Google 地圖，否則退回示意底圖。 */
const QLL = {
  dayi: { lat: 22.6196, lng: 120.2858 },     // 輕軌駁二大義站一帶（示意）
  pier2: { lat: 22.6203, lng: 120.2822 },    // 駁二區域中心（示意）
  yancheng: { lat: 22.6262, lng: 120.2858 }, // 鹽埕區域中心（示意）
};
const QUEST_STAMPS = [['📍', '到站打卡'], ['🎪', '活動報到'], ['🗳️', '人氣攤位投票']];
/* 三個章＋進度條；n＝已集到幾章 */
const questStamps = (n) => `
  <div class="tiles">${QUEST_STAMPS.map(([ic, t], i) => `<div class="tile stamp${i < n ? ' got' : ''}" data-k="q${i + 1}" style="cursor:pointer"><b>${i < n ? '✓' : ic}</b>${i + 1}. ${t}</div>`).join('')}</div>
  <div class="prog"><i style="transform:scaleX(${n / 3})"></i></div>
  <div class="row mt6"><span class="small">集章進度</span><b style="margin-left:auto;font-size:13px;color:#1C3BB8">${n} / 3</b></div>`;
/* 鎖定畫面＋一則通知（沿用 F-05 的通知樣式） */
const questLock = (d, t, title, body, acts) => `
  <div class="lock"></div>
  <div style="position:relative">${SB(true)}</div>
  <div class="body" style="position:relative">
    <div class="clock"><div class="d">${d}</div><div class="t">${t}</div></div>
    <div class="notis" style="margin-top:22px">
      <div class="noti fx-down" data-k="noti"><div class="h"><span class="app" style="background:#2346D8">S</span>Super APP · 城市任務<span style="margin-left:auto">${t}</span></div><div class="t">${title}</div><div class="c">${body}</div><div class="acts">${acts}</div></div>
    </div>
  </div>`;

def({
  id: 'quest', grp: '地圖', no: 'Q', tag: 'F-03×F-05 · 新', title: '週末城市任務',
  steps: ['週四晚上收到本週任務', '看任務卡：三個章、獎勵 20 點', '排路線出門，出示乘車碼', '到站打卡蓋第 1 章', '地圖點亮駁二', '活動報到、攤位投票，集滿 3 章', '20 點入帳，提醒附近高雄幣店家', '回家後預告下週任務'],
  note: '<b>回訪最小版</b><br>一個任務就是<span class="k">一次搭車、一次參加活動、一次在地消費</span>。<br><br>只新增任務卡、到站打卡、地圖點亮；其他沿用 MVP 既有功能（路線、乘車碼、活動報到、主動通知、高雄幣）。<br><br>不做寵物養成、RPG 地圖、貨幣兌換、城市 IP。<br>任務完成會記在「我的 → 替你做過的事」；點數沿用同一筆 20 點，不重複加。店家、點數為示意。',
  render(opts = {}) {
    const st = { stage: '', stamps: 0 };
    const toastHTML = '<div class="toast fx" data-k="toast" style="bottom:84px;z-index:25"></div>';
    st.toast = (h) => { const t = P.$('toast'); if (!t) return; t.innerHTML = h; t.classList.remove('in'); void t.offsetWidth; on(t); later(() => t.classList.remove('in'), 2400); };
    const set = (stage, html) => { st.stage = stage; $screen.innerHTML = html + toastHTML; };
    const pop = (k) => later(() => on(P.$(k)), 40);

    /* 1. 週四 20:00 任務通知 */
    st.lock = () => {
      set('lock', questLock('11 月 13 日 星期四', '20:00', '🗺️ 本週城市任務：駁二港邊週末市集', '搭車到駁二、參加活動，集滿 3 章可得 20 點', '<span class="pri" data-k="see" style="cursor:pointer;background:#2346D8">看任務</span><span data-k="nolater" style="cursor:pointer">先不要</span>'));
      pop('noti');
      P.$('see').onclick = () => st.card();
      P.$('nolater').onclick = () => st.toast('🔕 這週不提醒了，任務還是看得到');
    };

    /* 2. 任務卡（新畫面） */
    st.card = () => {
      set('card', `${SB()}
      <div class="body" style="display:flex;flex-direction:column">
        <div class="hero-img" style="height:150px;background-image:linear-gradient(180deg,rgba(15,23,42,.35),rgba(15,23,42,.05) 40%,rgba(15,23,42,.6)),url('${IMG}nightmarket.jpg')"><div class="tag"><span class="pill p-orange">本週城市任務 · 示意</span></div></div>
        <div style="padding:12px 16px 0;flex:1;overflow-y:auto">
          <div style="font-size:18px;font-weight:900">駁二港邊週末市集</div>
          <div class="small mt6">📅 11/15（六）14:00–21:00　·　📍 駁二藝術特區</div>
          <div class="row mt8" style="gap:6px"><span class="pill p-green">🎁 獎勵 20 點</span><span class="pill p-blue">已報名 · 身分由數位市民帶入</span></div>
          <div class="card mt10">
            <b style="font-size:14px">集滿 3 章完成任務</b>
            ${questStamps(0)}
          </div>
          <div class="small mt10" style="line-height:1.6;color:#566079">搭車到駁二大義站打卡，到現場報到、幫喜歡的攤位投一票，就完成了。</div>
          <div class="btn btn-green mt12" data-k="plan" style="cursor:pointer">🧭 排路線出門</div>
          <div class="src" style="text-align:center;margin-bottom:14px">任務內容、點數皆為示意</div>
        </div>
      </div>${tabs('地圖')}`);
      P.$('plan').onclick = () => st.go1();
    };

    /* 3. 出門：沿用 F-01 的路線卡與 F-02 乘車碼（簡化成一張卡） */
    st.go1 = () => {
      set('go', `${SB()}
      <div class="body">
        <div class="map" style="background-image:url('${IMG}osm_zuoying.jpg')"></div>
        <div class="search"><div class="l"><span class="dot" style="background:#2E7DF2"></span>目前位置</div><div class="l" style="border-top:1px solid #E2E8F0"><span class="dot" style="background:#2346D8"></span><b>駁二大義站</b><span class="pill p-orange" style="margin-left:auto">城市任務</span></div></div>
        <div class="sheet fx-up" data-k="sheet">
          <div class="grab"></div>
          <div class="row"><b style="font-size:15px">建議路線</b><span class="live" style="margin-left:auto">● 即時動態</span></div>
          <div class="route best">
            <div class="row"><span class="leg" style="background:#E05A6F">捷 紅線</span>›<span class="leg" style="background:#2D7857">🚋 輕軌</span><span class="small" style="margin-left:4px">至駁二大義站</span><span class="pill p-green" style="margin-left:auto">推薦</span></div>
            <div class="row mt6"><span class="eta">約 32 分</span><span class="small" style="margin-left:8px">在美麗島轉乘 · 定期票可搭</span></div>
          </div>
          <div class="btn btn-green mt10" data-k="ticket" style="cursor:pointer">🎫 出示乘車碼</div>
          <div class="src">資料：<b>iBus+ 動態</b>、TDX　路線時間為示意</div>
        </div>
        <div class="scrim fx" data-k="scrim"></div>
        <div class="qr-sheet" data-k="qrs">
          <div class="grab"></div>
          <div class="row"><b style="font-size:16px">南高屏 TPASS 定期票</b><span class="pill p-green" style="margin-left:auto">有效</span></div>
          <div class="small mt6">捷運紅線 → 輕軌都在定期票範圍，刷碼即可</div>
          <div class="qrbox"><div class="qr" data-k="qr">${qrCells(15)}</div><div class="ring" data-k="ring"><span data-k="sec">30</span></div></div>
          <div style="text-align:center;font-size:12px;margin-top:10px;color:#566079">⟳ <span data-k="sec">30</span> 秒自動換碼　·　截圖無效　·　由 MeNGo 票證中台發碼</div>
          <div class="btn btn-green mt12" data-k="board" style="cursor:pointer">✓ 已刷碼上車</div>
        </div>
      </div>${tabs('地圖')}`);
      pop('sheet');
      if (GM.ok) {
        const map = mountGMap(QLL.dayi, 13);
        meMarker(map, LL.juDan);
        htmlMarker(map, QLL.dayi, pinHTML('#2346D8', '🚋', '駁二大義站'));
        gRoute(LL.juDan, QLL.dayi, 'TRANSIT').then(r => (r.via === 'straight' ? gRoute(LL.juDan, QLL.dayi, 'DRIVING') : r))
          .then(r => { if (st.stage === 'go') drawRoute(map, r.path, '#2346D8'); }).catch(() => {});
      }
      st.qrOn = false;
      P.$('ticket').onclick = () => { on(P.$('scrim')); on(P.$('qrs')); st.qrOn = true; if (!st.qrRun) { runQR(P.$('qrs'), 15); st.qrRun = true; } };
      P.$('scrim').onclick = () => { P.$('qrs').classList.remove('in'); P.$('scrim').classList.remove('in'); st.qrOn = false; };
      P.$('board').onclick = () => { st.qrRun = false; st.arrive(); };
    };

    /* 4. 到站打卡（新畫面） */
    st.arrive = () => {
      set('arrive', `${SB()}
      <div class="body">
        <div class="map" style="background-image:url('${IMG}osm_sanmin.jpg')"></div>
        <div class="arrive fx-down" data-k="arr">📍 <b>已到駁二大義站附近</b><div class="small" style="color:#AEBBDD;margin-top:3px">城市任務：可以打卡蓋第 1 章了</div></div>
        <div class="sheet fx-up" data-k="sheet">
          <div class="grab"></div>
          <div class="row"><b style="font-size:15px">到站打卡</b><span class="pill p-orange" style="margin-left:auto">駁二港邊週末市集</span></div>
          <div data-k="stamps">${questStamps(0)}</div>
          <div class="btn btn-green mt10" data-k="checkin" style="cursor:pointer">📍 打卡蓋章</div>
          <div class="small mt6" data-k="how" style="text-align:center">用 GPS 定位確認你在站點附近　·　或掃現場 QR</div>
        </div>
      </div>${tabs('地圖')}`);
      pop('arr'); pop('sheet');
      if (GM.ok) { const map = mountGMap(QLL.dayi, 17); meMarker(map, QLL.dayi); htmlMarker(map, { lat: QLL.dayi.lat + 0.0004, lng: QLL.dayi.lng }, pinHTML('#2D7857', '🚋', '駁二大義站')); }
      P.$('checkin').onclick = () => {
        if (st.stamps >= 1) return st.lit();
        st.stamps = 1; P.$('stamps').innerHTML = questStamps(1);
        P.$('checkin').textContent = '看看你點亮了哪裡 ›';
        P.$('how').textContent = '✓ 已用 GPS 確認到站　11/15 14:12';
        st.toast('✓ <b>第 1 章：到站打卡</b><div class="small" style="color:#AEBBDD;margin-top:3px">還差活動報到、攤位投票</div>');
      };
    };

    /* 5. 地圖點亮（新畫面）：駁二亮起，鹽埕還是灰的 */
    st.lit = () => {
      set('lit', `${SB()}
      <div class="body">
        <div class="map" data-k="litmap" style="background-image:url('${IMG}osm_sanmin.jpg')">
          <div class="q-area on" style="left:40px;top:300px;width:170px;height:150px"><span>✨ 駁二<br><small>已點亮</small></span></div>
          <div class="q-area" style="left:170px;top:150px;width:160px;height:140px"><span>鹽埕<br><small>還沒點亮</small></span></div>
        </div>
        <div class="arrive fx-down" data-k="arr">✨ <b>你點亮了駁二</b><div class="small" style="color:#AEBBDD;margin-top:3px">每完成一個城市任務，就點亮一個街區</div></div>
        <div class="sheet fx-up" data-k="sheet">
          <div class="grab"></div>
          <div class="row"><b style="font-size:15px">我的高雄地圖</b><span class="pill p-blue" style="margin-left:auto">已點亮 1 區</span></div>
          <div class="row mt8" style="gap:8px"><span class="pill p-orange">✨ 駁二 · 已點亮</span><span class="pill p-gray">鹽埕 · 還沒點亮</span></div>
          <div class="small mt8">鹽埕就在旁邊，下週任務帶你去。</div>
          <div class="btn btn-green mt10" data-k="toevt" style="cursor:pointer">🎪 去活動現場報到</div>
          <div class="src">點亮範圍為示意</div>
        </div>
      </div>${tabs('地圖')}`);
      pop('arr'); pop('sheet');
      if (GM.ok) {
        const m = P.$('litmap'); m.style.backgroundImage = 'none'; m.innerHTML = '<div class="gmap"></div>';
        const map = gMap(m.firstChild, { lat: 22.6210, lng: 120.2840 }, 15);
        new google.maps.Circle({ map, center: QLL.pier2, radius: 330, fillColor: '#F0922A', fillOpacity: 0.38, strokeColor: '#F0922A', strokeOpacity: 0.9, strokeWeight: 2 });
        new google.maps.Circle({ map, center: QLL.yancheng, radius: 330, fillColor: '#64748B', fillOpacity: 0.28, strokeColor: '#64748B', strokeOpacity: 0.6, strokeWeight: 2 });
        htmlMarker(map, QLL.pier2, '<div class="q-lab on">✨ 駁二 · 已點亮</div>');
        htmlMarker(map, QLL.yancheng, '<div class="q-lab">鹽埕 · 還沒點亮</div>');
        meMarker(map, QLL.dayi);
      }
      P.$('toevt').onclick = () => st.evt();
    };

    /* 6. 活動報到＋投票（沿用 F-03 的現場報到、人氣攤位投票） */
    st.evt = () => {
      set('evt', `${SB()}
      <div class="body" style="display:flex;flex-direction:column">
        <div class="hero-img" style="height:150px;background-image:linear-gradient(180deg,rgba(15,23,42,.35),rgba(15,23,42,.05) 40%,rgba(15,23,42,.55)),url('${IMG}nightmarket.jpg')"><div class="tag"><span class="pill p-orange">在地活動 · 示意</span></div></div>
        <div data-k="evsc" style="padding:12px 16px 0;flex:1;overflow-y:auto">
          <div style="font-size:18px;font-weight:900">駁二港邊週末市集</div>
          <div class="small mt6">📍 駁二藝術特區　·　11/15（六）14:00–21:00　·　已報名</div>
          <div class="small mt10" style="font-weight:800;color:#566079">活動當天到現場</div>
          <div data-k="stamps">${questStamps(1)}</div>
          <div class="card mt10 fx" data-k="vote" style="display:none">
            <b style="font-size:13.5px">幫喜歡的攤位投一票</b>
            <div class="row mt8" style="gap:6px;flex-wrap:wrap" data-k="booths"><span class="pill p-gray" data-b="1" style="cursor:pointer">🍢 港邊炭烤（示意）</span><span class="pill p-gray" data-b="2" style="cursor:pointer">🧁 手作甜點（示意）</span><span class="pill p-gray" data-b="3" style="cursor:pointer">🎨 插畫小物（示意）</span></div>
          </div>
          <div class="src" style="margin-bottom:16px">資料：<b>文化部藝文活動 API</b>、觀光署 TDX</div>
        </div>
      </div>${tabs('地圖')}`);
      const wire = () => {
        P.$('q2').onclick = () => { if (st.stamps !== 1) return; st.stamps = 2; P.$('stamps').innerHTML = questStamps(2); wire(); st.toast('✓ <b>第 2 章：活動報到</b>'); };
        P.$('q3').onclick = () => { if (st.stamps !== 2) return; const v = P.$('vote'); v.style.display = ''; on(v); const sc = P.$('evsc'); animScroll(sc, 'scrollTop', sc.scrollHeight, 400); };   // 投票卡出現在下方，捲過去讓人看得到
      };
      wire();
      P.$('booths').addEventListener('click', async (e) => {
        const b = e.target.closest('[data-b]'); if (!b || st.stamps !== 2) return;
        b.classList.remove('p-gray'); b.classList.add('p-green'); b.textContent = '✓ ' + b.textContent;
        st.stamps = 3; P.$('stamps').innerHTML = questStamps(3);
        try { await sleep(900); } catch (_) { return; }
        st.done();
      });
    };

    /* 7. 任務完成：20 點入帳，接著提醒附近高雄幣店家（沿用「一句話玩高雄」的文案） */
    st.done = () => {
      set('done', `${SB()}
      <div class="body" style="display:flex;flex-direction:column">
        <div style="padding:22px 16px 0;flex:1;overflow-y:auto">
          <div style="text-align:center">
            <div style="font-size:42px">🎉</div>
            <div style="font-size:18px;font-weight:900;margin-top:6px">集滿 3 章，任務完成</div>
            <div class="small mt6">駁二港邊週末市集　·　11/15（六）</div>
          </div>
          <div class="card mt12">${questStamps(3)}</div>
          <div class="card mt10 row" data-k="credit" style="justify-content:space-between">
            <div><b style="font-size:14px">🎁 +20 點</b><div class="small" data-k="credst">入帳中…</div></div>
            <span class="pill p-gray" data-k="credpill">處理中</span>
          </div>
          <div class="c-push mt10 fx" data-k="coin" style="display:flex"><div class="ic">🪙</div><div><div class="t">逛到附近 · 主動提醒</div><div class="b">你有 <b>85 高雄幣</b>，附近有合作店家可以用 👇</div></div></div>
          <div class="card mt8 fx" data-k="shops">
            <div class="row" style="padding:4px 0"><span>🏪</span><div style="flex:1"><b style="font-size:13px">全家（步行 2 分）</b><div class="small">50 高雄幣兌 50 元禮物卡</div></div></div>
            <div class="row" style="padding:6px 0;border-top:1px solid var(--line)"><span>☕</span><div style="flex:1"><b style="font-size:13px">Let's Café（步行 3 分）</b><div class="small">35 高雄幣兌中杯美式</div></div></div>
          </div>
          <div class="btn btn-ghost mt12 fx" data-k="gohome" style="cursor:pointer">🏠 逛完了，回家</div>
          <div class="src" style="text-align:center;margin-bottom:14px">店家、點數皆為示意</div>
        </div>
      </div>${tabs('地圖')}`);
      (async () => {
        try { await sleep(1600); } catch (_) { return; }
        STATE.quest = true;
        if (st.stage !== 'done') return;   // 使用者已經離開這個畫面
        P.$('credst').textContent = '✓ 已入帳　11/15 16:40　·　收進「城市獎勵」';
        P.$('credpill').className = 'pill p-green'; P.$('credpill').textContent = '已入帳';
        try { await sleep(900); } catch (_) { return; }
        if (st.stage !== 'done') return;
        on(P.$('coin'));
        try { await sleep(400); } catch (_) { return; }
        if (st.stage !== 'done') return;
        on(P.$('shops')); on(P.$('gohome'));
      })();
      P.$('gohome').onclick = () => { if (P.$('gohome').classList.contains('in')) st.home(); };   // 入帳完才能離開
    };

    /* 8. 回家後：預告下週任務 */
    st.home = () => {
      set('home', questLock('11 月 15 日 星期六', '21:30', '🗺️ 下週任務：鹽埕在地夜市', '點亮鹽埕：搭車到鹽埕埔站、逛夜市、在地店家消費一次', '<span class="pri" data-k="remind" style="cursor:pointer;background:#2346D8">提醒我</span><span data-k="skip" style="cursor:pointer">之後再說</span>') +
        '<div class="lock-ff" data-k="tome" style="display:none">看「我的 → 替你做過的事」›</div>');
      pop('noti');
      const finish = (txt) => { P.$('noti').querySelector('.acts').innerHTML = `<span>${txt}</span>`; P.$('tome').style.display = ''; st.homeDone = true; };
      P.$('remind').onclick = () => finish('✓ 下週四 20:00 提醒你');
      P.$('skip').onclick = () => finish('好，下週任務還是會放在任務卡');
      P.$('tome').onclick = () => go('me', { focus: 'did' });
    };

    if (opts.from === 'noti') st.card(); else st.lock();   // 從情境主動通知點「看任務」進來，直接看任務卡
    return st;
  },
  async flow(st) {
    await guide(() => P.$('see'), '', () => st.stage === 'card');
    await guide(() => P.$('plan'), '', () => st.stage === 'go');
    await sleep(500);
    await guide(() => P.$('ticket'), '定期票可搭，出示乘車碼', () => st.qrOn || st.stage !== 'go');
    await guide(() => P.$('board'), '刷完碼，按這裡上車', () => st.stage === 'arrive');
    await sleep(500);
    await guide(() => P.$('checkin'), '到站了，打卡蓋第 1 章', () => st.stamps >= 1);
    await sleep(600);
    await guide(() => P.$('checkin'), '', () => st.stage === 'lit');
    await sleep(500);
    await guide(() => P.$('toevt'), '', () => st.stage === 'evt');
    await guide(() => P.$('q2'), '到了現場，點這裡報到', () => st.stamps >= 2);
    await guide(() => P.$('q3'), '最後一章：攤位投票', () => P.$('vote') && P.$('vote').style.display !== 'none');
    await guide(() => P.$('booths') && P.$('booths').querySelector('[data-b="1"]'), '選一個攤位投票', () => st.stamps >= 3);
    await guide(() => P.$('gohome'), '20 點入帳了，逛完再回家', () => st.stage === 'home');
    await sleep(500);
    await guide(() => P.$('remind'), '', () => st.homeDone);
    await guide(() => P.$('tome'), '任務完成也記在「我的」', () => false);
  },
});
