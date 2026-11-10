/* v8：真實 Google 地圖（Maps JavaScript API）
   - 金鑰由 serve.py 即時提供（maps_key.js），不寫在任何檔案裡。
   - 載入失敗、沒網路或金鑰無效時，GM.ok = false，各畫面退回示意底圖，故事線照常。
   - 路線先用 DirectionsService 沿真實道路規劃；拿不到路線就畫兩點直線。
   座標為示意地點，名稱以「（示意）」標註者非實際設施位置。 */
const GM = { ok: false, ready: null };
(function loadGoogleMaps() {
  GM.ready = new Promise((resolve) => {
    let settled = false;
    const done = (ok) => { if (settled) return; settled = true; GM.ok = ok; resolve(ok); };
    const key = window.GMAPS_KEY;
    if (!key || location.protocol === 'file:') return done(false);
    window.gm_authFailure = () => { GM.ok = false; document.dispatchEvent(new Event('gm-fail')); };
    window.__gmInit = () => done(true);
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&language=zh-TW&region=TW&callback=__gmInit`;
    s.async = true; s.onerror = () => done(false);
    document.head.appendChild(s);
    setTimeout(() => done(false), 8000);
  });
})();

const LL = {
  juDan: { lat: 22.6667, lng: 120.3027 },        // 捷運巨蛋站一帶（出發點）
  vgh: { lat: 22.6797, lng: 120.3222 },          // 高雄榮總
  yanchengMRT: { lat: 22.6237, lng: 120.2838 },  // 捷運鹽埕埔站一帶（目前位置）
  dingshan: { lat: 22.6528, lng: 120.3226 },     // 鼎山街一帶（住家，示意）
  dingshanPark: { lat: 22.6560, lng: 120.3270 }, // 地勢較高的停車場（示意）
  police: { lat: 22.6747, lng: 120.3068 },       // 派出所（示意）
};

/* 建立地圖：使用 Google 預設樣式，關掉多餘控制項，手機手勢一指拖動 */
function gMap(el, center, zoom = 16, extra = {}) {
  return new google.maps.Map(el, Object.assign({
    center, zoom, disableDefaultUI: true, clickableIcons: false, gestureHandling: 'greedy',
    keyboardShortcuts: false,
  }, extra));
}

/* 把自訂 HTML（沿用原本的 .pin 圖釘樣式）放到經緯度上 */
function htmlMarker(map, pos, html, onClick) {
  class M extends google.maps.OverlayView {
    onAdd() {
      this.div = el(`<div style="position:absolute;transform:translate(-50%,-100%);cursor:pointer">${html}</div>`);
      if (onClick) this.div.addEventListener('click', (e) => { e.stopPropagation(); onClick(e); });
      this.getPanes().overlayMouseTarget.appendChild(this.div);
    }
    draw() { const p = this.getProjection().fromLatLngToDivPixel(new google.maps.LatLng(pos)); if (p && this.div) { this.div.style.left = p.x + 'px'; this.div.style.top = p.y + 'px'; } }
    onRemove() { if (this.div) this.div.remove(); }
  }
  const m = new M(); m.setMap(map); return m;
}
/* 藍色定位點 */
function meMarker(map, pos) {
  return htmlMarker(map, pos, '<div style="transform:translateY(50%)"><div class="me-dot" style="position:static"></div></div>');
}

/* 沿真實道路規劃路線；回傳路徑點陣列（LatLng[]） */
const toLL = (p) => (typeof p.lat === 'function' ? p : new google.maps.LatLng(p.lat, p.lng));
const routeCache = {};
/* 先用新版 Routes（Route.computeRoutes，需啟用 Routes API），
   再試舊版 DirectionsService，都失敗就畫直線。結果快取，重播情境不重複計費。 */
async function gRoute(origin, destination, mode = 'WALKING') {
  const ck = JSON.stringify([origin, destination, mode]);
  if (routeCache[ck]) return routeCache[ck];
  let out = null;
  try {
    const { Route } = await google.maps.importLibrary('routes');
    const { routes } = await Route.computeRoutes({ origin, destination, travelMode: mode, fields: ['path', 'durationMillis', 'distanceMeters'] });
    const r = routes && routes[0];
    if (r && r.path && r.path.length) out = { path: r.path.map(toLL), min: Math.max(1, Math.round(r.durationMillis / 60000)), km: (r.distanceMeters / 1000).toFixed(1), via: 'routes' };
  } catch (e) { console.warn('Routes API 失敗：', e && (e.message || e)); }
  if (!out) {
    try {
      const svc = new google.maps.DirectionsService();
      const r = await svc.route({ origin, destination, travelMode: google.maps.TravelMode[mode] });
      const leg = r.routes[0].legs[0];
      out = { path: r.routes[0].overview_path, min: Math.round(leg.duration.value / 60), km: (leg.distance.value / 1000).toFixed(1), via: 'directions' };
    } catch (e) { console.warn('DirectionsService 失敗：', e && (e.code || e.message)); }
  }
  if (!out) out = { path: [toLL(origin), toLL(destination)], min: null, km: null, via: 'straight' };
  routeCache[ck] = out;
  GM.lastVia = out.via;
  return out;
}

/* 畫路線（含白色外框），並逐段描出來 */
function drawRoute(map, path, color = '#2346D8', { dashed = false, weight = 6, fit = true, animate = true } = {}) {
  const lines = [];
  if (!dashed) lines.push(new google.maps.Polyline({ map, path: [], strokeColor: '#ffffff', strokeOpacity: 1, strokeWeight: weight + 4, zIndex: 1 }));
  const main = new google.maps.Polyline(dashed
    ? { map, path: [], strokeOpacity: 0, zIndex: 3, icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, strokeColor: color, scale: 4 }, offset: '0', repeat: '14px' }] }
    : { map, path: [], strokeColor: color, strokeOpacity: 1, strokeWeight: weight, zIndex: 2 });
  lines.push(main);
  if (fit && path.length > 1) {
    const b = new google.maps.LatLngBounds(); path.forEach(p => b.extend(p));
    map.fitBounds(b, { top: 150, bottom: 300, left: 40, right: 40 });
  }
  if (!animate) { lines.forEach(l => l.setPath(path)); return lines; }
  let i = 0; const step = Math.max(1, Math.ceil(path.length / 40));
  const grow = () => { i = Math.min(path.length, i + step); lines.forEach(l => l.setPath(path.slice(0, i))); if (i < path.length) setTimeout(grow, 25); };
  grow();
  return lines;
}
const clearLines = (arr) => (arr || []).forEach(l => l.setMap(null));

/* 讓圓點沿路徑移動（公車到站動畫） */
function moveAlong(map, path, html, ms = 3200) {
  const mk = htmlMarker(map, path[0].toJSON ? path[0].toJSON() : path[0], html);
  const t0 = Date.now();
  const tick = () => {
    const t = Math.min(1, (Date.now() - t0) / ms), f = t * (path.length - 1), i = Math.floor(f), r = f - i;
    const a = path[i], b = path[Math.min(path.length - 1, i + 1)];
    const p = { lat: a.lat() + (b.lat() - a.lat()) * r, lng: a.lng() + (b.lng() - a.lng()) * r };
    if (mk.div) { const q = mk.getProjection().fromLatLngToDivPixel(new google.maps.LatLng(p)); mk.div.style.left = q.x + 'px'; mk.div.style.top = q.y + 'px'; }
    if (t < 1) setTimeout(tick, 30);
  };
  setTimeout(tick, 60);
  return mk;
}
