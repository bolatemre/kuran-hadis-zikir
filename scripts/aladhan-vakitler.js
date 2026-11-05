// AlAdhan (api.aladhan.com) servisinden 81 il için namaz vakitlerini ve hicri takvimi çeker.
// Yöntem: method=13 (Diyanet İşleri Başkanlığı hesaplama yöntemi), hicri takvim: calendarMethod=DIYANET.
// Çıktılar (GitHub Pages ile yayınlanır, uygulama buradan okur):
//   docs/vakitler/<plaka>.json   bu yıl + gelecek yıl: günlük 6 vakit ve hicri tarih
//   docs/vakitler/dini-gunler.json   kandiller, bayramlar, Ramazan, hicri yılbaşı, aşure...
// Şifre gerekmez. Her çalıştırmada yalnızca verisi eksik/eski iller yenilenir.
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, '..', 'docs', 'vakitler');
const ZORLA = process.env.ZORLA === '1';
const ILLER = [["Adana",37.00,35.32],["Adıyaman",37.76,38.28],["Afyonkarahisar",38.76,30.54],["Ağrı",39.72,43.05],["Amasya",40.65,35.83],["Ankara",39.93,32.86],["Antalya",36.89,30.71],["Artvin",41.18,41.82],["Aydın",37.85,27.85],["Balıkesir",39.65,27.88],["Bilecik",40.15,29.98],["Bingöl",38.88,40.50],["Bitlis",38.40,42.11],["Bolu",40.74,31.61],["Burdur",37.72,30.29],["Bursa",40.19,29.06],["Çanakkale",40.15,26.41],["Çankırı",40.60,33.61],["Çorum",40.55,34.95],["Denizli",37.78,29.09],["Diyarbakır",37.91,40.23],["Edirne",41.68,26.56],["Elazığ",38.68,39.22],["Erzincan",39.75,39.49],["Erzurum",39.90,41.27],["Eskişehir",39.78,30.52],["Gaziantep",37.07,37.38],["Giresun",40.91,38.39],["Gümüşhane",40.46,39.48],["Hakkâri",37.58,43.74],["Hatay",36.20,36.16],["Isparta",37.76,30.55],["Mersin",36.81,34.64],["İstanbul",41.01,28.98],["İzmir",38.42,27.14],["Kars",40.60,43.10],["Kastamonu",41.38,33.78],["Kayseri",38.72,35.49],["Kırklareli",41.73,27.22],["Kırşehir",39.15,34.16],["Kocaeli",40.77,29.92],["Konya",37.87,32.48],["Kütahya",39.42,29.98],["Malatya",38.35,38.31],["Manisa",38.61,27.43],["Kahramanmaraş",37.58,36.94],["Mardin",37.31,40.74],["Muğla",37.22,28.36],["Muş",38.74,41.49],["Nevşehir",38.62,34.71],["Niğde",37.97,34.68],["Ordu",40.98,37.88],["Rize",41.02,40.52],["Sakarya",40.78,30.40],["Samsun",41.29,36.33],["Siirt",37.93,41.94],["Sinop",42.03,35.15],["Sivas",39.75,37.02],["Tekirdağ",40.98,27.51],["Tokat",40.31,36.55],["Trabzon",41.00,39.72],["Tunceli",39.11,39.55],["Şanlıurfa",37.17,38.79],["Uşak",38.68,29.41],["Van",38.50,43.38],["Yozgat",39.82,34.81],["Zonguldak",41.45,31.79],["Aksaray",38.37,34.03],["Bayburt",40.26,40.23],["Karaman",37.18,33.22],["Kırıkkale",39.85,33.51],["Batman",37.89,41.13],["Şırnak",37.52,42.46],["Bartın",41.63,32.34],["Ardahan",41.11,42.70],["Iğdır",39.92,44.04],["Yalova",40.66,29.27],["Karabük",41.20,32.62],["Kilis",36.72,37.12],["Osmaniye",37.07,36.25],["Düzce",40.84,31.16]];
const HICRI_AYLAR = ['Muharrem', 'Safer', 'Rebîülevvel', 'Rebîülâhir', 'Cemâziyelevvel', 'Cemâziyelâhir', 'Recep', 'Şâban', 'Ramazan', 'Şevval', 'Zilkade', 'Zilhicce'];

const bekle = ms => new Promise(r => setTimeout(r, ms));
async function al(url, deneme = 4) {
  for (let i = 1; i <= deneme; i++) {
    try {
      const r = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'KuranHadisZikir/1.0 (github.com/bolatemre/kuran-hadis-zikir)' } });
      if (r.status === 429) { await bekle(5000 * i); continue; }
      const j = await r.json(); if (!r.ok || j.code !== 200) throw new Error(`${r.status} ${JSON.stringify(j).slice(0, 200)}`);
      return j.data;
    } catch (e) { if (i === deneme) throw e; await bekle(2000 * i); }
  }
}
const hm = s => String(s).trim().slice(0, 5);                         // "06:07 (+03)" -> "06:07"
const iso = s => { const [d, m, y] = s.split('-'); return `${y}-${m}-${d}`; }; // "05-11-2026" -> "2026-11-05"

// Bir ilin bir yıllık verisi -> { "2026-11-05": { v:[6 vakit], h:[gün, ay, yıl] } }
async function yil(lat, lng, y) {
  const q = new URLSearchParams({ latitude: lat, longitude: lng, method: 13, calendarMethod: 'DIYANET', timezonestring: 'Europe/Istanbul', annual: 'true' });
  const data = await al(`https://api.aladhan.com/v1/calendar/${y}?${q}`);
  const gunler = Array.isArray(data) ? data : Object.values(data).flat(); // yıllık yanıt aylara göre gruplu gelir
  const out = {};
  for (const g of gunler) {
    const t = g.timings, h = g.date.hijri;
    // Diyanet'te "imsak" vakti, hesaplamadaki Fajr (sabah) vaktidir
    out[iso(g.date.gregorian.date)] = { v: [t.Fajr, t.Sunrise, t.Dhuhr, t.Asr, t.Maghrib, t.Isha].map(hm), h: [+h.day, +h.month.number, +h.year] };
  }
  return out;
}

