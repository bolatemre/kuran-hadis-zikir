// Üç Nur — Kelime Avı (100 seviyeli kelime bulmaca) ve yakındaki camilerin daha hızlı bulunması.
(function () {
  const st = document.createElement('style');
  st.textContent = `
.kv-ust{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}.kv-ust b{font-size:16px}.kv-ust small{display:block;color:var(--soluk);font-size:12.5px}
.kv-sure{font-variant-numeric:tabular-nums;font-weight:700;color:var(--yesil2);background:var(--vurgu);padding:6px 12px;border-radius:999px}
.kv-tahta{display:grid;gap:2px;padding:8px;border-radius:18px;background:var(--kart);box-shadow:var(--golge);touch-action:none;user-select:none;-webkit-user-select:none}
.kv-tahta i{font-style:normal;aspect-ratio:1;display:grid;place-items:center;border-radius:7px;font-weight:700;font-size:clamp(13px,4.2vw,20px);color:var(--yazi)}
.kv-tahta i.sec{background:#e8c46e;color:#2a1f05}.kv-tahta i.bul{background:#175c44;color:#fff}.kv-tahta i.ipucu{box-shadow:inset 0 0 0 3px #c9a24f}
.kv-kelimeler{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin:12px 0}.kv-kelimeler span{text-align:center;padding:8px 4px;border-radius:10px;background:var(--kart);font-size:12.5px;font-weight:700;letter-spacing:.3px;overflow:hidden;text-overflow:ellipsis}
.kv-kelimeler span.bul{background:#175c44;color:#e8c46e;text-decoration:line-through}
.kv-alt{display:flex;gap:8px}.kv-alt .btn{flex:1}
.kv-liste{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
.kv-liste button{aspect-ratio:1;border-radius:14px;background:var(--kart);box-shadow:var(--golge);display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:800;font-size:17px}
.kv-liste button small{font-size:9px;font-weight:500;color:#c9a24f;letter-spacing:1px;height:11px}.kv-liste button.kilit{opacity:.4;box-shadow:none}.kv-liste button.simdi{background:#175c44;color:#fff}
.kv-afis{display:flex;align-items:center;gap:12px;width:100%;text-align:left;margin:0 0 14px;padding:14px;border-radius:18px;color:#fff;background:linear-gradient(140deg,#1d6b50,#0f3d2e 60%,#0a2b20);box-shadow:var(--golge)}
.kv-afis span{font-size:30px}.kv-afis b{display:block;font-size:16px;color:#f0d48a}.kv-afis small{opacity:.9}.kv-afis i{margin-left:auto;font-style:normal;font-size:20px;color:#e8c46e}
.kv-bitti{text-align:center}.kv-bitti .y{font-size:40px;letter-spacing:6px}`;
  document.head.appendChild(st);

  // =====================================================================
  // KELİME AVI
  // =====================================================================
  const HARFLER = 'AAAABCÇDEEEEFGĞHIİİİJKKLLMMNNOÖPRRSŞTTUÜVYZ';
  const YASAK = ['SİK', 'AMK', 'GÖT', 'BOK', 'PİÇ', 'MEME', 'YARAK', 'OROSPU', 'SALAK', 'APTAL', 'DOMUZ', 'KAFİR', 'LANET'];
  const YONLER = [[1, 0], [0, 1], [1, 1], [1, -1], [-1, 0], [0, -1], [-1, -1], [-1, 1]]; // [dx, dy]: sağa, aşağı, çapraz aşağı, çapraz yukarı, sonra tersleri
  const rasgele = t => () => { t = t + 0x6D2B79F5 | 0; let r = Math.imul(t ^ t >>> 15, 1 | t); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; };
  const kvDurum = () => oku('kelimeAvi', { acik: 1, yildiz: {} });
  function tahtaKur(no) { // her seviye herkeste aynı tahtayı üretir
    const [konu, saygi, ks] = KELIME_SEVIYE[no - 1], kelimeler = ks.split(' ').sort((a, b) => b.length - a.length);
    const taban = no <= 15 ? 8 : no <= 35 ? 9 : no <= 60 ? 10 : no <= 85 ? 11 : 12;
    const yonSay = no <= 15 ? 2 : no <= 35 ? 3 : 4, ters = !saygi && no > 35; // saygı gereği bazı konular ters yazılmaz
    const yonler = YONLER.slice(0, yonSay).concat(ters ? YONLER.slice(4, 4 + yonSay) : []);
    const iki = ks + '|' + [...ks].reverse().join(''); // kelimenin kendisinde (düz ya da ters) geçen harf dizileri yasak sayılmaz
    for (let deneme = 0; deneme < 60; deneme++) {
      const n = Math.max(taban, kelimeler[0].length) + (deneme > 30 ? 1 : 0), r = rasgele(no * 7919 + deneme * 104729), g = Array.from({ length: n }, () => Array(n).fill('')), yerler = [];
      let oldu = true;
      for (const k of kelimeler) {
        let kondu = false;
        for (let t = 0; t < 400 && !kondu; t++) {
          const [dx, dy] = yonler[Math.floor(r() * yonler.length)], x = Math.floor(r() * n), y = Math.floor(r() * n), ex = x + dx * (k.length - 1), ey = y + dy * (k.length - 1);
          if (ex < 0 || ex >= n || ey < 0 || ey >= n) continue;
          let uyar = true; for (let i = 0; i < k.length && uyar; i++) { const c = g[y + dy * i][x + dx * i]; if (c && c !== k[i]) uyar = false; }
          if (!uyar) continue;
          for (let i = 0; i < k.length; i++) g[y + dy * i][x + dx * i] = k[i];
          yerler.push({ k, x, y, dx, dy }); kondu = true;
        }
        if (!kondu) { oldu = false; break; }
      }
      if (!oldu) continue;
      const havuz = no > 60 ? kelimeler.join('') + HARFLER : HARFLER; // ileri seviyelerde dolgu harfleri kelimelerin harflerinden: daha şaşırtıcı
      for (let d = 0; d < 30; d++) {
        const h = g.map(s => s.map(c => c || havuz[Math.floor(r() * havuz.length)]));
        const satirlar = []; for (let i = 0; i < n; i++) { satirlar.push(h[i].join(''), h.map(s => s[i]).join('')); }
        for (let k = -n + 1; k < n; k++) { let a = '', b = ''; for (let i = 0; i < n; i++) { if (i + k >= 0 && i + k < n) { a += h[i][i + k]; b += h[i][n - 1 - i - k]; } } satirlar.push(a, b); }
        const hepsi = satirlar.concat(satirlar.map(s => [...s].reverse().join(''))).join('|');
        if (!YASAK.some(y => !iki.includes(y) && hepsi.includes(y))) return { no, konu, n, h, yerler, kelimeler: ks.split(' ') };
      }
    }
    return null;
  }

  function sKelimeAvi(m) {
    const d = kvDurum(), top = Object.values(d.yildiz).reduce((a, b) => a + b, 0);
    m.innerHTML = `<div class="kart b3-ust"><div class="b3-ikon">🧩</div><h2>Kelime Avı</h2><p class="soluk">100 seviye, 600 kelime. Harflerin arasına gizlenmiş kelimeleri parmağınızı sürükleyerek bulun. Seviye ilerledikçe tahta büyür, kelimeler çapraz ve ters de gizlenir.</p>
        <p style="margin:10px 0 0"><b>${Math.min(100, d.acik)}. seviye</b> · ⭐ ${top} / 300</p></div>
      <button class="btn ana tam" id="kv-devam">${d.acik > 100 ? 'Baştan oyna' : d.acik > 1 ? `${d.acik}. seviyeden devam et` : 'Başla'}</button>
      <div class="kategori-baslik">Seviyeler</div>
      <div class="kv-liste">${KELIME_SEVIYE.map((_, i) => { const n = i + 1, y = d.yildiz[n] || 0; return `<button class="${n > d.acik ? 'kilit' : ''} ${n === d.acik ? 'simdi' : ''}" data-n="${n}">${n > d.acik ? '🔒' : n}<small>${'★'.repeat(y)}</small></button>`; }).join('')}</div>`;
    const ac = n => sayfa(mm => sKelimeOyun(mm, n), 'Kelime Avı');
    $('#kv-devam').onclick = () => ac(d.acik > 100 ? 1 : d.acik);
    m.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { const n = +b.dataset.n; if (n > d.acik) { toast('Önce önceki seviyeleri bitirin'); return; } ac(n); });
  }

  function sKelimeOyun(m, no) {
    const t = tahtaKur(no); if (!t) { m.innerHTML = '<div class="kart"><p style="margin:0">Bu seviye açılamadı.</p></div>'; return; }
    const bulunan = new Set(), bas = Date.now(); let ipucu = 0, sec = null, bitti = false;
    m.innerHTML = `<div class="kv-ust"><div><b>Seviye ${no} · ${esc(t.konu)}</b><small id="kv-kalan"></small></div><span class="kv-sure" id="kv-sure">0:00</span></div>
      <div class="kv-tahta" id="kv-tahta" style="grid-template-columns:repeat(${t.n},1fr)">${t.h.map((s, y) => s.map((c, x) => `<i data-x="${x}" data-y="${y}">${c}</i>`).join('')).join('')}</div>
      <div class="kv-kelimeler">${t.kelimeler.map(k => `<span data-k="${k}">${k}</span>`).join('')}</div>
      <div class="kv-alt"><button class="btn" id="kv-ipucu">💡 İpucu</button><button class="btn" id="kv-liste">Seviyeler</button></div>`;
    const tahta = $('#kv-tahta'), hucre = (x, y) => tahta.children[y * t.n + x];
    const kalan = () => { $('#kv-kalan').textContent = `${bulunan.size} / ${t.kelimeler.length} kelime bulundu`; }; kalan();
    const sure = () => Math.floor((Date.now() - bas) / 1000);
    const saat = setInterval(() => { const s = sure(), el = $('#kv-sure'); if (el && !bitti) el.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }, 500);
    temizlik.push(() => clearInterval(saat));
    const nokta = e => { const r = tahta.getBoundingClientRect(), p = 8, w = (r.width - 2 * p) / t.n; return { x: Math.max(0, Math.min(t.n - 1, Math.floor((e.clientX - r.left - p) / w))), y: Math.max(0, Math.min(t.n - 1, Math.floor((e.clientY - r.top - p) / w))) }; };
    const yol = (a, b) => { // başlangıçtan parmağa en yakın düz ya da çapraz çizgi
      const dx = b.x - a.x, dy = b.y - a.y, ax = Math.abs(dx), ay = Math.abs(dy); let sx = Math.sign(dx), sy = Math.sign(dy), n;
      if (ax > 2 * ay) { sy = 0; n = ax; } else if (ay > 2 * ax) { sx = 0; n = ay; } else n = Math.max(ax, ay);
      const l = []; for (let i = 0; i <= n; i++) { const x = a.x + sx * i, y = a.y + sy * i; if (x < 0 || y < 0 || x >= t.n || y >= t.n) break; l.push({ x, y }); } return l;
    };
    const boya = l => { tahta.querySelectorAll('.sec').forEach(c => c.classList.remove('sec')); l.forEach(p => hucre(p.x, p.y).classList.add('sec')); };
    tahta.onpointerdown = e => { if (bitti) return; e.preventDefault(); try { tahta.setPointerCapture(e.pointerId); } catch (er) {} sec = { a: nokta(e), l: [] }; sec.l = [sec.a]; boya(sec.l); };
    tahta.onpointermove = e => { if (!sec) return; sec.l = yol(sec.a, nokta(e)); boya(sec.l); };
    const birak = () => {
      if (!sec) return; const l = sec.l, s = l.map(p => t.h[p.y][p.x]).join(''), r = [...s].reverse().join(''); sec = null; boya([]);
      const k = t.kelimeler.find(w => !bulunan.has(w) && (w === s || w === r)); if (!k) return;
      bulunan.add(k); l.forEach(p => hucre(p.x, p.y).classList.add('bul')); tahta.querySelectorAll('.ipucu').forEach(c => c.classList.remove('ipucu'));
      m.querySelector(`[data-k="${k}"]`).classList.add('bul'); titres(); kalan();
      if (bulunan.size === t.kelimeler.length) bitir();
    };
    tahta.onpointerup = birak; tahta.onpointercancel = () => { sec = null; boya([]); };
    $('#kv-ipucu').onclick = () => { const y = t.yerler.filter(v => !bulunan.has(v.k)); if (!y.length) return; const v = y[Math.floor(Math.random() * y.length)]; ipucu++; hucre(v.x, v.y).classList.add('ipucu'); toast(`“${v.k}” kelimesinin ilk harfi işaretlendi`, 2500); };
    $('#kv-liste').onclick = geri;
    const bitir = () => {
      bitti = true; clearInterval(saat); const s = sure(), hedef = t.n * 12, yildiz = ipucu === 0 && s <= hedef ? 3 : (ipucu <= 1 && s <= hedef * 2) ? 2 : 1;
      const d = kvDurum(); d.yildiz[no] = Math.max(d.yildiz[no] || 0, yildiz); d.acik = Math.max(d.acik, no + 1); yaz('kelimeAvi', d); titres('HEAVY');
      const k = document.createElement('div'); k.className = 'sor-zemin';
      k.innerHTML = `<div class="sor-kutu kv-bitti"><div class="y">${'⭐'.repeat(yildiz)}</div><b>Maşallah! Seviye ${no} tamam</b><p class="soluk">${Math.floor(s / 60)} dk ${s % 60} sn${ipucu ? ` · ${ipucu} ipucu` : ''}${no === 100 ? ' · Bütün seviyeleri bitirdiniz, tebrikler!' : ''}</p>
        <div class="sor-alt"><button class="btn" id="kv-b-liste">Seviyeler</button>${no < 100 ? '<button class="btn ana" id="kv-b-sonraki">Sonraki seviye ›</button>' : ''}</div></div>`;
      document.body.appendChild(k); temizlik.push(() => k.remove());
      k.querySelector('#kv-b-liste').onclick = () => { k.remove(); geri(); };
      const sn_ = k.querySelector('#kv-b-sonraki'); if (sn_) sn_.onclick = () => { k.remove(); yigin.pop(); sayfa(mm => sKelimeOyun(mm, no + 1), 'Kelime Avı'); };
    };
  }

  // ---------- Bugün sayfasında oyun kartı ----------
  function afisEkle() {
    if (!yigin.length || yigin[yigin.length - 1].fn !== sBugun || typeof KELIME_SEVIYE === 'undefined') return;
    const m = $('#icerik'), hatim = m.querySelector('#k-hatim'); if (!hatim || m.querySelector('#kv-afis')) return;
    const d = kvDurum();
    hatim.closest('.kesfet').insertAdjacentHTML('afterend', `<button class="kv-afis" id="kv-afis"><span>🧩</span><div><b>Kelime Avı</b><small>${d.acik > 100 ? '100 seviyenin hepsi tamam' : d.acik > 1 ? `Seviye ${d.acik} seni bekliyor · 100 seviye` : '100 seviye, 600 kelime · hemen başla'}</small></div><i>›</i></button>`);
    m.querySelector('#kv-afis').onclick = () => sayfa(sKelimeAvi, 'Kelime Avı');
  }
  new MutationObserver(afisEkle).observe($('#icerik'), { childList: true });
  afisEkle();

  // =====================================================================
  // YAKINDAKİ CAMİLER: daha hızlı
  // Önce son bulunan liste hemen gösterilir; konum önce hızlı (yaklaşık) alınır; harita sunucularının üçüne aynı anda sorulur.
  // =====================================================================
  const SUNUCULAR = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
  function ilkBasarili(isler) { return new Promise((tamam, hata) => { let kalan = isler.length; isler.forEach(p => p.then(tamam, () => { if (--kalan === 0) hata(new Error('baglanti')); })); }); }
  async function camiSor(u, q, lat, lng, iptaller) {
    const c = new AbortController(), z = setTimeout(() => c.abort(), 12000); iptaller.push(c);
    try {
      const res = await fetch(u, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: c.signal });
      if (!res.ok) throw new Error('http'); const j = await res.json();
      return j.elements.map(e => ({ ad: (e.tags && (e.tags['name:tr'] || e.tags.name)) || 'Cami', lat: e.lat || (e.center && e.center.lat), lng: e.lon || (e.center && e.center.lon) }))
        .filter(x => x.lat).map(x => ({ ...x, d: mesafe(lat, lng, x.lat, x.lng), y: yon(lat, lng, x.lat, x.lng) })).sort((a, b) => a.d - b.d);
    } finally { clearTimeout(z); }
  }
  camiAra = async function (lat, lng, r) {
    const q = `[out:json][timeout:10];nwr["amenity"="place_of_worship"]["religion"="muslim"](around:${r},${lat},${lng});out center 120;`, iptaller = [];
    try { return await ilkBasarili(SUNUCULAR.map(u => camiSor(u, q, lat, lng, iptaller))); } finally { iptaller.forEach(c => { try { c.abort(); } catch (e) {} }); }
  };
  const konumAl = secenek => new Promise((tamam, hata) => navigator.geolocation.getCurrentPosition(tamam, hata, secenek));
  sCamiler = function (m) {
    const burada = bekci(), R = 120;
    const haritaAra = (lat, lng) => PLATFORM === 'ios' ? `https://maps.apple.com/?q=cami&sll=${lat},${lng}&z=15` : `https://www.google.com/maps/search/cami/@${lat},${lng},15z`;
    const bekle = msj => { m.innerHTML = `<div class="kart" style="text-align:center"><div class="yukleniyor"></div><p>${msj}</p></div>`; };
    const hata = (msj, lat, lng) => {
      m.innerHTML = `<div class="kart"><p style="margin-top:0">${esc(msj)}</p><button class="btn ana tam" id="cm-tekrar">Tekrar dene</button>${lat ? '<button class="btn tam" id="cm-harita">Haritada camileri göster</button>' : ''}</div>`;
      $('#cm-tekrar').onclick = () => bul(true); const h = $('#cm-harita'); if (h) h.onclick = () => disLink(haritaAra(lat, lng));
    };
    const goster = (lat, lng, l, r, yenileniyor) => {
      const nokta = l.filter(x => x.d <= r).map(x => { const o = Math.min(1, x.d / r) * (R - 10), a = x.y * Math.PI / 180; return `<circle cx="${(R + Math.sin(a) * o).toFixed(1)}" cy="${(R - Math.cos(a) * o).toFixed(1)}" r="5" class="rd-cami"/>`; }).join('');
      m.innerHTML = `<div class="kart radar-kart"><svg viewBox="0 0 ${2 * R} ${2 * R}" class="radar"><circle cx="${R}" cy="${R}" r="${R - 2}" class="rd-h"/><circle cx="${R}" cy="${R}" r="${(R - 2) / 2}" class="rd-h"/>
          <text x="${R}" y="16" text-anchor="middle" class="rd-k">K</text>${nokta}<circle cx="${R}" cy="${R}" r="7" class="rd-ben"/></svg>
          <p class="soluk" style="margin:4px 0 0;text-align:center">${yenileniyor ? 'Son bulunan liste · konumunuza göre yenileniyor…' : `Siz ortadasınız · çember ${String(r).replace('.', ',')} km · kuzey yukarıda`}</p></div>
        ${l.length ? `<div class="liste">${l.slice(0, 40).map((x, i) => `<button data-i="${i}"><span class="no">🕌</span><span class="orta"><b>${esc(x.ad)}</b><span class="soluk">${mesafeYaz(x.d)} · ${['kuzey', 'kuzeydoğu', 'doğu', 'güneydoğu', 'güney', 'güneybatı', 'batı', 'kuzeybatı'][Math.round(x.y / 45) % 8]}</span></span><span class="yol">Yol tarifi ›</span></button>`).join('')}</div>`
          : '<div class="kart"><p style="margin:0">Yakınınızda kayıtlı cami bulunamadı.</p></div>'}
        <button class="btn tam" id="cm-harita">🗺️ Haritada tüm camileri göster</button><button class="btn tam" id="cm-yenile">↻ Yenile</button>
        <p class="soluk">Cami bilgileri OpenStreetMap gönüllülerinden gelir; bazı camiler eksik olabilir. © OpenStreetMap katkıcıları</p>`;
      m.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { const x = l[+b.dataset.i]; disLink(haritaLinki(x.lat, x.lng, x.ad)); });
      $('#cm-harita').onclick = () => disLink(haritaAra(lat, lng));
      $('#cm-yenile').onclick = () => bul(true);
    };
    const bul = async zorla => {
      if (!navigator.geolocation) { hata('Bu cihazda konum alınamıyor.'); return; }
      const eski = oku('camiOnbellek', null), taze = eski && Date.now() - eski.t < 14 * 864e5;
      if (taze && !zorla) goster(eski.lat, eski.lng, eski.l, eski.r, true); else bekle('Konumunuz alınıyor…');
      let p;
      try { p = await konumAl({ timeout: 5000, maximumAge: 300000, enableHighAccuracy: false }); } // hızlı, yaklaşık konum
      catch (e1) {
        if (e1 && e1.code === 1) { if (burada()) hata('Konum izni verilmedi. Telefon ayarlarından Üç Nur için konum iznini açabilirsiniz.'); return; }
        try { p = await konumAl({ timeout: 15000, maximumAge: 300000, enableHighAccuracy: true }); }
        catch (e2) { if (burada() && !(taze && !zorla)) hata(e2 && e2.code === 1 ? 'Konum izni verilmedi. Telefon ayarlarından Üç Nur için konum iznini açabilirsiniz.' : 'Konum alınamadı. Açık alanda tekrar deneyin.'); return; }
      }
      if (!burada()) return;
      // Gizlilik: konum yaklaşık 100 m'ye yuvarlanarak sorgulanır
      const lat = Math.round(p.coords.latitude * 1000) / 1000, lng = Math.round(p.coords.longitude * 1000) / 1000;
      if (taze && !zorla && mesafe(lat, lng, eski.lat, eski.lng) < 0.3 && Date.now() - eski.t < 864e5) { goster(eski.lat, eski.lng, eski.l, eski.r); return; } // aynı yerde, bugün arandı
      if (!(taze && !zorla)) bekle('Yakındaki camiler aranıyor…');
      try {
        let l = await camiAra(lat, lng, 3000), r = 3;
        if (l.length < 4) { l = await camiAra(lat, lng, 8000); r = 8; }
        yaz('camiOnbellek', { lat, lng, r, t: Date.now(), l: l.slice(0, 60) });
        if (burada()) goster(lat, lng, l, r);
      } catch (e) { if (burada() && !(taze && !zorla)) hata('Camiler yüklenemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.', lat, lng); else if (burada() && taze) goster(eski.lat, eski.lng, eski.l, eski.r); }
    };
    bul(false);
  };

  Object.assign(window, { sKelimeAvi, sKelimeOyun, kvTahtaKur: tahtaKur });
})();
