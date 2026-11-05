/* Üç Nur: Kuran Hadis Zikir — Allah rızası için. */
'use strict';

// ---------- Ayarlar ----------
// Ödüllü reklam birimleri (AdMob, "Destek ol"). Uygulama kimlikleri scripts/ads.env içinde.
const REKLAM = { ios: 'ca-app-pub-6236520075152909/9110586641', android: 'ca-app-pub-6236520075152909/7307771577' };
// Namaz vakitleri ve dini günler GitHub Pages'te yayınlanır (scripts/aladhan-vakitler.js, AlAdhan · Diyanet yöntemi, aylık güncellenir)
const VAKIT_URL = 'https://bolatemre.github.io/kuran-hadis-zikir/vakitler/';
const KABE = { lat: 21.4225, lng: 39.8262 };
const VAKIT_ADLARI = ['İmsak', 'Güneş', 'Öğle', 'İkindi', 'Akşam', 'Yatsı'];

// ---------- Yardımcılar ----------
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function oku(k, v) { try { const x = localStorage.getItem('khz.' + k); return x === null ? v : JSON.parse(x); } catch (e) { return v; } }
function yaz(k, v) { try { localStorage.setItem('khz.' + k, JSON.stringify(v)); } catch (e) {} }
function toast(m, ms = 2400) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.z); toast.z = setTimeout(() => t.hidden = true, ms); }
const C = () => window.Capacitor;
const NATIVE = !!(C() && (C().isNativePlatform ? C().isNativePlatform() : C().platform && C().platform !== 'web'));
const PLATFORM = C() && C().getPlatform ? C().getPlatform() : 'web';
function eklenti(ad) { const c = C(); if (!c) return null; if (c.Plugins && c.Plugins[ad]) return c.Plugins[ad]; if (c.registerPlugin) try { return c.registerPlugin(ad); } catch (e) {} return null; }
function trKucuk(s) { return s.toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['’`]/g, ''); }
function gunNo(d = new Date()) { return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5); }
function ymd(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function titres(t = 'LIGHT') { const h = eklenti('Haptics'); if (NATIVE && h) h.impact({ style: t }).catch(() => {}); else if (navigator.vibrate) navigator.vibrate(t === 'HEAVY' ? 60 : 12); }

// ---------- Tema ----------
function temaUygula() { const t = oku('tema', 'sistem'); if (t === 'sistem') document.documentElement.removeAttribute('data-tema'); else document.documentElement.setAttribute('data-tema', t); }
function boyutUygula() { const r = document.documentElement.style; r.setProperty('--ar-boyut', oku('arBoyut', 28) + 'px'); r.setProperty('--tr-boyut', oku('trBoyut', 16) + 'px'); }

// ---------- Gezinme ----------
let yigin = [];
function sayfa(fn, baslik) { yigin.push({ fn, baslik }); ciz(); }
function geri() { if (yigin.length > 1) { yigin.pop(); ciz(); } }
function sekme(ad) {
  document.querySelectorAll('#sekmeler button').forEach(b => b.classList.toggle('aktif', b.dataset.s === ad));
  const s = SEKMELER[ad]; yigin = [{ fn: s[0], baslik: s[1] }]; ciz();
}
function ciz() {
  const top = yigin[yigin.length - 1];
  temizlik.forEach(f => { try { f(); } catch (e) {} }); temizlik = [];
  $('#baslik').textContent = top.baslik; $('#geri').hidden = yigin.length < 2; $('#ust-sag').innerHTML = '';
  const m = $('#icerik'); m.innerHTML = ''; m.scrollTop = 0; top.fn(m);
}
let temizlik = []; // sayfa değişince durdurulacak zamanlayıcılar/dinleyiciler

// ---------- Kur'an verisi ----------
let kuranP = null;
function kuran() { return kuranP || (kuranP = fetch('data/kuran.json').then(r => r.json())); }

// ---------- Namaz vakitleri ----------
function konum() { return oku('konum', { tip: 'il', plaka: 34 }); }
function konumAdi(k = konum()) { return k.tip === 'il' ? ILLER[k.plaka - 1][0] : (k.ad || 'Konumum'); }
function konumKoord(k = konum()) { return k.tip === 'il' ? { lat: ILLER[k.plaka - 1][1], lng: ILLER[k.plaka - 1][2] } : { lat: k.lat, lng: k.lng }; }
function saatDilimi(k = konum()) { return k.tip === 'il' ? 'Europe/Istanbul' : undefined; }
function saatYaz(d, k) { return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: saatDilimi(k) }); }
function diyanetVeri(k = konum()) { return k.tip === 'il' ? oku('dv.' + k.plaka, null) : null; }
// Diyanet "HH:MM" (Türkiye saati, UTC+3) -> Date
function trSaat(gun, hm) { const [y, m, d] = gun.split('-').map(Number), [h, mi] = hm.split(':').map(Number); return new Date(Date.UTC(y, m - 1, d, h - 3, mi)); }
// Belirli bir günün altı vakti: önce Diyanet verisi, yoksa hesaplama (adhan, Türkiye yöntemi)
function gunVakitleri(tarih, k = konum()) {
  const dv = diyanetVeri(k), gun = ymd(tarih);
  if (dv && dv.gunler && dv.gunler[gun]) return { v: dv.gunler[gun].map(hm => trSaat(gun, hm)), kaynak: dv.kaynak || 'Diyanet' };
  const c = konumKoord(k), p = adhan.CalculationMethod.Turkey();
  const pt = new adhan.PrayerTimes(new adhan.Coordinates(c.lat, c.lng), tarih, p);
  return { v: [pt.fajr, pt.sunrise, pt.dhuhr, pt.asr, pt.maghrib, pt.isha], kaynak: 'Hesaplama' };
}
function siradakiVakit(simdi = new Date()) {
  const bug = gunVakitleri(simdi).v;
  for (let i = 0; i < 6; i++) if (bug[i] > simdi) return { i, t: bug[i], onceki: i ? i - 1 : 5 };
  const yarin = new Date(simdi); yarin.setDate(yarin.getDate() + 1);
  return { i: 0, t: gunVakitleri(yarin).v[0], onceki: 5 };
}
function kalan(ms) { const s = Math.max(0, Math.floor(ms / 1000)); return [Math.floor(s / 3600), Math.floor(s % 3600 / 60), s % 60].map(x => String(x).padStart(2, '0')).join(':'); }
async function diyanetGuncelle(zorla) {
  const k = konum(); if (k.tip !== 'il') return false;
  const son = oku('dvZaman.' + k.plaka, 0), dv = diyanetVeri(k);
  const bugunVar = dv && dv.gunler && dv.gunler[ymd(new Date())];
  if (!zorla && bugunVar && Date.now() - son < 12 * 3600e3) return false;
  try {
    const r = await fetch(VAKIT_URL + k.plaka + '.json', { cache: 'no-store' }); if (!r.ok) return false;
    const j = await r.json(); if (!j.gunler) return false;
    yaz('dv.' + k.plaka, j); yaz('dvZaman.' + k.plaka, Date.now()); return true;
  } catch (e) { return false; }
}
async function diniGunGuncelle() {
  if (Date.now() - oku('dgZaman', 0) < 24 * 3600e3 && oku('dg', null)) return;
  try { const r = await fetch(VAKIT_URL + 'dini-gunler.json', { cache: 'no-store' }); if (!r.ok) return; const j = await r.json(); if (j.gunler) { yaz('dg', j.gunler); yaz('dgZaman', Date.now()); } } catch (e) {}
}
function yaklasanGunler(gunSayisi = 400) {
  const b = ymd(new Date()), s = ymd(new Date(Date.now() + gunSayisi * 864e5));
  return (oku('dg', []) || []).filter(x => x.tarih >= b && x.tarih <= s);
}
function gunFarki(t) { const [y, m, d] = t.split('-').map(Number), n = new Date(); return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())) / 864e5); }
function tarihYaz(t, o = { day: 'numeric', month: 'long', weekday: 'long' }) { const [y, m, d] = t.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('tr-TR', o); }
// Seçili ilin verisinden Ramazan günleri (şu anki ya da sıradaki Ramazan)
function ramazanGunleri() {
  const dv = diyanetVeri(); if (!dv || !dv.hicriNo) return null;
  const b = ymd(new Date(Date.now() - 31 * 864e5));
  const t = Object.keys(dv.hicriNo).sort().filter(x => x >= b && dv.hicriNo[x][1] === 9);
  if (!t.length) return null;
  const yil = dv.hicriNo[t[0]][2];
  return t.filter(x => dv.hicriNo[x][2] === yil).map(x => ({ tarih: x, gun: dv.hicriNo[x][0], v: dv.gunler[x] }));
}
function hicri(d = new Date()) {
  const dv = diyanetVeri(); if (dv && dv.hicri && dv.hicri[ymd(d)]) return dv.hicri[ymd(d)];
  try { return new Intl.DateTimeFormat('tr-TR-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(d).replace(/^Hicri\s+|\s+(AH|Hicri)$/gi, '') + ' (yaklaşık)'; } catch (e) { return ''; }
}

// ---------- Bildirimler ----------
function bildirimAyar() { return oku('bildirim', { acik: false, vakitler: [true, false, true, true, true, true], once: 0 }); }
async function bildirimPlanla() {
  const LN = eklenti('LocalNotifications'); if (!NATIVE || !LN) return;
  try {
    const bekleyen = await LN.getPending(); const eski = (bekleyen.notifications || []).filter(n => n.id >= 1000 && n.id < 3000);
    if (eski.length) await LN.cancel({ notifications: eski.map(n => ({ id: n.id })) });
    const a = bildirimAyar(); if (!a.acik) return;
    const liste = [], simdi = new Date(), ad = konumAdi();
    for (let g = 0; g < 7 && liste.length < 50; g++) {
      const gun = new Date(simdi); gun.setDate(gun.getDate() + g);
      gunVakitleri(gun).v.forEach((t, i) => {
        if (!a.vakitler[i]) return;
        const at = new Date(t.getTime() - a.once * 60e3); if (at <= simdi) return;
        const vakitAd = VAKIT_ADLARI[i];
        liste.push({
          id: 1000 + g * 10 + i,
          title: a.once ? `${vakitAd} vaktine ${a.once} dakika` : (i === 1 ? 'Güneş doğdu' : `${vakitAd} vakti`),
          body: a.once ? `${ad} için ${vakitAd.toLocaleLowerCase('tr')} vakti ${saatYaz(t)}'de giriyor.` : (i === 1 ? `${ad}: Kerahat vakti, güneş doğuşu ${saatYaz(t)}.` : `${ad} için ${vakitAd.toLocaleLowerCase('tr')} vakti girdi (${saatYaz(t)}).`),
          schedule: { at, allowWhileIdle: true }
        });
      });
    }
    // Kandil ve bayramlar için o günün sabahı 10:00'da hatırlatma
    yaklasanGunler(7).filter(x => x.tur !== 'gun' || /Ramazan Başlangıcı|Aşure|Hicrî/.test(x.ad)).slice(0, 5).forEach((x, i) => {
      const [y, mo, d] = x.tarih.split('-').map(Number), at = new Date(y, mo - 1, d, 10, 0); if (at <= simdi) return;
      liste.push({ id: 2000 + i, title: x.ad, body: x.tur === 'kandil' ? `Bu akşam ${x.ad}. Kandiliniz mübarek olsun.` : `Bugün ${x.ad}.`, schedule: { at, allowWhileIdle: true } });
    });
    if (liste.length) await LN.schedule({ notifications: liste.slice(0, 55) });
  } catch (e) { console.warn('bildirim', e); }
}
async function bildirimIzni() {
  const LN = eklenti('LocalNotifications'); if (!NATIVE || !LN) { toast('Bildirimler yalnızca telefonda çalışır'); return false; }
  try { let p = await LN.checkPermissions(); if (p.display !== 'granted') p = await LN.requestPermissions(); return p.display === 'granted'; } catch (e) { return false; }
}

// ---------- Reklam (yalnızca kullanıcı isterse) ----------
let reklamHazir = false;
async function destekOl(btn) {
  const A = eklenti('AdMob');
  if (!NATIVE || !A) { toast('Reklam yalnızca telefonda gösterilir. Niyetiniz için Allah razı olsun.'); return; }
  btn.disabled = true; const eski = btn.textContent; btn.textContent = 'Reklam hazırlanıyor…';
  try {
    if (!reklamHazir) { await A.initialize({}); reklamHazir = true; }
    await A.prepareRewardVideoAd({ adId: PLATFORM === 'ios' ? REKLAM.ios : REKLAM.android, npa: true });
    await A.showRewardVideoAd();
    yaz('destek', oku('destek', 0) + 1);
    toast('Desteğiniz için Allah razı olsun. 🤲', 3500);
  } catch (e) { toast('Şu an reklam bulunamadı, daha sonra tekrar deneyebilirsiniz.'); }
  btn.disabled = false; btn.textContent = eski;
}

// =====================================================================
// SAYFALAR
// =====================================================================

// ---------- Bugün ----------
function sBugun(m) {
  const bugun = new Date(), gn = gunNo(bugun);
  const tarih = bugun.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
  m.innerHTML = `
    <div class="kart vakit-kart" id="vk">
      <h2>${esc(konumAdi())} · <span id="vk-ad"></span> vaktine</h2>
      <div class="geri-sayim" id="vk-sayac">--:--:--</div>
      <div class="soluk" style="color:#dfe9e3">${esc(tarih)} · ${esc(hicri(bugun))}</div>
      <div class="vakit-satir" id="vk-satir"></div>
    </div>
    <div class="hizli">
      <button id="h-devam"><b>Okumaya devam</b><span id="h-devam-alt">Kur'an-ı Kerîm</span></button>
      <button id="h-zikir"><b>Zikirmatik</b><span>Bugün: ${oku('gunluk.' + ymd(bugun), 0)} zikir</span></button>
    </div>
    <div id="ozel-gun"></div>
    <div class="kart"><h2>Günün Ayeti</h2><div id="ga">…</div></div>
    <div class="kart"><h2>Günün Hadisi</h2><div class="hadis-metin" id="gh"></div></div>
    <div class="kart dua-kart">
      <p class="soluk">Bu uygulama Allah rızası için hazırlandı.</p>
      <p>Hazırlayanlar, aileleri ve efradı için bir dua etmeniz yeter. 🤲</p>
    </div>`;
  const vk = () => {
    const s = siradakiVakit(), v = gunVakitleri(new Date()).v;
    $('#vk-ad').textContent = VAKIT_ADLARI[s.i]; $('#vk-sayac').textContent = kalan(s.t - new Date());
    $('#vk-satir').innerHTML = v.map((t, i) => `<div class="${i === s.onceki ? 'simdi' : ''}"><b>${saatYaz(t)}</b>${VAKIT_ADLARI[i]}</div>`).join('');
  };
  vk(); const z = setInterval(vk, 1000); temizlik.push(() => clearInterval(z));
  $('#vk').onclick = () => sekme('vakitler');
  const ozel = () => {
    let h = '';
    const rg = ramazanGunleri(), bt = ymd(new Date()), rb = rg && rg.find(x => x.tarih === bt);
    if (rb) h += `<button class="kart vakit-kart" style="width:100%;text-align:left" id="rm"><h2>Ramazan · ${rb.gun}. gün</h2><div style="display:flex;gap:18px"><div><div class="soluk" style="color:#dfe9e3">İmsak (sahur)</div><b style="font-size:22px">${rb.v[0]}</b></div><div><div class="soluk" style="color:#dfe9e3">İftar</div><b style="font-size:22px">${rb.v[4]}</b></div></div></button>`;
    const y = yaklasanGunler(10)[0];
    if (y) { const f = gunFarki(y.tarih); h += `<button class="kart" style="width:100%;text-align:left" id="og"><h2>${f === 0 ? 'Bugün' : f === 1 ? 'Yarın' : f + ' gün sonra'}</h2><b style="font-size:18px">${esc(y.ad)}</b><div class="soluk">${esc(tarihYaz(y.tarih))}${y.tur === 'kandil' ? ' · kandil gecesi o günün akşamıdır' : ''}</div></button>`; }
    $('#ozel-gun').innerHTML = h;
    if ($('#rm')) $('#rm').onclick = () => sayfa(sImsakiye, 'Ramazan İmsakiyesi');
    if ($('#og')) $('#og').onclick = () => sayfa(sDiniGunler, 'Dini Günler');
  };
  ozel(); diniGunGuncelle().then(() => { if ($('#ozel-gun')) ozel(); });
  const son = oku('sonOkunan', null);
  $('#h-devam').onclick = () => { if (son) sayfa(mm => sOku(mm, son.s, son.a), 'Kur\'an'); else sekme('kuran'); };
  $('#h-zikir').onclick = () => sekme('zikir');
  const h = HADISLER[gn % HADISLER.length];
  $('#gh').innerHTML = `${esc(h[1])}<div class="kaynak">${esc(h[2])}</div>`;
  const [s, a] = SECME_AYETLER[gn % SECME_AYETLER.length];
  kuran().then(K => {
    const sure = K[s - 1], ay = sure.v[a - 1];
    if (son) $('#h-devam-alt').textContent = `${K[son.s - 1].ad} ${son.a}. ayet`;
    $('#ga').innerHTML = `<div class="ar">${esc(ay[0])}</div><div class="meal">${esc(ay[1])}</div><div class="kaynak">${esc(sure.ad)} Sûresi, ${a}</div>`;
    $('#ga').onclick = () => sayfa(mm => sOku(mm, s, a), sure.ad);
  });
}

// ---------- Kur'an: sure listesi ----------
function sKuran(m) {
  m.innerHTML = `<input class="ara" id="ara" type="search" placeholder="Sûre adı, numarası veya mealde kelime ara" autocomplete="off">
    <div id="ust-kartlar"></div><div class="liste" id="sureler"></div>`;
  kuran().then(K => {
    const son = oku('sonOkunan', null), isr = oku('isaretler', []);
    let ust = '';
    if (son) ust += `<button class="kart" style="width:100%;text-align:left" id="devam"><h2>Kaldığın yer</h2>${esc(K[son.s - 1].ad)} Sûresi, ${son.a}. ayet</button>`;
    if (isr.length) ust += `<button class="btn tam" id="isr" style="margin-bottom:12px">★ Yer imleri (${isr.length})</button>`;
    $('#ust-kartlar').innerHTML = ust;
    if (son) $('#devam').onclick = () => sayfa(mm => sOku(mm, son.s, son.a), K[son.s - 1].ad);
    if (isr.length) $('#isr').onclick = () => sayfa(sIsaretler, 'Yer İmleri');
    const listele = q => {
      const qq = trKucuk(q.trim());
      const s = K.filter(x => !qq || String(x.n) === qq || trKucuk(x.ad).includes(qq));
      let h = s.map(x => `<button data-n="${x.n}"><span class="no">${x.n}</span><span class="orta"><b>${esc(x.ad)}</b><span class="soluk">${x.t === 'k' ? 'Mekkî' : 'Medenî'} · ${x.v.length} ayet</span></span><span class="ar-kucuk">${esc(x.ar)}</span></button>`).join('');
      if (qq.length >= 3 && !/^\d+$/.test(qq)) h += `<button id="mealde"><span class="no">⌕</span><span class="orta"><b>Mealde ara: “${esc(q.trim())}”</b><span class="soluk">Tüm ayetlerde arar</span></span></button>`;
      $('#sureler').innerHTML = h || '<div class="soluk">Sonuç yok</div>';
      const md = $('#mealde'); if (md) md.onclick = () => sayfa(mm => sAra(mm, q.trim()), 'Arama');
    };
    listele('');
    $('#ara').oninput = e => listele(e.target.value);
    $('#sureler').onclick = e => { const b = e.target.closest('button[data-n]'); if (b) { const n = +b.dataset.n; sayfa(mm => sOku(mm, n, 1), K[n - 1].ad); } };
  });
}
function sAra(m, q) {
  m.innerHTML = '<div class="soluk">Aranıyor…</div>';
  kuran().then(K => {
    const qq = trKucuk(q), out = [];
    for (const s of K) for (let i = 0; i < s.v.length; i++) if (trKucuk(s.v[i][1]).includes(qq)) { out.push([s, i + 1]); if (out.length >= 200) break; }
    m.innerHTML = `<p class="soluk">“${esc(q)}” için ${out.length >= 200 ? '200+' : out.length} sonuç</p>` + out.map(([s, a]) =>
      `<button class="ayet" style="width:100%;text-align:left;display:block" data-s="${s.n}" data-a="${a}"><div class="soluk">${esc(s.ad)} ${a}</div><div class="meal">${esc(s.v[a - 1][1])}</div></button>`).join('');
    m.onclick = e => { const b = e.target.closest('button[data-s]'); if (b) sayfa(mm => sOku(mm, +b.dataset.s, +b.dataset.a), K[b.dataset.s - 1].ad); };
  });
}
function sIsaretler(m) {
  kuran().then(K => {
    const isr = oku('isaretler', []);
    if (!isr.length) { m.innerHTML = '<p class="soluk">Henüz yer imi yok. Okurken ayetin yanındaki ☆ ile ekleyebilirsiniz.</p>'; return; }
    m.innerHTML = isr.map(([s, a]) => `<button class="ayet" style="width:100%;text-align:left;display:block" data-s="${s}" data-a="${a}"><div class="soluk">${esc(K[s - 1].ad)} ${a}</div><div class="meal">${esc(K[s - 1].v[a - 1][1])}</div></button>`).join('');
    m.onclick = e => { const b = e.target.closest('button[data-s]'); if (b) sayfa(mm => sOku(mm, +b.dataset.s, +b.dataset.a), K[b.dataset.s - 1].ad); };
  });
}

// ---------- Kur'an: okuyucu ----------
function sOku(m, n, hedefAyet) {
  kuran().then(K => {
    const s = K[n - 1]; let gor = oku('gorunum', { ar: true, tr: true });
    $('#baslik').textContent = `${n}. ${s.ad}`;
    const isr = () => oku('isaretler', []);
    const isaretli = a => isr().some(x => x[0] === n && x[1] === a);
    const ayetHtml = (v, i) => `<div class="ayet" id="a${i + 1}" data-a="${i + 1}">
        <div class="ayet-ust"><span class="no">${i + 1}</span><span class="bosluk"></span><button data-isr="${i + 1}" class="${isaretli(i + 1) ? 'isaretli' : ''}" aria-label="Yer imi">${isaretli(i + 1) ? '★' : '☆'}</button></div>
        ${gor.ar ? `<div class="ar">${esc(v[0])}</div>` : ''}${gor.tr ? `<div class="meal">${esc(v[1])}</div>` : ''}</div>`;
    const yenile = () => {
      m.innerHTML = `<div class="okuyucu-ayar">
          <button class="cip ${gor.ar ? 'acik' : ''}" id="g-ar">Arapça</button><button class="cip ${gor.tr ? 'acik' : ''}" id="g-tr">Meal</button>
          <button class="cip" id="b-k">A−</button><button class="cip" id="b-b">A+</button></div>
        ${n !== 1 && n !== 9 && gor.ar ? '<div class="besmele">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ</div>' : ''}
        ${s.v.map(ayetHtml).join('')}
        <div class="sure-gecis">${n > 1 ? `<button id="onceki">‹ ${esc(K[n - 2].ad)}</button>` : '<span></span>'}${n < 114 ? `<button id="sonraki">${esc(K[n].ad)} ›</button>` : ''}</div>
        <p class="kaynak" style="text-align:center">Meal: Diyanet İşleri Başkanlığı · Metin: Tanzil.net</p>`;
      $('#g-ar').onclick = () => { gor = { ...gor, ar: !gor.ar }; if (!gor.ar && !gor.tr) gor.tr = true; yaz('gorunum', gor); konumKoru(yenile); };
      $('#g-tr').onclick = () => { gor = { ...gor, tr: !gor.tr }; if (!gor.ar && !gor.tr) gor.ar = true; yaz('gorunum', gor); konumKoru(yenile); };
      $('#b-k').onclick = () => { yaz('arBoyut', Math.max(20, oku('arBoyut', 28) - 2)); yaz('trBoyut', Math.max(13, oku('trBoyut', 16) - 1)); boyutUygula(); };
      $('#b-b').onclick = () => { yaz('arBoyut', Math.min(44, oku('arBoyut', 28) + 2)); yaz('trBoyut', Math.min(24, oku('trBoyut', 16) + 1)); boyutUygula(); };
      if ($('#onceki')) $('#onceki').onclick = () => { yigin.pop(); sayfa(mm => sOku(mm, n - 1, 1), K[n - 2].ad); };
      if ($('#sonraki')) $('#sonraki').onclick = () => { yigin.pop(); sayfa(mm => sOku(mm, n + 1, 1), K[n].ad); };
      gozle();
    };
    // Görünüm değişince okunan ayette kal
    const konumKoru = f => { const a = enUstAyet(); f(); const el = $('#a' + a, m); if (el) m.scrollTop = el.offsetTop - m.offsetTop - 8; };
    const enUstAyet = () => { const els = m.querySelectorAll('.ayet'); for (const el of els) if (el.offsetTop - m.offsetTop + el.offsetHeight > m.scrollTop) return +el.dataset.a; return 1; };
    let gozlemci;
    const gozle = () => {
      if (gozlemci) gozlemci.disconnect();
      gozlemci = new IntersectionObserver(() => { const a = enUstAyet(); if (a) yaz('sonOkunan', { s: n, a }); }, { root: m, threshold: 0 });
      m.querySelectorAll('.ayet').forEach(el => gozlemci.observe(el));
    };
    temizlik.push(() => gozlemci && gozlemci.disconnect());
    m.onclick = e => {
      const b = e.target.closest('button[data-isr]'); if (!b) return;
      const a = +b.dataset.isr; let l = isr();
      if (l.some(x => x[0] === n && x[1] === a)) { l = l.filter(x => !(x[0] === n && x[1] === a)); b.textContent = '☆'; b.classList.remove('isaretli'); toast('Yer imi kaldırıldı'); }
      else { l.unshift([n, a]); b.textContent = '★'; b.classList.add('isaretli'); toast('Yer imlerine eklendi'); }
      yaz('isaretler', l.slice(0, 200)); titres();
    };
    yenile();
    if (hedefAyet > 1) { const el = $('#a' + hedefAyet, m); if (el) { m.scrollTop = el.offsetTop - m.offsetTop - 8; el.classList.add('vurgulu'); setTimeout(() => el.classList.remove('vurgulu'), 1800); } }
    yaz('sonOkunan', { s: n, a: hedefAyet || 1 });
  });
}

// ---------- Zikirmatik ----------
function sZikir(m) {
  let secili = oku('zikirSecili', 0), sayi = oku('zikirSayi.' + secili, 0);
  const ozelHedef = oku('ozelHedef', {});
  const hedef = () => ozelHedef[secili] || ZIKIRLER[secili][3];
  m.innerHTML = `<div class="zikir-secim" id="zs">${ZIKIRLER.map((z, i) => `<button class="cip ${i === secili ? 'acik' : ''}" data-i="${i}">${esc(z[0])}</button>`).join('')}</div>
    <div class="zikir-ust"><div class="ar" id="z-ar"></div><div id="z-anlam" class="soluk"></div></div>
    <button class="sayac" id="sayac" aria-label="Say">
      <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="47" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="3"/>
      <circle id="halka" cx="50" cy="50" r="47" fill="none" stroke="#e8c46e" stroke-width="3" stroke-linecap="round" stroke-dasharray="295.3" stroke-dashoffset="295.3"/></svg>
      <div><div class="sayi" id="sayi">0</div><div class="hedef" id="hedef"></div></div>
    </button>
    <div class="zikir-alt"><button class="btn" id="sifirla">Sıfırla</button><button class="btn" id="hedef-deg">Hedef</button></div>
    <p class="soluk" style="text-align:center;margin-top:16px" id="gunluk"></p>
    <div class="kart" style="margin-top:8px"><h2>Namazdan sonra tesbihat</h2><p class="soluk" style="margin:0">Sübhânallâh 33, Elhamdülillâh 33, Allâhü ekber 33 defa. Sırayla seçerek sayabilirsiniz; hedefe ulaşınca telefon titrer.</p></div>`;
  const goster = () => {
    const z = ZIKIRLER[secili], h = hedef();
    $('#z-ar').textContent = z[1]; $('#z-anlam').textContent = z[2];
    $('#sayi').textContent = sayi; $('#hedef').textContent = `${Math.floor(sayi / h)} tur · hedef ${h}`;
    $('#halka').setAttribute('stroke-dashoffset', 295.3 * (1 - (sayi % h) / h));
    $('#gunluk').textContent = `Bugün toplam ${oku('gunluk.' + ymd(new Date()), 0)} zikir`;
  };
  goster();
  $('#zs').onclick = e => { const b = e.target.closest('button[data-i]'); if (!b) return; secili = +b.dataset.i; yaz('zikirSecili', secili); sayi = oku('zikirSayi.' + secili, 0);
    m.querySelectorAll('#zs .cip').forEach(c => c.classList.toggle('acik', c === b)); goster(); };
  $('#sayac').addEventListener('pointerdown', e => { e.preventDefault();
    sayi++; yaz('zikirSayi.' + secili, sayi); const g = 'gunluk.' + ymd(new Date()); yaz(g, oku(g, 0) + 1);
    if (sayi % hedef() === 0) { titres('HEAVY'); toast(`${ZIKIRLER[secili][0]} — ${hedef()} tamamlandı`); } else titres('LIGHT');
    goster(); });
  $('#sifirla').onclick = () => { sayi = 0; yaz('zikirSayi.' + secili, 0); goster(); };
  $('#hedef-deg').onclick = () => {
    const h = [33, 99, 100, 500, 1000], i = h.indexOf(hedef()); ozelHedef[secili] = h[(i + 1) % h.length]; yaz('ozelHedef', ozelHedef); goster(); toast('Hedef: ' + hedef());
  };
}

// ---------- Vakitler ----------
function sVakitler(m) {
  const ciz2 = () => {
    const k = konum(), bugun = new Date(), gv = gunVakitleri(bugun), s = siradakiVakit(), ba = bildirimAyar();
    const hafta = []; for (let g = 0; g < 7; g++) { const d = new Date(bugun); d.setDate(d.getDate() + g); hafta.push([d, gunVakitleri(d).v]); }
    m.innerHTML = `
      <div class="kart vakit-kart"><h2>${esc(konumAdi())} · ${VAKIT_ADLARI[s.i]} vaktine</h2><div class="geri-sayim" id="vs">--:--:--</div>
        <div class="soluk" style="color:#dfe9e3">${esc(bugun.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }))}<br>${esc(hicri(bugun))}</div></div>
      <div class="liste vakit-liste">${gv.v.map((t, i) => `<div class="${i === s.onceki ? 'simdi' : ''}"><span class="ad">${VAKIT_ADLARI[i]}</span><span><span class="saat">${saatYaz(t)}</span><button class="zil ${ba.acik && ba.vakitler[i] ? 'acik' : ''}" data-z="${i}" aria-label="Bildirim">🔔</button></span></div>`).join('')}</div>
      <p class="soluk" style="margin:-4px 4px 12px">${gv.kaynak !== 'Hesaplama' ? 'Diyanet hesaplama yöntemi · AlAdhan' : 'İnternetsiz hesaplandı (Diyanet yöntemi). İnternete bağlanınca güncel veri yüklenir.'}</p>
      <div class="kart"><h2>Konum</h2>
        <select class="sec" id="il"><option value="">Konumum (GPS)</option>${ILLER.map((x, i) => `<option value="${i + 1}" ${k.tip === 'il' && k.plaka === i + 1 ? 'selected' : ''}>${esc(x[0])}</option>`).join('')}</select>
        <button class="btn tam" id="gps">📍 Konumumu bul</button></div>
      <div class="kart"><h2>Ezan bildirimi</h2>
        <div class="ayar-satir"><span>Vakit girince haber ver</span><button class="anahtar ${ba.acik ? 'acik' : ''}" id="b-ac"></button></div>
        <div class="ayar-satir" style="margin-top:10px"><span>Ne zaman?</span><select id="b-once" class="cip">${[0, 5, 10, 15, 30, 45].map(x => `<option value="${x}" ${ba.once === x ? 'selected' : ''}>${x ? x + ' dk önce' : 'Tam vaktinde'}</option>`).join('')}</select></div>
        <p class="soluk" style="margin:10px 0 0">Hangi vakitler için bildirim geleceğini yukarıdaki 🔔 simgeleriyle seçebilirsiniz.</p>
        ${PLATFORM === 'android' ? '<button class="btn tam" id="tam-alarm">Bildirimler gecikiyorsa: tam zamanlı alarm izni</button>' : ''}</div>
      <div class="kart"><h2>7 günlük vakitler</h2><table class="hafta"><tr><th></th>${VAKIT_ADLARI.map(v => `<th>${v}</th>`).join('')}</tr>
        ${hafta.map(([d, v]) => `<tr><th>${d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</th>${v.map(t => `<td>${saatYaz(t)}</td>`).join('')}</tr>`).join('')}</table></div>
      <button class="btn tam" id="imsakiye">🌙 Ramazan imsakiyesi</button>
      <button class="btn tam" id="dinigun">📅 Dini günler ve kandiller</button>
      <button class="btn tam" id="kible">🧭 Kıble yönü</button>`;
    const say = () => { const x = siradakiVakit(); const el = $('#vs'); if (el) el.textContent = kalan(x.t - new Date()); };
    say(); const z = setInterval(say, 1000); temizlik.push(() => clearInterval(z));
    $('#il').onchange = async e => { if (!e.target.value) { $('#gps').click(); return; } yaz('konum', { tip: 'il', plaka: +e.target.value }); ciz2(); if (await diyanetGuncelle(true)) ciz2(); bildirimPlanla(); };
    $('#gps').onclick = () => konumBul(async () => { ciz2(); if (await diyanetGuncelle(true)) ciz2(); bildirimPlanla(); });
    $('#b-ac').onclick = async () => { const a = bildirimAyar(); if (!a.acik && !(await bildirimIzni())) { toast('Bildirim izni verilmedi. Telefon ayarlarından açabilirsiniz.'); return; }
      a.acik = !a.acik; yaz('bildirim', a); await bildirimPlanla(); toast(a.acik ? 'Ezan bildirimleri açıldı' : 'Ezan bildirimleri kapatıldı'); ciz2(); };
    $('#b-once').onchange = e => { const a = bildirimAyar(); a.once = +e.target.value; yaz('bildirim', a); bildirimPlanla(); };
    m.querySelectorAll('[data-z]').forEach(b => b.onclick = async () => {
      const a = bildirimAyar(); if (!a.acik) { if (!(await bildirimIzni())) { toast('Bildirim izni verilmedi'); return; } a.acik = true; a.vakitler = [false, false, false, false, false, false]; }
      const i = +b.dataset.z; a.vakitler[i] = !a.vakitler[i]; yaz('bildirim', a); bildirimPlanla(); toast(`${VAKIT_ADLARI[i]} bildirimi ${a.vakitler[i] ? 'açık' : 'kapalı'}`); ciz2(); });
    const ta = $('#tam-alarm'); if (ta) ta.onclick = async () => { const LN = eklenti('LocalNotifications'); try { await LN.changeExactNotificationSetting(); } catch (e) { toast('Bu cihazda gerekmiyor'); } };
    $('#kible').onclick = () => sayfa(sKible, 'Kıble');
    $('#imsakiye').onclick = () => sayfa(sImsakiye, 'Ramazan İmsakiyesi');
    $('#dinigun').onclick = () => sayfa(sDiniGunler, 'Dini Günler');
  };
  ciz2();
  diyanetGuncelle(false).then(y => { if (y && yigin[yigin.length - 1].fn === sVakitler) ciz2(); });
}
function konumBul(sonra) {
  if (!navigator.geolocation) { toast('Konum alınamadı'); return; }
  toast('Konum alınıyor…', 6000);
  navigator.geolocation.getCurrentPosition(p => {
    const lat = p.coords.latitude, lng = p.coords.longitude;
    let en = 0, ed = 1e9; ILLER.forEach((x, i) => { const d = mesafe(lat, lng, x[1], x[2]); if (d < ed) { ed = d; en = i; } });
    if (ed < 120) { yaz('konum', { tip: 'il', plaka: en + 1 }); toast('Konum: ' + ILLER[en][0]); }
    else { yaz('konum', { tip: 'gps', lat, lng, ad: 'Konumum' }); toast('Konumunuza göre hesaplanıyor'); }
    sonra && sonra();
  }, () => toast('Konum izni verilmedi. Listeden il seçebilirsiniz.'), { timeout: 15000, maximumAge: 6e5, enableHighAccuracy: false });
}
function mesafe(a, b, c, d) { const r = Math.PI / 180, x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); }
function kibleAci(lat, lng) {
  const r = Math.PI / 180, f1 = lat * r, f2 = KABE.lat * r, dl = (KABE.lng - lng) * r;
  return (Math.atan2(Math.sin(dl), Math.cos(f1) * Math.tan(f2) - Math.sin(f1) * Math.cos(dl)) / r + 360) % 360;
}

// ---------- Kıble ----------
function sKible(m) {
  const c = konumKoord(), aci = kibleAci(c.lat, c.lng);
  m.innerHTML = `<div class="kart" style="text-align:center"><h2>${esc(konumAdi())}</h2>
      <div class="pusula"><div class="isaret"></div><div class="kadran" id="kadran">
        ${['K', 'D', 'G', 'B'].map((y, i) => `<span class="yon" style="transform:translate(-50%,-50%) rotate(${i * 90}deg) translateY(calc(-1 * min(35vw,135px))) rotate(${-i * 90}deg)">${y}</span>`).join('')}
        <div class="ok" style="transform:rotate(${aci}deg)"></div><div class="merkez"></div></div></div>
      <p style="font-size:20px;font-weight:600;margin:6px 0">Kıble açısı: ${aci.toFixed(1)}°</p>
      <p class="soluk" id="pusula-durum">Kuzeyden saat yönünde. Telefonu yere paralel tutun.</p>
      <button class="btn ana tam" id="pusula-bas">Pusulayı başlat</button></div>
    <p class="soluk">Metal eşyalar ve mıknatıslar pusulayı şaşırtabilir. Pusula yanlış gösteriyorsa telefonu havada 8 çizer gibi hareket ettirin.</p>`;
  const kadran = $('#kadran');
  const dinle = e => {
    let h = null;
    if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading;
    else if (e.absolute && typeof e.alpha === 'number') h = 360 - e.alpha;
    if (h === null) return;
    kadran.style.transform = `rotate(${-h}deg)`;
    const fark = Math.abs(((aci - h + 540) % 360) - 180);
    $('#pusula-durum').textContent = fark < 4 ? '✅ Kıbleye dönüksünüz' : `Telefonun yönü: ${Math.round(h)}°`;
    if (fark < 4 && !dinle.titredi) { titres('HEAVY'); dinle.titredi = true; } else if (fark > 8) dinle.titredi = false;
  };
  $('#pusula-bas').onclick = async () => {
    try { if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) { const r = await DeviceOrientationEvent.requestPermission(); if (r !== 'granted') { toast('Pusula izni verilmedi'); return; } } } catch (e) {}
    const ev = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
    window.addEventListener(ev, dinle); temizlik.push(() => window.removeEventListener(ev, dinle));
    $('#pusula-bas').hidden = true;
  };
}

// ---------- Daha ----------
function sDaha(m) {
  const satir = (id, ikon, b, a) => `<button id="${id}"><span class="no">${ikon}</span><span class="orta"><b>${b}</b><span class="soluk">${a}</span></span><span class="soluk">›</span></button>`;
  m.innerHTML = `<div class="liste">
      ${satir('d-hadis', 'ﷺ', 'Hadis-i Şerifler', `${HADISLER.length} seçme hadis`)}
      ${satir('d-esma', '۩', 'Esmâü\'l-Hüsnâ', 'Allah\'ın 99 güzel ismi')}
      ${satir('d-imsakiye', '🌙', 'Ramazan İmsakiyesi', 'Sahur ve iftar vakitleri')}
      ${satir('d-dinigun', '📅', 'Dini Günler ve Kandiller', 'Bayramlar, kandiller, mübarek günler')}
      ${satir('d-kible', '🧭', 'Kıble Yönü', 'Pusula ile kıbleyi bul')}
      ${satir('d-isr', '★', 'Yer İmleri', 'İşaretlediğin ayetler')}
    </div>
    <div class="liste">
      ${satir('d-ayar', '⚙︎', 'Ayarlar', 'Görünüm, yazı boyutu')}
      ${satir('d-hak', '🤲', 'Bu Uygulama Hakkında', 'Niyetimiz ve kaynaklar')}
    </div>
    <div class="kart dua-kart"><h2>Destek Ol</h2>
      <p>Uygulama tamamen ücretsizdir ve kendiliğinden reklam göstermez.</p>
      <p class="soluk">Sunucu ve mağaza masraflarına katkı olsun isterseniz kısa bir reklam izleyebilirsiniz. Reklam yalnızca siz bu butona bastığınızda açılır.</p>
      <button class="btn ana tam" id="destek">Reklam izleyerek destek ol</button></div>`;
  $('#d-hadis').onclick = () => sayfa(sHadisler, 'Hadis-i Şerifler');
  $('#d-esma').onclick = () => sayfa(sEsma, 'Esmâü\'l-Hüsnâ');
  $('#d-kible').onclick = () => sayfa(sKible, 'Kıble');
  $('#d-imsakiye').onclick = () => sayfa(sImsakiye, 'Ramazan İmsakiyesi');
  $('#d-dinigun').onclick = () => sayfa(sDiniGunler, 'Dini Günler');
  $('#d-isr').onclick = () => sayfa(sIsaretler, 'Yer İmleri');
  $('#d-ayar').onclick = () => sayfa(sAyarlar, 'Ayarlar');
  $('#d-hak').onclick = () => sayfa(sHakkinda, 'Hakkında');
  $('#destek').onclick = e => destekOl(e.currentTarget);
}
function sImsakiye(m) {
  const rg = ramazanGunleri();
  if (!rg) { m.innerHTML = `<div class="kart"><p style="margin:0">İmsakiye için ${esc(konumAdi())} verisi henüz yüklenmedi. İnternete bağlıyken Vakitler sekmesinden il seçtiğinizde otomatik iner.</p></div>`; diyanetGuncelle(true).then(y => { if (y && yigin[yigin.length - 1].fn === sImsakiye) ciz(); }); return; }
  const bt = ymd(new Date()), ilk = rg[0], son = rg[rg.length - 1];
  m.innerHTML = `<div class="kart vakit-kart"><h2>${esc(konumAdi())} · Ramazan ${diyanetVeri().hicriNo[ilk.tarih][2]}</h2>
      <div style="font-size:18px;font-weight:600">${esc(tarihYaz(ilk.tarih, { day: 'numeric', month: 'long' }))} – ${esc(tarihYaz(son.tarih, { day: 'numeric', month: 'long', year: 'numeric' }))}</div>
      <div class="soluk" style="color:#dfe9e3">${bt < ilk.tarih ? `Ramazan'a ${gunFarki(ilk.tarih)} gün kaldı` : 'Hayırlı Ramazanlar'}</div></div>
    <div class="kart" style="padding:10px"><table class="hafta"><tr><th>Gün</th><th>Tarih</th><th>İmsak</th><th>Güneş</th><th>Öğle</th><th>İkindi</th><th>İftar</th><th>Yatsı</th></tr>
      ${rg.map(x => `<tr id="r${x.tarih}" style="${x.tarih === bt ? 'background:var(--vurgu);font-weight:700' : ''}"><td>${x.gun}</td><td>${esc(tarihYaz(x.tarih, { day: 'numeric', month: 'short' }))}</td>${x.v.map((t, i) => `<td${i === 0 || i === 4 ? ' style="font-weight:700"' : ''}>${t}</td>`).join('')}</tr>`).join('')}</table></div>
    <p class="soluk">Vakitler Diyanet hesaplama yöntemiyle (AlAdhan) hazırlanmıştır. İmsak vaktinde yemeyi bırakmak gerekir; ihtiyaten birkaç dakika önce bırakılması tavsiye edilir.</p>`;
  const bugunSatir = m.querySelector('#r' + bt); if (bugunSatir) m.scrollTop = bugunSatir.offsetTop - 120;
}
function sDiniGunler(m) {
  const ciz3 = () => {
    const l = yaklasanGunler(400);
    if (!l.length) { m.innerHTML = '<p class="soluk">Dini günler listesi henüz yüklenmedi. İnternete bağlıyken tekrar açın.</p>'; return; }
    m.innerHTML = `<div class="liste">${l.map(x => { const f = gunFarki(x.tarih); return `<div><span class="no">${x.tur === 'kandil' ? '🕯️' : x.tur === 'bayram' ? '🌙' : '✦'}</span><span class="orta"><b>${esc(x.ad)}</b><span class="soluk">${esc(tarihYaz(x.tarih, { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }))}</span></span><span class="soluk">${f === 0 ? 'Bugün' : f === 1 ? 'Yarın' : f + ' gün'}</span></div>`; }).join('')}</div>
      <p class="soluk">Kandil geceleri, belirtilen günün akşamıdır. Tarihler Diyanet hicri takvimine göre hesaplanmıştır.</p>`;
  };
  ciz3(); diniGunGuncelle().then(() => { if (yigin[yigin.length - 1].fn === sDiniGunler) ciz3(); });
}
function sHadisler(m) {
  let kat = '';
  m.innerHTML = HADISLER.map((h, i) => {
    const b = h[0] !== kat ? `<div class="kategori-baslik">${esc(h[0])}</div>` : ''; kat = h[0];
    return b + `<div class="kart"><div class="hadis-metin">${esc(h[1])}</div><div class="kaynak">${esc(h[2])}</div></div>`;
  }).join('');
}
function sEsma(m) {
  m.innerHTML = `<p class="soluk" style="margin-top:0">“Allah'ın doksan dokuz ismi vardır. Kim onları sayarsa (anlayarak ezberler ve gereğince yaşarsa) cennete girer.” (Buhârî, Da'avât; Müslim, Zikir)</p>
    <div class="liste">${ESMA.map((e, i) => `<div><span class="no">${i + 1}</span><span class="orta"><b>${esc(e[0])}</b><span class="soluk">${esc(e[2])}</span></span><span class="ar-kucuk">${esc(e[1])}</span></div>`).join('')}</div>`;
}
function sAyarlar(m) {
  const t = oku('tema', 'sistem');
  m.innerHTML = `<div class="kart"><h2>Görünüm</h2><div class="okuyucu-ayar">
      ${[['sistem', 'Telefona göre'], ['acik', 'Açık'], ['koyu', 'Koyu']].map(([k, a]) => `<button class="cip ${t === k ? 'acik' : ''}" data-t="${k}">${a}</button>`).join('')}</div></div>
    <div class="kart"><h2>Yazı boyutu</h2>
      <div class="ar" style="text-align:center">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ</div><div class="meal" style="text-align:center">Rahmân ve Rahîm olan Allah'ın adıyla</div>
      <div class="zikir-alt" style="margin-top:10px"><button class="btn" id="kucult">A−</button><button class="btn" id="buyut">A+</button></div></div>
    <div class="kart"><h2>Zikir sayaçları</h2><button class="btn tam" id="zs-sifir">Tüm zikir sayaçlarını sıfırla</button></div>`;
  m.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { yaz('tema', b.dataset.t); temaUygula(); m.querySelectorAll('[data-t]').forEach(x => x.classList.toggle('acik', x === b)); });
  $('#kucult').onclick = () => { yaz('arBoyut', Math.max(20, oku('arBoyut', 28) - 2)); yaz('trBoyut', Math.max(13, oku('trBoyut', 16) - 1)); boyutUygula(); };
  $('#buyut').onclick = () => { yaz('arBoyut', Math.min(44, oku('arBoyut', 28) + 2)); yaz('trBoyut', Math.min(24, oku('trBoyut', 16) + 1)); boyutUygula(); };
  $('#zs-sifir').onclick = () => { ZIKIRLER.forEach((_, i) => yaz('zikirSayi.' + i, 0)); toast('Sayaçlar sıfırlandı'); };
}
function sHakkinda(m) {
  m.innerHTML = `<div class="kart dua-kart">
      <div class="ar" style="text-align:center">رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ</div>
      <p class="soluk">“Rabbimiz! Bizden kabul buyur. Şüphesiz sen hakkıyla işitensin, hakkıyla bilensin.” (Bakara, 127)</p>
      <p>Bu uygulama yalnızca Allah rızası için hazırlanmıştır. Hiçbir ücret istemiyoruz, üyelik yok, verileriniz telefonunuzdan çıkmaz.</p>
      <p><b>Faydalandıysanız, uygulamayı hazırlayanlar, anne babaları, aileleri ve efradı için bir dua etmeniz bize yeter.</b></p>
      <p class="soluk">“Müslümanın, gıyabında kardeşine yaptığı dua kabul olunur. Başında görevli bir melek, ‘Âmin, aynısı sana da olsun’ der.” (Müslim, Zikir)</p></div>
    <div class="kart"><h2>Reklamlar hakkında</h2><p style="margin:0">Uygulama kendiliğinden hiçbir reklam göstermez. “Destek ol” bölümünden isteyen kullanıcılar, sunucu ve mağaza masraflarına katkı için kısa bir reklam izleyebilir. Reklamlar kişiselleştirilmez.</p></div>
    <div class="kart"><h2>Kaynaklar</h2><p style="margin:0" class="soluk">
      Kur'an-ı Kerîm Arapça metni ve Diyanet İşleri Başkanlığı meali: Tanzil.net (tanzil.net)<br>
      Namaz vakitleri, imsakiye ve hicri takvim: AlAdhan (aladhan.com), Diyanet İşleri Başkanlığı hesaplama yöntemi ve hicri takvimi; internet yokken adhan kütüphanesiyle (MIT) aynı yöntemle hesaplanır<br>
      Hadis tercümeleri: belirtilen hadis kaynaklarından seçilmiştir.<br>
      Arapça yazı tipi: Amiri Quran (SIL Open Font License)</p></div>
    <p class="soluk" style="text-align:center">Üç Nur: Kuran Hadis Zikir · sürüm 1.0</p>`;
}

const SEKMELER = {
  bugun: [sBugun, 'Üç Nur'], kuran: [sKuran, 'Kur\'an-ı Kerîm'], zikir: [sZikir, 'Zikirmatik'],
  vakitler: [sVakitler, 'Namaz Vakitleri'], daha: [sDaha, 'Daha Fazla']
};

// ---------- Başlat ----------
temaUygula(); boyutUygula();
document.querySelectorAll('#sekmeler button').forEach(b => b.onclick = () => sekme(b.dataset.s));
$('#geri').onclick = geri;
sekme('bugun');
if (NATIVE) {
  const SB = eklenti('StatusBar'); if (SB) SB.setStyle({ style: 'DARK' }).catch(() => {});
  const App = eklenti('App'); // Android geri tuşu (App eklentisi yoksa sessizce geçer)
  if (App && App.addListener) App.addListener('backButton', () => { if (yigin.length > 1) geri(); else if (App.exitApp) App.exitApp(); });
}
// Diyanet verisini tazele, bildirimleri yeniden planla (iOS'ta en fazla 64 bekleyen bildirim olduğu için her açılışta yenilenir)
Promise.all([diyanetGuncelle(false), diniGunGuncelle()]).then(() => bildirimPlanla());
document.addEventListener('visibilitychange', () => { if (!document.hidden) { diyanetGuncelle(false).then(() => bildirimPlanla()); if (yigin.length === 1) ciz(); } });