// Hicri tarihlerden dini günleri çıkarır (Diyanet takvimindeki adlarla)
function diniGunler(gunler) {
  const tarihler = Object.keys(gunler).sort(), bul = (d, m) => tarihler.filter(t => gunler[t].h[0] === d && gunler[t].h[1] === m);
  const once = t => { const d = new Date(t + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); };
  const liste = [];
  const ekle = (t, ad, tur) => { if (t && gunler[t]) liste.push({ tarih: t, ad, tur }); };
  for (const t of bul(1, 1)) ekle(t, `Hicrî Yılbaşı (${gunler[t].h[2]})`, 'gun');
  for (const t of bul(10, 1)) ekle(t, 'Aşure Günü', 'gun');
  for (const t of bul(12, 3)) ekle(once(t), 'Mevlid Kandili', 'kandil');
  for (const t of bul(1, 7)) {
    ekle(t, 'Üç Ayların Başlangıcı', 'gun');
    // Regaib: Recep'in ilk Cuma gecesi (perşembeyi cumaya bağlayan gece)
    let c = new Date(t + 'T12:00:00Z'); while (c.getUTCDay() !== 5) c.setUTCDate(c.getUTCDate() + 1);
    ekle(once(c.toISOString().slice(0, 10)), 'Regaib Kandili', 'kandil');
  }
  for (const t of bul(27, 7)) ekle(once(t), 'Miraç Kandili', 'kandil');
  for (const t of bul(15, 8)) ekle(once(t), 'Berat Kandili', 'kandil');
  for (const t of bul(1, 9)) { ekle(once(t), 'Ramazan\'ın ilk teravihi', 'gun'); ekle(t, 'Ramazan Başlangıcı', 'gun'); }
  for (const t of bul(27, 9)) ekle(once(t), 'Kadir Gecesi', 'kandil');
  for (const t of bul(1, 10)) { ekle(once(t), 'Ramazan Bayramı Arifesi', 'arife'); for (let i = 0; i < 3; i++) { const d = new Date(t + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + i); ekle(d.toISOString().slice(0, 10), `Ramazan Bayramı ${i + 1}. Gün`, 'bayram'); } }
  for (const t of bul(9, 12)) ekle(t, 'Kurban Bayramı Arifesi', 'arife');
  for (const t of bul(10, 12)) for (let i = 0; i < 4; i++) { const d = new Date(t + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + i); ekle(d.toISOString().slice(0, 10), `Kurban Bayramı ${i + 1}. Gün`, 'bayram'); }
  return liste.sort((a, b) => a.tarih.localeCompare(b.tarih));
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const simdi = new Date(), buYil = simdi.getUTCFullYear(), yillar = [buYil, buYil + 1];
  const bugun = simdi.toISOString().slice(0, 10), sonGun = `${buYil + 1}-12-31`;
  const geriSinir = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  let ok = 0, atla = 0, hata = 0, istanbul = null;
  for (let p = 1; p <= 81; p++) {
    const [il, lat, lng] = ILLER[p - 1], f = path.join(OUT, p + '.json');
    const eski = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
    // Gelecek yılın sonuna kadar veri varsa ve bu ay güncellendiyse atla
    if (!ZORLA && eski && eski.gunler && eski.gunler[sonGun] && String(eski.guncelleme || '').slice(0, 7) === bugun.slice(0, 7)) {
      atla++; if (p === 34) istanbul = eski; continue;
    }
    try {
      let tum = {};
      for (const y of yillar) { Object.assign(tum, await yil(lat, lng, y)); await bekle(400); }
      const tarihler = Object.keys(tum).filter(t => t >= geriSinir).sort();
      const json = { il, kaynak: 'AlAdhan · Diyanet hesaplama yöntemi', guncelleme: simdi.toISOString(), gunler: {}, hicri: {}, hicriNo: {} };
      for (const t of tarihler) {
        const { v, h } = tum[t];
        json.gunler[t] = v; json.hicri[t] = `${h[0]} ${HICRI_AYLAR[h[1] - 1]} ${h[2]}`; json.hicriNo[t] = h;
      }
      fs.writeFileSync(f, JSON.stringify(json));
      if (p === 34) istanbul = { ...json, _tum: tum };
      ok++; console.log(`${il}: ${tarihler.length} gün (${tarihler[0]} → ${tarihler[tarihler.length - 1]})`);
    } catch (e) { hata++; console.log(`::warning::${il}: ${e.message}`); }
  }
  // Dini günler İstanbul'un hicri takviminden (Diyanet takvimi tüm Türkiye için aynıdır)
  if (istanbul) {
    const g = {}; for (const [t, h] of Object.entries(istanbul.hicriNo)) g[t] = { h };
    const liste = diniGunler(g);
    fs.writeFileSync(path.join(OUT, 'dini-gunler.json'), JSON.stringify({ kaynak: 'AlAdhan · Diyanet hicri takvimi', guncelleme: simdi.toISOString(), gunler: liste }, null, 1));
    console.log(`Dini günler: ${liste.length} kayıt`); liste.slice(0, 40).forEach(x => console.log('  ', x.tarih, x.ad));
  }
  console.log(`Bitti: ${ok} il güncellendi, ${atla} il zaten güncel, ${hata} hata`);
  if (hata > 40) process.exit(1);
})().catch(e => { console.error(e.message || e); process.exit(1); });
