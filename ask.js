/* CityGPT（中間 AI）：首頁、拍照即陳情、一句話玩高雄、找東西問市政
   拍照即陳情、一句話玩高雄的流程與資料取自 demo_mockup_v2（sceneUCP、sceneUCE），陳情措辭依 MVP 調整。 */

/* ---------- CityGPT首頁 ---------- */
def({
  id: 'ask', grp: 'CityGPT（中間 AI）', no: '✦', tag: 'F-04', title: 'CityGPT首頁',
  note: '<b>中間那顆鍵：CityGPT</b><br>跟平台品牌同名的城市 AI：在地的事都從這裡問，用講的、用打字都可以。到哪座城市，它就回答那座城市的事。<br><br>三個最常用的入口：<span class="k">拍照即陳情</span>、一句話玩高雄、找東西問市政。點一個進去。',
  render() { return { chat: chatShell('CityGPT', '你的城市 AI') }; },
  async flow({ chat }) {
    const hero = chat._add(el(`<div class="ask-hero"><div class="hi">早安，志明 👋</div><div class="q">我是CityGPT。在地的事，直接跟我說</div><div class="in">💬 試試：「我要去高雄榮總」…</div></div>`));
    hero.querySelector('.in').style.cursor = 'pointer'; hero.querySelector('.in').onclick = () => go('go');
    const items = [
      ['go', '🚍', '#EEF1F5', '一句話出門', '查車 → 乘車碼 → 上車 → 回程', 'F-01×AI', '#EEF1F5', '#566079'],
      ['photo', '📸', '#E8F6F0', '拍照即陳情', '拍坑洞 → AI 判讀 → 送對的局處 → 追進度', '★ 最常用', '#E8EDFF', '#1C3BB8'],
      ['play', '🗺️', '#FBF3E2', '一句話玩高雄', '在地活動 → 排整天 → 乘車碼 → 行事曆', 'F-03×AI', '#FBF0DE', '#9C5E09'],
      ['lost', '🔎', '#EAF2FE', '找東西、問市政', '失物招領、市政問題，答不出來轉 1999', 'F-04', '#E4EEF8', '#2C6EA8'],
    ];
    const grid = chat._add(el('<div class="ask-grid"></div>'));
    items.forEach(([id, ic, bg, t, d, g, gbg, gc], i) => {
      const c = el(`<div class="entry" style="animation-delay:${i * 70}ms"><div class="e-ic" style="background:${bg}">${ic}</div><div class="e-t">${t}</div><div class="e-d">${d}</div><span class="e-g" style="background:${gbg};color:${gc}">${g}</span></div>`);
      c.onclick = () => go(id); grid.appendChild(c);
    });
  },
});

