// Diyanet İşleri Başkanlığı "Awqat Salah" servisinden 81 ilin namaz vakitlerini çeker ve
// docs/vakitler/<plaka>.json olarak yazar (GitHub Pages ile yayınlanır, uygulama buradan okur).
// Kullanıcı adı/şifre GitHub Secrets'ta durur: DIYANET_EMAIL, DIYANET_PASSWORD. Uygulamanın içine asla konmaz.
// Servisin günlük istek sınırı olduğu için her çalıştırmada yalnızca verisi azalan iller yenilenir.
const fs = require('fs'), path = require('path');
const BASE = 'https://awqatsalah.diyanet.gov.tr';
const OUT = path.join(__dirname, '..', 'docs', 'vakitler');
const LIMIT = +(process.env.LIMIT || 30);          // bir çalıştırmada en fazla kaç il
const MIN_GUN = +(process.env.MIN_GUN || 20);      // ileriye dönük bu kadar günden az veri kaldıysa yenile
const ILLER = ["Adana","Adıyaman","Afyonkarahisar","Ağrı","Amasya","Ankara","Antalya","Artvin","Aydın","Balıkesir","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkâri","Hatay","Isparta","Mersin","İstanbul","İzmir","Kars","Kastamonu","Kayseri","Kırklareli","Kırşehir","Kocaeli","Konya","Kütahya","Malatya","Manisa","Kahramanmaraş","Mardin","Muğla","Muş","Nevşehir","Niğde","Ordu","Rize","Sakarya","Samsun","Siirt","Sinop","Sivas","Tekirdağ","Tokat","Trabzon","Tunceli","Şanlıurfa","Uşak","Van","Yozgat","Zonguldak","Aksaray","Bayburt","Karaman","Kırıkkale","Batman","Şırnak","Bartın","Ardahan","Iğdır","Yalova","Karabük","Kilis","Osmaniye","Düzce"];
// Diyanet'te farklı yazılan il/merkez adları
const ESANLAM = { 'hakkari': ['hakkari'], 'kahramanmaras': ['kahramanmaras', 'k.maras'], 'sanliurfa': ['sanliurfa', 'urfa'], 'afyonkarahisar': ['afyonkarahisar', 'afyon'], 'mersin': ['mersin', 'icel'], 'hatay': ['hatay', 'antakya'], 'kocaeli': ['kocaeli', 'izmit'], 'sakarya': ['sakarya', 'adapazari'] };
const norm = s => String(s || '').toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').replace(/[^a-z.]/g, '');

