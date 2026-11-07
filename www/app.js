/* Üç Nur: Kuran Hadis Zikir — Allah rızası için. */
'use strict';

// ---------- Ayarlar ----------
// Ödüllü reklam birimleri (AdMob, "Destek ol"). Uygulama kimlikleri scripts/ads.env içinde.
const REKLAM = { ios: 'ca-app-pub-6236520075152909/9110586641', android: 'ca-app-pub-6236520075152909/7307771577' };
// Namaz vakitleri ve dini günler GitHub Pages'te yayınlanır (scripts/aladhan-vakitler.js, AlAdhan · Diyanet yöntemi, aylık güncellenir)
const VAKIT_URL = 'https://bolatemre.github.io/kuran-hadis-zikir/vakitler/';
const KABE = { lat: 21.4225, lng: 39.8262 };
const VAKIT_ADLARI = ['İmsak', 'Güneş', 'Öğle', 'İkindi', 'Akşam', 'Yatsı'];
// Takip hesapları (İslam Penceresi)
const SOSYAL = [
  ['📸', 'Instagram', '@islampenceresi', 'https://www.instagram.com/islampenceresi/'],
  ['▶️', 'YouTube', '@islam.penceresi', 'https://www.youtube.com/@islam.penceresi'],
];
const sosyalListe = () => `<div class="liste">${SOSYAL.map(([i, ad, k, url]) => `<a href="${url}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none"><span class="no">${i}</span><span class="orta"><b>${ad}</b><span class="soluk">${k}</span></span><span class="soluk">›</span></a>`).join('')}</div>`;

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
  const ana = yigin.length === 1 && top.fn === sBugun;
  $('#ust').classList.toggle('ana', ana);
  if (ana) $('#baslik').innerHTML = '<span class="ust-ad">Üç Nur</span><span class="ust-alt">Kur\'an, Hadis ve Zikirde Buluşalım!</span>';
  else $('#baslik').textContent = top.baslik;
  $('#geri').hidden = yigin.length < 2; $('#ust-sag').innerHTML = '';
  const m = $('#icerik'); m.onclick = null; m.style.paddingBottom = ''; m.innerHTML = ''; m.scrollTop = 0; top.fn(m);
}
let temizlik = []; // sayfa değişince durdurulacak zamanlayıcılar/dinleyiciler

// ---------- Kur'an verisi ----------
let kuranP = null;
function kuran() { return kuranP || (kuranP = fetch('data/kuran.json').then(r => r.json())); }