/* ---------- 一句話出門（取自 demo_mockup_v2 sceneUC1） ---------- */
def({
  id: 'go', grp: 'CityGPT（中間 AI）', no: '①', tag: 'F-01×AI', title: '一句話出門',
  note: '<b>用說的出門</b><br>說「我要去高雄榮總」，比兩種走法、看會不會塞；持定期票直接叫出 <span class="k">MeNGo 乘車碼</span>，快到站提醒下車，回程也幫你記好。<br><br>查路線屬交通基本盤（iBus+ 也在做）；Super APP 的差異是<b>導航和 MeNGo 乘車碼打通</b>，不用在兩個 App 間切換。<br><br>資料：TDX、iBus+ 動態、MeNGo 票證。',
  render() { return { chat: chatShell('一句話出門', 'CityGPT · 交通') }; },
  async flow({ chat }) {
    await chat.ai('要去哪裡？用說的就好。');
    await chat.choose([{ label: '🎙️ 我要去高雄榮總', value: 'g', say: '我要去高雄榮總' }]);
    await chat.ai('高雄榮總在左營區，捷運沒有直達，幫你比了兩種走法 👇', 'CityGPT', 'TDX、iBus+ 動態');
    chat.card(`<div class="c-row"><div><div class="v">捷運＋接駁（推薦）</div><div class="small">紅線 R16 左營站 → 轉接駁公車（紅 51／紅 53／301）</div></div><span class="r" style="font-size:16px">約 35 分</span></div>
      <div class="c-row"><div><div class="v">市區公車直達</div><div class="small">免轉乘，但比較久</div></div><span class="r" style="font-size:16px">約 45 分</span></div>`, 'hl');
    await chat.choose([{ label: '走捷運＋接駁', value: 'm' }, { label: '搭公車直達', value: 'b' }]);
    await chat.ai('好。要幫你看路上會不會塞嗎？');
    const t = await chat.choose([{ label: '會塞嗎？', value: 'y' }, { label: '不用，直接出發', value: 'n' }]);
    if (t === 'y') await chat.ai('目前路況順暢，捷運正常，約 35 分可到 👍', 'CityGPT', 'TDX 即時路況');
    await chat.ai('你有<b>南高屏 TPASS 定期票</b>，這趟捷運和接駁公車都在範圍內，不用另外買票。幫你叫出乘車碼 👇');
    await chat.button('🎫 開啟定期票乘車碼');
    chat.ticket('TPASS × MeNGo', '南高屏 TPASS 定期票', '刷乘車碼進站、上車', 13);
    await chat.ai('✅ 乘車碼開好了，進站、上車刷一下就好。快到站我會提醒你。');
    await chat.gap('35 分鐘後 · 接駁公車上');
    chat.push('📍', '到站提醒', '<b>榮總站</b>再 1 站就到，請準備下車。');
    await chat.ai('到囉！要先幫你記好回程嗎？');
    const back = await chat.choose([{ label: '好，記回程', value: 'y' }, { label: '不用了', value: 'n' }]);
    if (back === 'y') {
      await chat.ai('大概幾點要回程？我會提前提醒你末班接駁，乘車碼也會先備好。');
      const tm = await chat.choose([{ label: '17:00', value: '17:00' }, { label: '18:30', value: '18:30' }]);
      await chat.done(`回程提醒 ${tm}`, '末班接駁約 21:30 · 乘車碼會自動備好');
    }
    await chat.ai('看完診想順路逛逛？附近的活動、景點我也查得到。');
    await chat.choose([{ label: '好，看附近有什麼', value: 'p' }]);
    go('f3');
  },
});