let token = null;
async function api(method, url, body) {
  const r = await fetch(BASE + url, { method, headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const txt = await r.text(); let j = null; try { j = JSON.parse(txt); } catch (e) {}
  if (!r.ok) { const e = new Error(`${method} ${url} -> ${r.status}: ${txt.slice(0, 300)}`); e.status = r.status; throw e; }
  return j && 'data' in j ? j.data : j;
}
const alan = (o, ...adlar) => { for (const a of adlar) if (o[a] != null) return o[a]; return null; };
const ymd = s => { // "05.11.2026" | "2026-11-05T00:00:00" -> "2026-11-05"
  let m = String(s).match(/^(\d{2})\.(\d{2})\.(\d{4})/); if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
};
const hm = s => String(s).slice(0, 5);

(async () => {
  const email = process.env.DIYANET_EMAIL, password = process.env.DIYANET_PASSWORD;
  if (!email || !password) { console.error('::error::DIYANET_EMAIL / DIYANET_PASSWORD secret eksik'); process.exit(1); }
  fs.mkdirSync(OUT, { recursive: true });
  const login = await api('POST', '/Auth/Login', { email, password });
  token = alan(login, 'accessToken', 'token'); if (!token) throw new Error('Giriş yanıtında token yok: ' + JSON.stringify(login).slice(0, 200));
  console.log('Diyanet girişi tamam');

  // 1) İl -> Diyanet şehir kimliği eşlemesi (bir kez bulunur, _yerler.json'da saklanır)
  const yerDosya = path.join(OUT, '_yerler.json');
  let yerler = fs.existsSync(yerDosya) ? JSON.parse(fs.readFileSync(yerDosya, 'utf8')) : {};
  if (Object.keys(yerler).length < 81) {
    const ulkeler = await api('GET', '/api/Place/Countries');
    const tr = ulkeler.find(u => ['turkiye', 'turkey'].includes(norm(alan(u, 'name'))) || ['turkiye', 'turkey'].includes(norm(alan(u, 'code'))));
    if (!tr) throw new Error('Türkiye bulunamadı. Örnek: ' + JSON.stringify(ulkeler.slice(0, 3)));
    const iller = await api('GET', '/api/Place/States/' + tr.id);
    console.log('Diyanet il sayısı:', iller.length, 'örnek:', JSON.stringify(iller[0]));
    for (let p = 1; p <= 81; p++) {
      if (yerler[p]) continue;
      const ad = norm(ILLER[p - 1]), adlar = ESANLAM[ad] || [ad];
      const st = iller.find(s => adlar.includes(norm(alan(s, 'name', 'code'))));
      if (!st) { console.log('İl eşleşmedi:', ILLER[p - 1]); continue; }
      const sehirler = await api('GET', '/api/Place/Cities/' + st.id);
      const c = sehirler.find(c => adlar.includes(norm(alan(c, 'name', 'code')))) || sehirler.find(c => norm(alan(c, 'name')) === 'merkez') || sehirler[0];
      yerler[p] = { il: ILLER[p - 1], stateId: st.id, cityId: c.id, ad: alan(c, 'name') };
      fs.writeFileSync(yerDosya, JSON.stringify(yerler, null, 1));
    }
  }

  // 2) Verisi azalan illeri yenile
  const bugun = new Date().toISOString().slice(0, 10);
  const ileri = p => { const f = path.join(OUT, p + '.json'); if (!fs.existsSync(f)) return 0; const g = Object.keys(JSON.parse(fs.readFileSync(f, 'utf8')).gunler || {}).filter(d => d >= bugun); return g.length; };
  const sira = Object.keys(yerler).map(Number).map(p => [p, ileri(p)]).filter(([, n]) => n < MIN_GUN).sort((a, b) => a[1] - b[1]).slice(0, LIMIT);
  console.log(`Yenilenecek il: ${sira.length}`);
  let ok = 0;
  for (const [p] of sira) {
    const y = yerler[p];
    let liste;
    try { liste = await api('GET', '/api/PrayerTime/Monthly/' + y.cityId); }
    catch (e) { console.log(`${y.il}: ${e.message}`); if (e.status === 429 || e.status === 403) { console.log('İstek sınırına ulaşıldı, kalanlar sonraki çalıştırmada.'); break; } continue; }
    if (ok === 0) console.log('Örnek gün:', JSON.stringify(liste[0]));
    const f = path.join(OUT, p + '.json');
    const eski = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : { gunler: {}, hicri: {} };
    for (const g of liste) {
      const d = ymd(alan(g, 'gregorianDateShort', 'gregorianDateShortIso8601', 'gregorianDate', 'date')); if (!d) continue;
      eski.gunler[d] = [alan(g, 'fajr', 'imsak'), alan(g, 'sunrise', 'gunes'), alan(g, 'dhuhr', 'ogle'), alan(g, 'asr', 'ikindi'), alan(g, 'maghrib', 'aksam'), alan(g, 'isha', 'yatsi')].map(hm);
      const h = alan(g, 'hijriDateLong'); if (h) eski.hicri[d] = h;
    }
    // 40 günden eski kayıtları at
    const sinir = new Date(Date.now() - 40 * 864e5).toISOString().slice(0, 10);
    for (const k of Object.keys(eski.gunler)) if (k < sinir) { delete eski.gunler[k]; delete eski.hicri[k]; }
    const sirali = o => Object.fromEntries(Object.entries(o).sort());
    fs.writeFileSync(f, JSON.stringify({ il: y.il, kaynak: 'Diyanet İşleri Başkanlığı', guncelleme: new Date().toISOString(), gunler: sirali(eski.gunler), hicri: sirali(eski.hicri) }));
    ok++; console.log(`${y.il}: ${liste.length} gün`);
    await new Promise(r => setTimeout(r, 1500));
  }
  console.log(`Bitti: ${ok} il güncellendi`);
})().catch(e => { console.error(e.message || e); process.exit(1); });