// ---------- Namaz vakitleri ----------
// Konum: { tip: 'il', plaka } | { tip: 'ilce', plaka, ilce, lat, lng } | { tip: 'gps', lat, lng }
function konum() { return oku('konum', { tip: 'il', plaka: 34 }); }
function konumAdi(k = konum()) {
  if (k.tip === 'il') return ILLER[k.plaka - 1][0];
  if (k.tip === 'ilce') return k.ilce === 'Merkez' ? ILLER[k.plaka - 1][0] + ' Merkez' : k.ilce + ', ' + ILLER[k.plaka - 1][0];
  return k.ad || 'Konumum';
}
function konumKoord(k = konum()) { return k.tip === 'il' ? { lat: ILLER[k.plaka - 1][1], lng: ILLER[k.plaka - 1][2] } : { lat: k.lat, lng: k.lng }; }
function saatDilimi(k = konum()) { return k.tip === 'gps' ? undefined : 'Europe/Istanbul'; }
function saatYaz(d, k) { return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: saatDilimi(k) }); }
function veriAnahtari(k = konum()) { return k.tip === 'il' ? 'dv.' + k.plaka : k.tip === 'ilce' ? 'dvi.' + k.plaka + '.' + k.ilce : null; }
function diyanetVeri(k = konum()) { const a = veriAnahtari(k); return a ? oku(a, null) : null; }
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
// Kerahat vakitleri (yaklaşık): güneş doğduktan sonra, öğleden önce (istiva) ve akşamdan önce (isfirar) 45'er dakika
const KERAHAT_DK = 45;
function kerahatler(tarih) {
  const v = gunVakitleri(tarih).v, dk = KERAHAT_DK * 60e3;
  return [
    { ad: 'Güneş doğuşu', bas: v[1], bit: new Date(v[1].getTime() + dk) },
    { ad: 'Öğle öncesi (istiva)', bas: new Date(v[2].getTime() - dk), bit: v[2] },
    { ad: 'Akşam öncesi (isfirar)', bas: new Date(v[4].getTime() - dk), bit: v[4] },
  ];
}
function kerahatDurum(simdi = new Date()) {
  const yarin = new Date(simdi); yarin.setDate(yarin.getDate() + 1);
  const l = [...kerahatler(simdi), ...kerahatler(yarin)];
  const icinde = l.find(k => simdi >= k.bas && simdi < k.bit);
  if (icinde) return { icinde: true, k: icinde, kalan: icinde.bit - simdi };
  const sonraki = l.find(k => k.bas > simdi);
  return { icinde: false, k: sonraki, kalan: sonraki.bas - simdi };
}
// Önceki ve sonraki vakit (ilerleme çubuğu için)
function vakitAraligi(simdi = new Date()) {
  const dun = new Date(simdi); dun.setDate(dun.getDate() - 1);
  const yarin = new Date(simdi); yarin.setDate(yarin.getDate() + 1);
  const l = [gunVakitleri(dun).v[5], ...gunVakitleri(simdi).v, gunVakitleri(yarin).v[0]];
  const j = l.findIndex(t => t > simdi), onceki = l[j - 1], t = l[j];
  return { i: (j - 1) % 6, t, onceki, oran: Math.min(1, Math.max(0, (simdi - onceki) / (t - onceki))) };
}
function selam(d = new Date()) { const h = d.getHours(); return h < 5 ? 'Hayırlı geceler' : h < 11 ? 'Hayırlı sabahlar' : h < 17 ? 'Hayırlı günler' : h < 22 ? 'Hayırlı akşamlar' : 'Hayırlı geceler'; }
function kalan(ms) { const s = Math.max(0, Math.floor(ms / 1000)); return [Math.floor(s / 3600), Math.floor(s % 3600 / 60), s % 60].map(x => String(x).padStart(2, '0')).join(':'); }
const HICRI_AYLAR = ['Muharrem', 'Safer', 'Rebîülevvel', 'Rebîülâhir', 'Cemâziyelevvel', 'Cemâziyelâhir', 'Recep', 'Şâban', 'Ramazan', 'Şevval', 'Zilkade', 'Zilhicce'];
// İlçe seçilince: AlAdhan'dan o ilçenin koordinatına göre bu yıl + gelecek yıl (Diyanet yöntemi, Diyanet hicri takvimi)
async function ilceVerisi(k) {
  const y = new Date().getFullYear(), alt = ymd(new Date(Date.now() - 7 * 864e5));
  const out = { il: konumAdi(k), kaynak: 'AlAdhan · Diyanet hesaplama yöntemi', gunler: {}, hicri: {}, hicriNo: {} };
  for (const yy of [y, y + 1]) {
    let g;
    try {
      const q = new URLSearchParams({ latitude: k.lat, longitude: k.lng, method: 13, calendarMethod: 'DIYANET', timezonestring: 'Europe/Istanbul', annual: 'true' });
      const r = await fetch(`https://api.aladhan.com/v1/calendar/${yy}?${q}`); if (!r.ok) throw new Error(r.status);
      const j = await r.json(); if (j.code !== 200) throw new Error(j.code);
      g = Array.isArray(j.data) ? j.data : Object.values(j.data).flat();
    } catch (e) { if (yy === y) throw e; continue; }
    for (const d of g) {
      const [dd, mm, yyyy] = d.date.gregorian.date.split('-'), t = `${yyyy}-${mm}-${dd}`; if (t < alt) continue;
      const tm = d.timings, h = d.date.hijri;
      out.gunler[t] = [tm.Fajr, tm.Sunrise, tm.Dhuhr, tm.Asr, tm.Maghrib, tm.Isha].map(x => String(x).trim().slice(0, 5));
      out.hicriNo[t] = [+h.day, +h.month.number, +h.year]; out.hicri[t] = `${+h.day} ${HICRI_AYLAR[h.month.number - 1]} ${h.year}`;
    }
  }
  return Object.keys(out.gunler).length ? out : null;
}
async function diyanetGuncelle(zorla) {
  const k = konum(), an = veriAnahtari(k); if (!an) return false;
  const zk = k.tip === 'il' ? 'dvZaman.' + k.plaka : an + '.z', son = oku(zk, 0), dv = diyanetVeri(k);
  const bugunVar = dv && dv.gunler && dv.gunler[ymd(new Date())] && (k.tip === 'il' || dv.gunler[ymd(new Date(Date.now() + 40 * 864e5))]);
  if (!zorla && bugunVar && Date.now() - son < (k.tip === 'il' ? 12 : 24 * 20) * 3600e3) return false;
  try {
    let j;
    if (k.tip === 'il') { const r = await fetch(VAKIT_URL + k.plaka + '.json', { cache: 'no-store' }); if (!r.ok) return false; j = await r.json(); }
    else j = await ilceVerisi(k);
    if (!j || !j.gunler) return false;
    yaz(an, j); yaz(zk, Date.now()); return true;
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
    const bekleyen = await LN.getPending(); const eski = (bekleyen.notifications || []).filter(n => n.id >= 1000 && n.id < 4000);
    if (eski.length) await LN.cancel({ notifications: eski.map(n => ({ id: n.id })) });
    let izin = false; try { izin = (await LN.checkPermissions()).display === 'granted'; } catch (e) {}
    if (!izin) return;
    await kanallariKur(LN);
    const a = bildirimAyar(), simdi = new Date(), ad = konumAdi(), genel = genelKanal(), diger = [];
    // Cuma gecesi: perşembe akşam ezanından 20 dakika sonra
    if (oku('cumaBildirim', true)) for (let g = 0, n = 0; g < 15 && n < 2; g++) {
      const gun = new Date(simdi); gun.setDate(gun.getDate() + g); if (gun.getDay() !== 4) continue;
      const at = new Date(gunVakitleri(gun).v[4].getTime() + 20 * 60e3); if (at <= simdi) continue;
      diger.push({ id: 3100 + n++, title: 'Bu gece Cuma gecesi 🌙', body: 'Yâsîn, Tebâreke, Amme ve Cuma sûrelerini birlikte okuyalım. Okuyamıyorsan uygulamadan dinleyebilirsin.', schedule: { at, allowWhileIdle: true }, extra: { git: 'cuma' }, ...genel });
    }
    // Kandil ve bayramlar için o günün sabahı 10:00'da hatırlatma
    yaklasanGunler(7).filter(x => x.tur !== 'gun' || /Ramazan Başlangıcı|Aşure|Hicrî/.test(x.ad)).slice(0, 5).forEach((x, i) => {
      const [y, mo, d] = x.tarih.split('-').map(Number), at = new Date(y, mo - 1, d, 10, 0); if (at <= simdi) return;
      diger.push({ id: 2000 + i, title: x.ad, body: x.tur === 'kandil' ? `Bu akşam ${x.ad}. Kandiliniz mübarek olsun.` : `Bugün ${x.ad}.`, schedule: { at, allowWhileIdle: true }, ...genel });
    });
    // Hatim halkası, ölümü hatırla ve "Bugün Allah için ne yaptın?" (ek2.js)
    diger.push(...ekBildirimler(simdi));
    // Günün hadisi: öğle ezanından 30 dakika önce (ana sayfadaki hadisle aynı)
    if (oku('hadisBildirim', true)) for (let g = 0; g < 5; g++) {
      const gun = new Date(simdi); gun.setDate(gun.getDate() + g);
      const at = new Date(gunVakitleri(gun).v[2].getTime() - 30 * 60e3); if (at <= simdi) continue;
      const h = HADISLER[gunNo(gun) % HADISLER.length], metin = `${h[1]} (${h[2]})`;
      diger.push({ id: 3000 + g, title: 'Günün Hadisi', body: metin, largeBody: metin, schedule: { at, allowWhileIdle: true }, extra: { git: 'hadis' }, ...genel });
    }
    // Ezan bildirimleri: iOS en fazla 64 bekleyen bildirim tutar; kalan yer vakitlere (en az 24), seçilen sesle
    const sinir = Math.min(46, Math.max(24, 62 - diger.length)), ses = vakitSesi(), liste = [];
    for (let g = 0; a.acik && g < 8 && liste.length < sinir; g++) {
      const gun = new Date(simdi); gun.setDate(gun.getDate() + g);
      gunVakitleri(gun).v.forEach((t, i) => {
        if (!a.vakitler[i]) return;
        const at = new Date(t.getTime() - a.once * 60e3); if (at <= simdi || liste.length >= sinir) return;
        const vakitAd = VAKIT_ADLARI[i];
        liste.push({
          id: 1000 + g * 10 + i,
          title: a.once ? `${vakitAd} vaktine ${a.once} dakika` : (i === 1 ? 'Güneş doğdu' : `${vakitAd} vakti`),
          body: a.once ? `${ad} için ${vakitAd.toLocaleLowerCase('tr')} vakti ${saatYaz(t)}'de giriyor.` : (i === 1 ? `${ad}: Kerahat vakti, güneş doğuşu ${saatYaz(t)}.` : `${ad} için ${vakitAd.toLocaleLowerCase('tr')} vakti girdi (${saatYaz(t)}).`),
          schedule: { at, allowWhileIdle: true }, ...ses
        });
      });
    }
    liste.push(...diger);
    if (liste.length) await LN.schedule({ notifications: liste.slice(0, 62) });
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
    <div class="hero" id="vk">
      <div class="hero-ust"><span>📍 ${esc(konumAdi())}</span><span>${esc(hicri(bugun))}</span></div>
      <div class="hero-selam">${selam(bugun)}</div>
      <div class="hero-etiket"><span id="vk-ad"></span> vaktine kalan</div>
      <div class="geri-sayim" id="vk-sayac">--:--:--</div>
      <div class="ilerleme"><i id="vk-bar"></i></div>
      <div class="kerahat" id="vk-kerahat"></div>
      <div class="vakit-satir" id="vk-satir"></div>
      <div class="hero-alt">${esc(tarih)}</div>
    </div>
    <div class="hizli hizli4">
      <button id="h-devam"><span class="h-ikon">📖</span><b>Okumaya devam</b><span id="h-devam-alt">Kur'an-ı Kerîm</span></button>
      <button id="h-zikir"><span class="h-ikon">📿</span><b>Zikirmatik</b><span>Bugün: ${oku('gunluk.' + ymd(bugun), 0)} zikir</span></button>
      <button id="h-kible"><span class="h-ikon">🧭</span><b>Kıble</b><span>Pusula</span></button>
      <button id="h-imsakiye"><span class="h-ikon">🌙</span><b>İmsakiye</b><span>Ramazan</span></button>
    </div>
    <div id="cuma-kart"></div>
    <button class="kart iyilik-ana" id="iyilik"><div><b>Bugün Allah için ne yaptın?</b><span id="iyilik-alt">Sadaka, yetim, akraba… bir iyilik ekle</span></div><span class="iy-sayi" id="iyilik-sayi">＋</span></button>
    <div class="kategori-baslik">Öğren ve yaşa</div>
    <div class="kesfet">
      <button id="k-namaz"><span class="k-ikon">🕌</span><b>Namaz Kılınışı</b><small>Resimli anlatım</small></button>
      <button id="k-dua"><span class="k-ikon">🤲</span><b>Namaz Duaları</b><small>Dinle, ezberle</small></button>
      <button id="k-elifba"><span class="k-ikon k-ar">اب</span><b>Elif-Bâ</b><small>Sesli öğren</small></button>
      <button id="k-kaza"><span class="k-ikon">📋</span><b>Kaza Takvimi</b><small id="k-kaza-alt">Namazlarını işaretle</small></button>
      <button id="k-cami"><span class="k-ikon">📍</span><b>Yakın Camiler</b><small>Yol tarifi</small></button>
      <button id="k-cuma"><span class="k-ikon">🌙</span><b>Cuma Gecesi</b><small>Yâsîn ve sûreler</small></button>
    </div>
    <div class="kategori-baslik">Birlikte ve ailece</div>
    <div class="kesfet">
      <button id="k-hatim"><span class="k-ikon">📖</span><b>Hatim Halkası</b><small>Haftada bir cüz</small></button>
      <button id="k-kissa"><span class="k-ikon">🏡</span><b>Aile Sohbeti</b><small>Kıssadan hisse</small></button>
      <button id="k-mushaf"><span class="k-ikon k-ar">ق</span><b>Sayfa Sayfa</b><small>Mushaf düzeni</small></button>
      <button id="k-ilmihal"><span class="k-ikon">📗</span><b>İlmihal</b><small>Temel bilgiler</small></button>
      <button id="k-zekat"><span class="k-ikon">💰</span><b>Zekât</b><small>Hesapla</small></button>
      <button id="k-hadis"><span class="k-ikon k-ar">ﷺ</span><b>Hadisler</b><small>Seçme hadisler</small></button>
    </div>
    <div id="ozel-gun"></div>
    <div class="kart ayet-kart"><div class="sus">۞</div><h2>Günün Ayeti</h2><div id="ga">…</div></div>
    <div class="kart hadis-kart"><h2>Günün Hadisi</h2><div class="hadis-metin" id="gh"></div><button class="hadis-bil" id="gh-bil" hidden>🔔 Her gün öğleden önce bildir</button></div>
    <button class="kart olum-mini" id="olum"><div class="olum-ust">🌿 Ölümü Hatırla</div><p id="olum-soz"></p><div class="olum-alt">Kabir sualleri: öğren, ezberle, yaşa ›</div></button>
    <div class="kart dua-kart">
      <p class="soluk">Bu uygulama Allah rızası için hazırlandı.</p>
      <p>Hazırlayanlar, aileleri ve efradı için bir dua etmeniz yeter. 🤲</p>
    </div>`;
  const vk = () => {
    const simdi = new Date(), s = vakitAraligi(simdi), v = gunVakitleri(simdi).v, kd = kerahatDurum(simdi);
    const simdiki = siradakiVakit(simdi).onceki;
    $('#vk-ad').textContent = VAKIT_ADLARI[s.i]; $('#vk-sayac').textContent = kalan(s.t - simdi);
    $('#vk-bar').style.width = (s.oran * 100).toFixed(1) + '%';
    const kk = $('#vk-kerahat'); kk.classList.toggle('aktif', kd.icinde);
    kk.innerHTML = kd.icinde ? `⚠️ Kerahat vakti · bitimine <b>${kalan(kd.kalan)}</b>` : `Kerahat vaktine <b>${kalan(kd.kalan)}</b> <span>(${saatYaz(kd.k.bas)})</span>`;
    $('#vk-satir').innerHTML = v.map((t, i) => `<div class="${i === simdiki ? 'simdi' : ''}"><b>${saatYaz(t)}</b>${VAKIT_ADLARI[i]}</div>`).join('');
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
  $('#h-kible').onclick = () => sayfa(sKible, 'Kıble');
  $('#h-imsakiye').onclick = () => sayfa(sImsakiye, 'Ramazan İmsakiyesi');
  $('#k-namaz').onclick = () => sayfa(sNamazKilinis, 'Namaz Nasıl Kılınır');
  $('#k-dua').onclick = () => sayfa(sDualar, 'Namaz Duaları');
  $('#k-elifba').onclick = () => sayfa(sElifba, 'Elif-Bâ');
  $('#k-kaza').onclick = () => sayfa(sKaza, 'Kaza Takvimi');
  $('#k-cami').onclick = () => sayfa(sCamiler, 'Yakındaki Camiler');
  $('#k-cuma').onclick = () => sayfa(sCumaGecesi, 'Cuma Gecesi');
  $('#olum').onclick = () => sayfa(sKabir, 'Ölümü Hatırla');
  $('#iyilik').onclick = () => sayfa(sIyilik, 'İyilik Defteri');
  $('#k-hatim').onclick = () => sayfa(sHatimler, 'Hatim Halkası');
  $('#k-kissa').onclick = () => sayfa(sKissalar, 'Aile Sohbeti');
  $('#k-mushaf').onclick = () => sayfa(mm => sMushaf(mm), 'Kur\'an');
  $('#k-ilmihal').onclick = () => sayfa(sIlmihal, 'İlmihal');
  $('#k-zekat').onclick = () => sayfa(sZekat, 'Zekât Hesapla');
  $('#k-hadis').onclick = () => sayfa(sHadisler, 'Hadis-i Şerifler');
  const iyb = iyilikGunu(ymd(bugun)).s;
  if (iyb.length) { $('#iyilik-sayi').textContent = iyb.length; $('#iyilik-alt').textContent = `Bugün ${iyb.length} iyilik yazdın. Allah kabul etsin 🤍`; $('#iyilik').classList.add('dolu'); }
  const kz = kazaVeri(); if (kz) { const [kl] = kz.gun[ymd(bugun)] || [0]; $('#k-kaza-alt').textContent = `Bugün ${[0, 1, 2, 3, 4, 5].filter(v => kl >> v & 1).length}/6 kılındı`; }
  const [os, ok_] = OLUM_HATIRLA[gn % OLUM_HATIRLA.length]; $('#olum-soz').innerHTML = `“${esc(os)}” <span class="kaynak">${esc(ok_)}</span>`;
  // Cuma gecesi kartı (perşembe ve cuma)
  const cg = cumaGecesiMi(bugun);
  if (cg) {
    const okunan = (oku('cumaOkunan.' + haftaAnahtari(bugun), []) || []).length;
    $('#cuma-kart').innerHTML = `<button class="kart cuma-ana" id="cg"><div><b>${cg === 'cuma' ? 'Hayırlı Cumalar 🌙' : cg === 'gece' ? 'Bu gece Cuma gecesi 🌙' : 'Bu akşam Cuma gecesi 🌙'}</b>
      <span>Yâsîn, Tebâreke, Amme ve Cuma sûrelerini birlikte okuyalım · ${okunan}/4</span></div><span class="cg-ok">Oku · Dinle ›</span></button>`;
    $('#cg').onclick = () => sayfa(sCumaGecesi, 'Cuma Gecesi');
  }
  const h = HADISLER[gn % HADISLER.length];
  $('#gh').innerHTML = `${esc(h[1])}<div class="kaynak">${esc(h[2])}</div>`;
  // Hadis bildirimi: izin yoksa küçük bir davet göster
  const LNb = eklenti('LocalNotifications');
  if (NATIVE && LNb && oku('hadisBildirim', true)) LNb.checkPermissions().then(p => { const b = $('#gh-bil'); if (b && p.display !== 'granted') b.hidden = false; }).catch(() => {});
  $('#gh-bil').onclick = async () => { if (await bildirimIzni()) { yaz('hadisBildirim', true); await bildirimPlanla(); $('#gh-bil').hidden = true; toast('Her gün öğle ezanından 30 dakika önce günün hadisi gelecek'); } else toast('Bildirim izni verilmedi. Telefon ayarlarından açabilirsiniz.'); };
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
    ust += `<button class="kart mushaf-gir" id="mushaf"><span class="ar">ق</span><span><b>Sayfa sayfa oku</b><small>Mushaf düzeni, 604 sayfa${oku('sonSayfa', 0) ? ` · kaldığın sayfa ${oku('sonSayfa', 1)}` : ''}</small></span><span class="soluk">›</span></button>`;
    if (isr.length) ust += `<button class="btn tam" id="isr" style="margin-bottom:12px">★ Yer imleri (${isr.length})</button>`;
    $('#ust-kartlar').innerHTML = ust;
    if (son) $('#devam').onclick = () => sayfa(mm => sOku(mm, son.s, son.a), K[son.s - 1].ad);
    $('#mushaf').onclick = () => sayfa(mm => sMushaf(mm), 'Kur\'an');
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
function sOku(m, n, hedefAyet, o = {}) {
  kuran().then(K => {
    const s = K[n - 1]; let gor = oku('gorunum', { ar: true, tr: true });
    // Sesli dinleme (hafız kıraati). Cuma gecesi listesinden gelindiyse bitince işaretlenir, istenirse sıradakine geçilir.
    const calar = kuranCalar(m, n, s.v.length, { bitti: () => {
      if (!o.cuma) { toast(`${s.ad} Sûresi tamamlandı`); return; }
      cumaOkundu(n); const j = CUMA_SURELERI.findIndex(x => x[0] === n), sonraki = CUMA_SURELERI[j + 1];
      if (o.zincir && sonraki) { toast(`Sıradaki: ${sonraki[1]}`); yigin.pop(); sayfa(mm => sOku(mm, sonraki[0], 1, o), K[sonraki[0] - 1].ad); }
      else toast(`${s.ad} Sûresi tamamlandı. Allah kabul etsin.`, 3000);
    } });
    $('#baslik').textContent = `${n}. ${s.ad}`;
    const isr = () => oku('isaretler', []);
    const isaretli = a => isr().some(x => x[0] === n && x[1] === a);
    const ayetHtml = (v, i) => `<div class="ayet" id="a${i + 1}" data-a="${i + 1}">
        <div class="ayet-ust"><span class="no">${i + 1}</span><span class="bosluk"></span><button data-oyna="${i + 1}" aria-label="Buradan dinle">▶</button><button data-isr="${i + 1}" class="${isaretli(i + 1) ? 'isaretli' : ''}" aria-label="Yer imi">${isaretli(i + 1) ? '★' : '☆'}</button></div>
        ${gor.ar ? `<div class="ar">${esc(v[0])}</div>` : ''}${gor.tr ? `<div class="meal">${esc(v[1])}</div>` : ''}</div>`;
    const yenile = () => {
      m.innerHTML = `<div class="okuyucu-ayar">
          <button class="cip ${gor.ar ? 'acik' : ''}" id="g-ar">Arapça</button><button class="cip ${gor.tr ? 'acik' : ''}" id="g-tr">Meal</button>
          <button class="cip" id="b-k">A−</button><button class="cip" id="b-b">A+</button><button class="cip" id="g-sayfa">Sayfa</button><button class="cip dinle-cip" id="g-dinle">▶ Dinle</button></div>
        ${n !== 1 && n !== 9 && gor.ar ? '<div class="besmele">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ</div>' : ''}
        ${s.v.map(ayetHtml).join('')}
        <div class="sure-gecis">${n > 1 ? `<button id="onceki">‹ ${esc(K[n - 2].ad)}</button>` : '<span></span>'}${n < 114 ? `<button id="sonraki">${esc(K[n].ad)} ›</button>` : ''}</div>
        ${o.cuma ? `<button class="btn ana tam" id="cuma-ok" style="margin-top:12px">✓ ${esc(s.ad)} Sûresini okudum</button>` : ''}
        <p class="kaynak" style="text-align:center">Meal: Diyanet İşleri Başkanlığı · Metin: Tanzil.net · Ses: EveryAyah.com</p>`;
      $('#g-dinle').onclick = () => calar.basla(enUstAyet());
      $('#g-sayfa').onclick = () => sayfa(mm => sMushaf(mm, ayetSayfasi(n, enUstAyet())), 'Kur\'an');
      if ($('#cuma-ok')) $('#cuma-ok').onclick = () => { cumaOkundu(n); titres('HEAVY'); toast('Allah kabul etsin 🤲'); geri(); };
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
      const p = e.target.closest('button[data-oyna]'); if (p) { calar.basla(+p.dataset.oyna); return; }
      const b = e.target.closest('button[data-isr]'); if (!b) return;
      const a = +b.dataset.isr; let l = isr();
      if (l.some(x => x[0] === n && x[1] === a)) { l = l.filter(x => !(x[0] === n && x[1] === a)); b.textContent = '☆'; b.classList.remove('isaretli'); toast('Yer imi kaldırıldı'); }
      else { l.unshift([n, a]); b.textContent = '★'; b.classList.add('isaretli'); toast('Yer imlerine eklendi'); }
      yaz('isaretler', l.slice(0, 200)); titres();
    };
    yenile();
    if (hedefAyet > 1) { const el = $('#a' + hedefAyet, m); if (el) { m.scrollTop = el.offsetTop - m.offsetTop - 8; el.classList.add('vurgulu'); setTimeout(() => el.classList.remove('vurgulu'), 1800); } }
    yaz('sonOkunan', { s: n, a: hedefAyet || 1 });
    if (o.dinle) calar.basla(1);
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
      <div class="kart"><h2>Kerahat vakitleri (yaklaşık)</h2>${kerahatler(bugun).map(x => `<div class="ayar-satir" style="margin:4px 0"><span>${x.ad}</span><b>${saatYaz(x.bas)} – ${saatYaz(x.bit)}</b></div>`).join('')}<p class="soluk" style="margin:8px 0 0">Bu vakitlerde namaz kılmak mekruhtur. Süreler yaklaşık ${KERAHAT_DK} dakika olarak gösterilir.</p></div>
      <p class="soluk" style="margin:-4px 4px 12px">${gv.kaynak !== 'Hesaplama' ? 'Diyanet hesaplama yöntemi · AlAdhan' : 'İnternetsiz hesaplandı (Diyanet yöntemi). İnternete bağlanınca güncel veri yüklenir.'}</p>
      <div class="kart"><h2>Konum</h2>
        <select class="sec" id="il"><option value="" ${k.tip === 'gps' ? 'selected' : ''}>Konumum (GPS)</option>${ILLER.map((x, i) => `<option value="${i + 1}" ${k.plaka === i + 1 ? 'selected' : ''}>${esc(x[0])}</option>`).join('')}</select>
        ${k.plaka ? `<select class="sec" id="ilce" style="margin-top:8px"><option value="">İl geneli (il merkezi vakti)</option>${ILCELER[k.plaka - 1].slice().sort((a, b) => a[0].localeCompare(b[0], 'tr')).map(x => `<option value="${esc(x[0])}" ${k.tip === 'ilce' && k.ilce === x[0] ? 'selected' : ''}>${esc(x[0])}</option>`).join('')}</select>
        <p class="soluk" style="margin:6px 2px 0">Geniş illerde vakitler ilçeden ilçeye birkaç dakika değişir; ilçenizi seçin.</p>` : ''}
        <button class="btn tam" id="gps">📍 Konumumu bul</button></div>
      <div class="kart"><h2>Ezan bildirimi</h2>
        <div class="ayar-satir"><span>Vakit girince haber ver</span><button class="anahtar ${ba.acik ? 'acik' : ''}" id="b-ac"></button></div>
        <div class="ayar-satir" style="margin-top:10px"><span>Bildirim sesi</span><span class="hatirlat-sag"><select id="b-ses" class="cip">${Object.entries(BILDIRIM_SESLERI).map(([k, v]) => `<option value="${k}" ${ezanSesi() === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select><button class="cip" id="b-dinle" aria-label="Sesi dinle">▶</button></span></div>
        <div class="ayar-satir" style="margin-top:10px"><span>Ne zaman?</span><select id="b-once" class="cip">${[0, 5, 10, 15, 30, 45].map(x => `<option value="${x}" ${ba.once === x ? 'selected' : ''}>${x ? x + ' dk önce' : 'Tam vaktinde'}</option>`).join('')}</select></div>
        <p class="soluk" style="margin:10px 0 0">Hangi vakitler için bildirim geleceğini yukarıdaki 🔔 simgeleriyle seçebilirsiniz.</p>
        ${PLATFORM === 'android' ? '<button class="btn tam" id="tam-alarm">Bildirimler gecikiyorsa: tam zamanlı alarm izni</button>' : ''}</div>
      <div class="kart"><h2>7 günlük vakitler</h2><table class="hafta"><tr><th></th>${VAKIT_ADLARI.map(v => `<th>${v}</th>`).join('')}</tr>
        ${hafta.map(([d, v]) => `<tr><th>${d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</th>${v.map(t => `<td>${saatYaz(t)}</td>`).join('')}</tr>`).join('')}</table></div>
      <button class="btn tam" id="imsakiye">🌙 Ramazan imsakiyesi</button>
      <button class="btn tam" id="dinigun">📅 Dini günler ve kandiller</button>
      <button class="btn tam" id="kible">🧭 Kıble yönü</button>
      <button class="btn tam" id="camiler">📍 Yakındaki camiler</button>`;
    const say = () => { const x = siradakiVakit(); const el = $('#vs'); if (el) el.textContent = kalan(x.t - new Date()); };
    say(); const z = setInterval(say, 1000); temizlik.push(() => clearInterval(z));
    const yenile = async () => { ciz2(); const ok = await diyanetGuncelle(true); if (yigin[yigin.length - 1].fn !== sVakitler) return; if (ok) ciz2(); else if (konum().tip === 'ilce' && !diyanetVeri()) toast('İlçe vakitleri indirilemedi; internetsiz hesaplanıyor.'); bildirimPlanla(); };
    $('#il').onchange = e => { if (!e.target.value) { $('#gps').click(); return; } yaz('konum', { tip: 'il', plaka: +e.target.value }); yenile(); };
    if ($('#ilce')) $('#ilce').onchange = e => { const p = konum().plaka, ad = e.target.value; if (!ad) yaz('konum', { tip: 'il', plaka: p }); else { const x = ILCELER[p - 1].find(z => z[0] === ad); yaz('konum', { tip: 'ilce', plaka: p, ilce: ad, lat: x[1], lng: x[2] }); } yenile(); };
    $('#gps').onclick = () => konumBul(async () => { ciz2(); if (await diyanetGuncelle(true)) ciz2(); bildirimPlanla(); });
    $('#b-ac').onclick = async () => { const a = bildirimAyar(); if (!a.acik && !(await bildirimIzni())) { toast('Bildirim izni verilmedi. Telefon ayarlarından açabilirsiniz.'); return; }
      a.acik = !a.acik; yaz('bildirim', a); await bildirimPlanla(); toast(a.acik ? 'Ezan bildirimleri açıldı' : 'Ezan bildirimleri kapatıldı'); ciz2(); };
    $('#b-ses').onchange = e => { yaz('ezanSesi', e.target.value); bildirimPlanla(); sesOnizle(e.target.value); };
    $('#b-dinle').onclick = () => sesOnizle(ezanSesi());
    $('#b-once').onchange = e => { const a = bildirimAyar(); a.once = +e.target.value; yaz('bildirim', a); bildirimPlanla(); };
    m.querySelectorAll('[data-z]').forEach(b => b.onclick = async () => {
      const a = bildirimAyar(); if (!a.acik) { if (!(await bildirimIzni())) { toast('Bildirim izni verilmedi'); return; } a.acik = true; a.vakitler = [false, false, false, false, false, false]; }
      const i = +b.dataset.z; a.vakitler[i] = !a.vakitler[i]; yaz('bildirim', a); bildirimPlanla(); toast(`${VAKIT_ADLARI[i]} bildirimi ${a.vakitler[i] ? 'açık' : 'kapalı'}`); ciz2(); });
    const ta = $('#tam-alarm'); if (ta) ta.onclick = async () => { const LN = eklenti('LocalNotifications'); try { await LN.changeExactNotificationSetting(); } catch (e) { toast('Bu cihazda gerekmiyor'); } };
    $('#kible').onclick = () => sayfa(sKible, 'Kıble');
    $('#camiler').onclick = () => sayfa(sCamiler, 'Yakındaki Camiler');
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
    // En yakın ilçe (Türkiye içindeyse ilçe vakitleri kullanılır)
    let en = null, ed = 1e9; ILCELER.forEach((l, p) => l.forEach(x => { const d = mesafe(lat, lng, x[1], x[2]); if (d < ed) { ed = d; en = [p + 1, x]; } }));
    if (ed < 35) { yaz('konum', { tip: 'ilce', plaka: en[0], ilce: en[1][0], lat: en[1][1], lng: en[1][2] }); toast('Konum: ' + konumAdi()); }
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
  m.innerHTML = `<div class="kategori-baslik" style="margin-top:4px">Öğren</div><div class="liste">
      ${satir('d-namaz', '🕌', 'Namaz Nasıl Kılınır', 'Resimli, adım adım · abdest')}
      ${satir('d-dua', '🤲', 'Namaz Duaları ve Sûreler', 'Dinle, ezberle')}
      ${satir('d-elifba', 'ا', 'Elif-Bâ', 'Harfler ve harekeler, sesli')}
      ${satir('d-kogren', '📖', 'Kur\'an Okumayı Öğren', 'Hafızı dinle, tekrar et')}
      ${satir('d-kabir', '🌿', 'Ölümü Hatırla', 'Kabir sualleri')}
      ${satir('d-ilmihal', '📗', 'İlmihal', 'İman, abdest, namaz, oruç, zekât, hac, kurban')}
      ${satir('d-kissa', '🏡', 'Kıssadan Hisse · Aile Sohbeti', `${KISSALAR.length} hikâye ve hisseleri`)}
    </div>
    <div class="kategori-baslik">İbadet</div><div class="liste">
      ${satir('d-kaza', '📋', 'Kaza Takvimi', 'Kılınan ve kaza namazları')}
      ${satir('d-cuma', '🌙', 'Cuma Gecesi', 'Yâsîn, Tebâreke, Amme, Cuma')}
      ${satir('d-cami', '📍', 'Yakındaki Camiler', 'Haritada yol tarifi')}
      ${satir('d-iyilik', '🤍', 'Bugün Allah İçin Ne Yaptın?', 'İyilik defteri ve yıllık takvim')}
      ${satir('d-hatim', '📖', 'Hatim Halkası', 'Birlikte haftada bir hatim')}
      ${satir('d-mushaf', 'ق', 'Sayfa Sayfa Kur\'an', 'Mushaf düzeninde 604 sayfa')}
      ${satir('d-zekat', '💰', 'Zekât Hesapla', 'Nisap ve zekât miktarı')}
    </div>
    <div class="liste">
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
    <div class="kategori-baslik">Bizi takip edin · İslam Penceresi</div>
    ${sosyalListe()}
    <div class="kart dua-kart"><h2>Destek Ol</h2>
      <p>Uygulama tamamen ücretsizdir ve kendiliğinden reklam göstermez.</p>
      <p class="soluk">Sunucu ve mağaza masraflarına katkı olsun isterseniz kısa bir reklam izleyebilirsiniz. Reklam yalnızca siz bu butona bastığınızda açılır.</p>
      <button class="btn ana tam" id="destek">Reklam izleyerek destek ol</button></div>`;
  $('#d-namaz').onclick = () => sayfa(sOgren, 'Namaz ve Kur\'an Öğren');
  $('#d-dua').onclick = () => sayfa(sDualar, 'Namaz Duaları');
  $('#d-elifba').onclick = () => sayfa(sElifba, 'Elif-Bâ');
  $('#d-kogren').onclick = () => sayfa(sKuranOgren, 'Kur\'an Okumayı Öğren');
  $('#d-kabir').onclick = () => sayfa(sKabir, 'Ölümü Hatırla');
  $('#d-kaza').onclick = () => sayfa(sKaza, 'Kaza Takvimi');
  $('#d-ilmihal').onclick = () => sayfa(sIlmihal, 'İlmihal');
  $('#d-kissa').onclick = () => sayfa(sKissalar, 'Aile Sohbeti');
  $('#d-iyilik').onclick = () => sayfa(sIyilik, 'İyilik Defteri');
  $('#d-hatim').onclick = () => sayfa(sHatimler, 'Hatim Halkası');
  $('#d-mushaf').onclick = () => sayfa(mm => sMushaf(mm), 'Kur\'an');
  $('#d-zekat').onclick = () => sayfa(sZekat, 'Zekât Hesapla');
  $('#d-cuma').onclick = () => sayfa(sCumaGecesi, 'Cuma Gecesi');
  $('#d-cami').onclick = () => sayfa(sCamiler, 'Yakındaki Camiler');
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
      <div class="ar" style="text-align:center">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ</div><div class="meal" style="text-align:center">Rahmân ve Rahîm olan Allah'ın adıyla</div>
      <div class="zikir-alt" style="margin-top:10px"><button class="btn" id="kucult">A−</button><button class="btn" id="buyut">A+</button></div></div>
    <div class="kart"><h2>Bildirimler</h2>
      <div class="ayar-satir"><span>Günün hadisi<br><span class="soluk">Her gün öğle ezanından 30 dakika önce</span></span><button class="anahtar ${oku('hadisBildirim', true) ? 'acik' : ''}" data-bil="hadisBildirim"></button></div>
      <div class="ayar-satir" style="margin-top:12px"><span>Cuma gecesi hatırlatması<br><span class="soluk">Perşembe akşamı Yâsîn ve sûreler</span></span><button class="anahtar ${oku('cumaBildirim', true) ? 'acik' : ''}" data-bil="cumaBildirim"></button></div>
      <div style="margin-top:12px">${hatirlatmaSatiri('iyilikBildirim', 'Bugün Allah için ne yaptın?', 'Her akşam iyilik defteri', IYILIK_VARSAYILAN)}</div>
      <div style="margin-top:12px">${hatirlatmaSatiri('olumBildirim', 'Ölümü hatırla', '“Ey insanoğlu! Ölüm var.”', OLUM_VARSAYILAN)}</div>
      <p class="soluk" style="margin:10px 0 0">Ezan bildirimleri ve ezan sesi Vakitler sekmesinden ayarlanır.</p></div>
    <div class="kart"><h2>Kur'an sesi (hafız)</h2><select class="sec" id="a-kari">${Object.entries(KARILER).map(([k, v]) => `<option value="${k}" ${k === oku('kari', 'alafasy') ? 'selected' : ''}>${esc(v[0])}</option>`).join('')}</select>
      <p class="soluk" style="margin:8px 0 0">Kur'an dinlemek için internet gerekir.</p></div>
    <div class="kart"><h2>Zikir sayaçları</h2><button class="btn tam" id="zs-sifir">Tüm zikir sayaçlarını sıfırla</button></div>`;
  m.querySelectorAll('[data-bil]').forEach(b => b.onclick = async () => { const k = b.dataset.bil, a = !oku(k, true);
    if (a && !(await bildirimIzni())) { toast('Bildirim izni verilmedi. Telefon ayarlarından açabilirsiniz.'); return; }
    yaz(k, a); b.classList.toggle('acik', a); bildirimPlanla(); });
  hatirlatmaBagla(m);
  $('#a-kari').onchange = e => { yaz('kari', e.target.value); toast('Hafız seçildi'); };
  m.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { yaz('tema', b.dataset.t); temaUygula(); m.querySelectorAll('[data-t]').forEach(x => x.classList.toggle('acik', x === b)); });
  $('#kucult').onclick = () => { yaz('arBoyut', Math.max(20, oku('arBoyut', 28) - 2)); yaz('trBoyut', Math.max(13, oku('trBoyut', 16) - 1)); boyutUygula(); };
  $('#buyut').onclick = () => { yaz('arBoyut', Math.min(44, oku('arBoyut', 28) + 2)); yaz('trBoyut', Math.min(24, oku('trBoyut', 16) + 1)); boyutUygula(); };
  $('#zs-sifir').onclick = () => { ZIKIRLER.forEach((_, i) => yaz('zikirSayi.' + i, 0)); toast('Sayaçlar sıfırlandı'); };
}
function sHakkinda(m) {
  m.innerHTML = `<div class="kart dua-kart">
      <div class="ar" style="text-align:center">رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ</div>
      <p class="soluk">“Rabbimiz! Bizden kabul buyur. Şüphesiz sen hakkıyla işitensin, hakkıyla bilensin.” (Bakara, 127)</p>
      <p>Bu uygulama yalnızca Allah rızası için hazırlanmıştır. Hiçbir ücret istemiyoruz, üyelik yok. Verileriniz telefonunuzda kalır; yalnızca Hatim Halkası'na katılırsanız halkada görünecek adınız ve okuduğunuz cüzler halkadakilerle paylaşılır.</p>
      <p><b>Faydalandıysanız, uygulamayı hazırlayanlar, anne babaları, aileleri ve efradı için bir dua etmeniz bize yeter.</b></p>
      <p class="soluk">“Müslümanın, gıyabında kardeşine yaptığı dua kabul olunur. Başında görevli bir melek, ‘Âmin, aynısı sana da olsun’ der.” (Müslim, Zikir)</p></div>
    <div class="kategori-baslik">Bizi takip edin · İslam Penceresi</div>
    ${sosyalListe()}
    <div class="kart"><h2>Reklamlar hakkında</h2><p style="margin:0">Uygulama kendiliğinden hiçbir reklam göstermez. “Destek ol” bölümünden isteyen kullanıcılar, sunucu ve mağaza masraflarına katkı için kısa bir reklam izleyebilir. Reklamlar kişiselleştirilmez.</p></div>
    <div class="kart"><h2>Kaynaklar</h2><p style="margin:0" class="soluk">
      Kur'an-ı Kerîm Arapça metni ve Diyanet İşleri Başkanlığı meali: Tanzil.net (tanzil.net)<br>
      Namaz vakitleri, imsakiye ve hicri takvim: AlAdhan (aladhan.com), Diyanet İşleri Başkanlığı hesaplama yöntemi ve hicri takvimi; internet yokken adhan kütüphanesiyle (MIT) aynı yöntemle hesaplanır<br>
      Hadis tercümeleri: belirtilen hadis kaynaklarından seçilmiştir.<br>
      Arapça yazı tipi: Amiri Quran (SIL Open Font License)<br>
      Sayfa sayfa okumada sayfa ve cüz düzeni: Tanzil.net Quran Metadata (CC BY 3.0)<br>
      Kur'an tilaveti: EveryAyah.com · Kısa ezan bildirim sesi: “Beautiful adhan”, Adam-synagda (freesound.org, CC0)<br>
      İlmihal: Diyanet İşleri Başkanlığı İlmihali esas alınarak özetlenmiştir.</p></div>
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
  const LN = eklenti('LocalNotifications');
  if (LN && LN.addListener) LN.addListener('localNotificationActionPerformed', e => {
    const git = e && e.notification && e.notification.extra && e.notification.extra.git;
    if (git === 'cuma') { sekme('bugun'); sayfa(sCumaGecesi, 'Cuma Gecesi'); }
    else if (git === 'iyilik') { sekme('bugun'); sayfa(sIyilik, 'İyilik Defteri'); }
    else if (git === 'olum') { sekme('bugun'); sayfa(sKabir, 'Ölümü Hatırla'); }
    else if (git === 'hatim') { const kod = e.notification.extra.kod; sekme('bugun'); sayfa(sHatimler, 'Hatim Halkası'); if (kod) sayfa(mm => sHatim(mm, kod), 'Hatim Halkası'); }
    else if (git === 'hadis') { sekme('bugun'); setTimeout(() => { const el = $('#gh'); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 300); }
  });
}
// Diyanet verisini tazele, bildirimleri yeniden planla (iOS'ta en fazla 64 bekleyen bildirim olduğu için her açılışta yenilenir)
Promise.all([diyanetGuncelle(false), diniGunGuncelle()]).then(() => bildirimPlanla());
document.addEventListener('visibilitychange', () => { if (!document.hidden) { diyanetGuncelle(false).then(() => bildirimPlanla()); if (yigin.length === 1) ciz(); } });