/* ---------- ★ 拍照即陳情 ---------- */
const PHOTO = {
  detect: '路面坑洞（約 40cm）', confidence: 92, loc: '三民區建工路一帶（示意）',
  district: '三民區', village: '灣成里', main: '22 道路', sub: '02 道路管線、工程',
  dept: '工務局養工處', case_no: 'KH-1999-20261109-088',
  updates: [
    ['📥', '送出後 10 分', '案件已受理', '工務局養工處已接收並完成立案'],
    ['🔧', '第 1 天', '已排定派工', '預計明日派員現場勘查與回填'],
    ['✅', '第 3 天', '已完成修復', '坑洞已回填平整，謝謝你的回報'],
  ],
};
def({
  id: 'photo', grp: 'CityGPT（中間 AI）', no: '★', tag: 'F-04 ★', title: '拍照即陳情',
  note: '<b>市民拍一張照，剩下的系統做</b><br>影像判讀出問題類型 → 拍照定位帶出行政區與里 → 對齊陳情案件分類與權責局處 → <span class="k">陳情人資料用數位市民身分帶入</span> → 送進陳情系統 → 進度主動推播。<br><br>市民零填表、零催件。這是交通 App 做不到、只有 CityGPT 跨局編排做得到的事。<br><br>對應：CityGPT VLM、GIS 反查行政里、高雄陳情系統／1999 派工。',
  render() { return { chat: chatShell('拍照即陳情', 'CityGPT · 市政回報') }; },
  async flow({ chat }) {
    const d = PHOTO;
    await chat.ai('路上看到坑洞、號誌壞掉、路樹倒了？拍一張給我，剩下的我來處理。');
    await chat.button('📷 拍照回報');
    chat.user('這個洞很危險，機車很容易摔');
    const ph = chat.photo(IMG + 'pothole.jpg');
    ph.appendChild(el('<div class="scan"></div>'));
    const box = el('<div class="box" style="left:28%;top:38%;width:44%;height:40%"><b>坑洞 92%</b></div>'); ph.appendChild(box);
    await chat.ai('我看一下照片…', 'CityGPT · 影像判讀');
    await sleep(900); box.classList.add('in'); await sleep(500);
    await chat.ai(`辨識出 <b>${d.detect}</b>，信心 <b>${d.confidence}%</b>。用拍照定位帶出 <b>${d.district} ${d.village}</b>，案件分類是 <b>${d.main} / ${d.sub}</b>。`, 'CityGPT · 影像判讀', 'CityGPT VLM、GIS 反查行政里');
    chat.card(`<div class="c-row"><span class="k">問題</span><span class="v">${d.detect}</span></div>
      <div class="c-row"><span class="k">地點</span><span class="v">${d.district} ${d.village}（定位自動帶出）</span></div>
      <div class="c-row"><span class="k">權責局處</span><span class="v">${d.dept}</span></div>`, 'hl');
    await chat.ai('陳情人資料我會用你的<b>高雄數位市民</b>身分帶入，不用填表。要送出陳情嗎？');
    const v = await chat.choose([{ label: '好，送出陳情', value: 'y' }, { label: '先看陳情單內容', value: 'p' }]);
    if (v === 'p') {
      chat.card(`<div class="h">陳情單（AI 與定位自動帶出）</div>
        <div class="c-row"><span class="k">陳情人</span><span class="v">林○明</span><span class="r">數位市民帶入</span></div>
        <div class="c-row"><span class="k">聯絡電話</span><span class="v">09•• ••• 812</span><span class="r">數位市民帶入</span></div>
        <div class="c-row"><span class="k">案件分類</span><span class="v">${d.main} / ${d.sub}</span></div>
        <div class="c-row"><span class="k">地點</span><span class="v">${d.loc}</span></div>
        <div class="c-row"><span class="k">說明</span><span class="v">${d.detect}，建請儘速修復</span></div>
        <div class="c-row"><span class="k">附件</span><span class="v">現場照片 ×1、定位座標</span></div>`);
      await chat.button('📮 確認送出陳情');
    }
    await chat.prog(['送進高雄市陳情系統', `分派給 ${d.dept}`, '取得案號，開始追蹤進度']);
    await chat.done('陳情已送出', `案號 ${d.case_no}<br>權責機關 ${d.dept}`);
    await chat.ai('之後不用一直開 App 查。進度有變化，我會主動告訴你 👇');
    for (const [ic, when, t, b] of d.updates) { await chat.gap(when); chat.push(ic, '陳情進度 · 主動通知', `<b>${t}</b>　${b}`); await sleep(500); }
    await chat.ai('修好了。這次處理你滿意嗎？你的回饋會給局處參考。');
    const r = await chat.choose([{ label: '😊 滿意', value: 'g' }, { label: '😐 普通', value: 'n' }, { label: '🙁 不滿意', value: 'b' }]);
    await chat.ai(r === 'b' ? '收到，我會把你的意見附在這個案件上，局處會再回覆你。' : '謝謝你！一張照片，一條路就修好了。');
    await chat.ai('這件陳情和之前的案件，都可以在「我的 → 我的案件」看到。');
    await chat.choose([{ label: '看我的案件', value: 'm' }]);
    go('me', { focus: 'case' });
  },
});

/* ---------- 一句話玩高雄 ---------- */
const PLAY = {
  items: [
    { id: 'yancheng', img: 'nightmarket.jpg', t: '鹽埕在地夜市（示意）', d: '限定小吃攤＋在地樂團 18:00–23:00' },
    { id: 'pier2', img: 'theater.jpg', t: '駁二在地劇團展演（示意）', d: '週六 19:00，不是 Google 熱門景點' },
    { id: 'meinong', img: 'farmmarket.jpg', t: '美濃小農市集（示意）', d: '週日限定，在地青農擺攤' },
  ],
  plan: {
    yancheng: [['16:30', '🚋', '搭輕軌到鹽埕一帶', '刷定期票乘車碼，免另購票'], ['17:00', '🍜', '在地巷弄老店（示意）', 'Google 評論少，在地人推'], ['18:00', '🏮', '鹽埕在地夜市', '限定小吃＋樂團表演'], ['20:30', '🌆', '駁二散步看海', '步行可達']],
    pier2: [['16:30', '🚋', '搭輕軌到駁二', '刷定期票乘車碼，免另購票'], ['17:00', '🌆', '港邊散步看夕陽', '大港橋一帶'], ['18:00', '🍜', '鹽埕在地小吃（示意）', '步行 8 分'], ['19:00', '🎭', '駁二在地劇團展演', '已幫你保留報名資訊']],
  },
  info: {
    yancheng: { img: 'nightmarket.jpg', t: '鹽埕港邊樂團之夜（示意）', when: '11/15（六）19:00–21:00', where: '鹽埕埔一帶（示意）', fee: '免費 · 需預約座位', quota: '限 120 位 · 剩 18 位', org: '鹽埕在地商圈（示意）', ask: '夜市裡的樂團演出要先預約座位（免費，剩 18 位），要幫你預約嗎？', done: '座位預約成功' },
    pier2: { img: 'theater.jpg', t: '駁二在地劇團展演（示意）', when: '11/15（六）19:00–20:30', where: '駁二藝術特區（示意）', fee: '免費 · 需報名', quota: '限 80 位 · 剩 6 位', org: '在地劇團（示意）', ask: '這場要先報名（免費，只剩 6 位），要幫你報名嗎？', done: '報名成功' },
  },
  coin: { bal: 85, near: [['🏪', '全家（步行 2 分）', '50 高雄幣兌 50 元禮物卡'], ['☕', "Let's Café（步行 3 分）", '35 高雄幣兌中杯美式']] },
};
def({
  id: 'play', grp: 'CityGPT（中間 AI）', no: 'E', tag: 'F-03×AI', title: '一句話玩高雄',
  note: '<b>用說的找活動，不用自己翻地圖</b><br>說「這週末想走走」，推的是<span class="k">在地正在發生、Google 查不到</span>的活動；選一個，看活動資訊（時間、地點、費用、名額、主辦），<b>身分帶入一鍵報名</b>，入場憑證收進憑證夾；報名後加行事曆。<br><br>故事一路接下去：<b>前一天</b>提醒、<b>當天出門</b>直接出示乘車碼、<b>到場</b>出示入場憑證、逛街時提醒高雄幣店家。<br><br>當天逛到附近，主動提醒高雄幣可以在哪裡用。<br><br>對應：自建 POI＋活動模組＋MaaS＋高雄幣。活動、店家為示意。',
  render() { return { chat: chatShell('一句話玩高雄', 'CityGPT · 在地活動') }; },
  async flow({ chat }) {
    await chat.ai('想去哪走走、想吃什麼，直接跟我說。');
    await chat.choose([{ label: '🎙️ 這週末想在高雄走走', value: 'w', say: '這週末想在高雄走走' }]);
    await chat.ai('不推你 Google 都查得到的。這是本週六日<b>高雄在地正在發生的事</b> 👇', 'CityGPT', '活動模組（在地單位上架）');
    chat.card(PLAY.items.map(it => `<div class="c-poi"><img src="${IMG}${it.img}" alt=""><div><div class="t">${it.t}</div><div class="d">${it.d}</div><span class="lc">在地限定</span></div></div>`).join(''), 'hl');
    const pick = await chat.choose([{ label: '排鹽埕夜市', value: 'yancheng', say: '幫我排鹽埕夜市' }, { label: '排駁二劇團', value: 'pier2', say: '排駁二劇團' }]);
    const ev = PLAY.info[pick];
    chat.photo(IMG + ev.img);
    await chat.ai(`<b>${ev.t}</b> 的活動資訊 👇`, 'CityGPT · 活動資訊', '活動模組（主辦單位上架）');
    chat.card(`<div class="c-row"><span class="k">時間</span><span class="v">${ev.when}</span></div>
      <div class="c-row"><span class="k">地點</span><span class="v">${ev.where}</span></div>
      <div class="c-row"><span class="k">費用</span><span class="v">${ev.fee}</span></div>
      <div class="c-row"><span class="k">名額</span><span class="v">${ev.quota}</span></div>
      <div class="c-row"><span class="k">主辦</span><span class="v">${ev.org}</span></div>`, 'hl');
    await chat.ai(ev.ask);
    const sg = await chat.choose([{ label: '幫我報名', value: 'y' }, { label: '先不用', value: 'n' }]);
    let cal = 'n';
    if (sg === 'y') {
      await chat.ai('報名資料用你的<b>高雄數位市民</b>身分帶入，確認一下 👇');
      chat.card(`<div class="h">報名資料（自動帶入）</div>
        <div class="c-row"><span class="k">姓名</span><span class="v">林○明</span><span class="r">數位市民帶入</span></div>
        <div class="c-row"><span class="k">手機</span><span class="v">09•• ••• 812</span><span class="r">數位市民帶入</span></div>
        <div class="c-row"><span class="k">人數</span><span class="v">1 位</span></div>`);
      await chat.button('✓ 確認報名');
      STATE[pick] = true;
      await chat.done(ev.done, `${ev.t}<br>入場憑證已收進憑證夾 → 活動`);
      /* 報名完成後才問行事曆 */
      await chat.ai('要加進行事曆嗎？活動前一天我會提醒你。');
      cal = await chat.choose([{ label: '加入行事曆', value: 'y' }, { label: '不用', value: 'n' }]);
      if (cal === 'y') await chat.done('已加入行事曆', `${ev.when}<br>前一天 20:00 提醒你`);
    }
    await chat.ai('當天下午到晚上也幫你排好了，含在地美食和交通 👇');
    chat.card(PLAY.plan[pick].map(([t, ic, n, d]) => `<div class="c-row"><span class="k">${t}</span><span>${ic}</span><div><div class="v">${n}</div><div class="small">${d}</div></div></div>`).join(''), 'hl');
    await chat.ai('交通全程用<b>南高屏 TPASS 定期票</b>，不用另外買票。當天出門時，我會把乘車碼準備好。');
    if (cal === 'y') {
      await chat.gap('11/14（五）20:00 · 活動前一天');
      chat.push('🔔', '明天的活動 · 行事曆提醒', `明天 19:00「${ev.t}」。建議 <b>16:30 出發</b>，搭輕軌約 25 分。入場憑證在憑證夾。`);
      await sleep(600);
    }
    await chat.gap('11/15（六）16:30 · 出門搭車');
    chat.push('🚋', '該出發了', '輕軌下一班 4 分鐘後進站，乘車碼已幫你準備好。');
    await chat.button('🎫 開啟乘車碼');
    chat.ticket('TPASS × MeNGo', '南高屏 TPASS 定期票', '進站、上車刷一下就好 · 30 秒換碼', 9);
    await chat.ai('✅ 刷碼上車就好。快到站我會提醒你下車。');
    if (sg === 'y') {
      await chat.gap('19:00 · 到了活動現場');
      await chat.ai('到了！入口出示入場憑證就能進場 👇');
      await chat.button('🎟️ 出示入場憑證');
      chat.ticket('入場憑證 · 活動模組', ev.t, `${ev.when} · 林○明 · 1 位`, 17);
      await chat.done('已入場', '祝你玩得開心');
    }
    await chat.gap('20:10 · 你在鹽埕附近逛');
    chat.push('🪙', '逛到附近 · 主動提醒', `你有 <b>${PLAY.coin.bal} 高雄幣</b>，附近有合作店家可以用 👇`);
    chat.card(PLAY.coin.near.map(([ic, t, d]) => `<div class="c-row"><span>${ic}</span><span class="v">${t}</span><span class="r" style="font-size:11.5px">${d}</span></div>`).join(''));
    await chat.ai('不只帶你出門，逛的時候也幫你把在地消費串起來。玩得開心！', 'CityGPT', 'MeNGo 會員、高雄幣合作店家');
    await chat.ai('報名的活動、入場憑證，都收在「我的 → 高雄市」。');
    await chat.choose([{ label: '看我報名的活動', value: 'm' }]);
    go('me', { focus: 'evts' });
  },
});

/* ---------- 找東西、問市政（AI 客服＋1999 保底） ---------- */
def({
  id: 'lost', grp: 'CityGPT（中間 AI）', no: '?', tag: 'F-04', title: '找東西、問市政',
  note: '<b>AI 客服</b><br>用講的、用打字都可以；答案<span class="k">附資料來源</span>。<br><br>AI 查不到、或回應超過 3 秒，<b>一定</b>給直撥 1999 或轉真人，不會讓人卡住。',
  render() { return { chat: chatShell('找東西、問市政', 'CityGPT · 失物招領・市政問題') }; },
  async flow({ chat }) {
    await chat.ai('有什麼想問的？用講的、用打字都可以。');
    const lang = await chat.choose([
      { label: '🎙️ 我的手機掉在公車上', value: 'zh', say: '🎙️ 我的手機掉在公車上' },
      { label: '⌨️ 黑色手機掉在公車上', value: 'kb', say: '黑色手機昨天掉在公車上' },
    ]);
    await chat.ai(`幫你查了失物招領，找到 2 筆可能是你的 👇`, 'CityGPT · 失物招領', '警政署失物招領（每日更新）');
    chat.card(`<div class="c-row"><span>📱</span><div><div class="v">黑色手機</div><div class="small">11/7 拾得 · 左營分局新莊派出所</div></div><span class="r">相符度高</span></div>
      <div class="c-row"><span>📱</span><div><div class="v">深灰色手機</div><div class="small">11/7 拾得 · 高雄客運站務室</div></div><span class="r" style="color:#64748B">相符度中</span></div>`, 'hl');
    const v = await chat.choose([{ label: '第一支像是我的，怎麼去？', value: 'nav' }, { label: '都不是我的', value: 'no' }]);
    if (v === 'nav') {
      await chat.ai('新莊派出所離你 1.8 公里，搭公車約 12 分鐘。記得帶身分證件去認領。');
      chat.map({ img: 'osm_zuoying.jpg', bar: '前往左營分局新莊派出所', eta: '🚌 約 12 分 · 定期票可搭' });
      await chat.ai('要我順便打電話問派出所還在不在嗎？這個要真人處理，我幫你轉 1999 👇');
    } else {
      await chat.ai('我這邊查不到更多資料了。這種事找真人比較快 👇');
    }
    chat.card(`<div class="c-row"><span class="v">需要真人幫忙？</span></div>
      <div style="display:flex;gap:8px;padding:6px 0 10px"><span class="c-chip" style="flex:1;text-align:center;border-color:#E05A6F;color:#B83A52">📞 直撥 1999</span><span class="c-chip" style="flex:1;text-align:center;border-color:#CBD5E1;color:#475569">💬 轉文字客服</span></div>`, 'warn');
    await chat.button('📞 直撥 1999');
    await chat.done('正在幫你接通 1999', '剛剛的對話內容會一起轉給客服人員，不用重講一次（示意）');
  },
});
