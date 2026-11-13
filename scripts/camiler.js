// Türkiye ve çevresindeki camileri OpenStreetMap'ten (Overpass) toplar, 0,2 derecelik karolara bölüp docs/vakitler/camiler/ altına yazar.
// "Namaz vakitleri" iş akışının sonunda çalışır (scripts/aladhan-vakitler.js çağırır); veri 25 günden yeniyse atlanır.
// Uygulama "Yakındaki Camiler"de bu hazır dosyaları okur: canlı sorgu beklemez, hızlı ve güvenilir açılır.
// Veri © OpenStreetMap katkıcıları (ODbL).
const fs = require('fs'), path = require('path');
const HEDEF = path.join(__dirname, '..', 'docs', 'vakitler', 'camiler');
const SUNUCULAR = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
const KUTU = { g: 35.5, b: 25.5, k: 42.5, d: 45 }, ADIM = 1.5, KARO = 5; // karo: 1/5 derece
const bekle = ms => new Promise(r => setTimeout(r, ms));
async function sor(q) {
  let son;
  for (let deneme = 0; deneme < 8; deneme++) {
    const u = SUNUCULAR[deneme % SUNUCULAR.length], c = new AbortController(), z = setTimeout(() => c.abort(), 150000);
    try {
      const r = await fetch(u, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'UcNur-camiler/1.0 (github.com/bolatemre/kuran-hadis-zikir)' }, signal: c.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      if (j.remark && /error|timed out/i.test(j.remark)) throw new Error(j.remark);
      return j.elements || [];
    } catch (e) { son = e; console.log(`  tekrar (${deneme + 1}): ${u.split('/')[2]} → ${e.message}`); await bekle(4000 + deneme * 4000); }
    finally { clearTimeout(z); }
  }
  throw son;
}
(async () => {
  try { const b = JSON.parse(fs.readFileSync(path.join(HEDEF, 'bilgi.json'), 'utf8')); if (process.env.ZORLA !== '1' && Date.now() - new Date(b.t).getTime() < 25 * 864e5) { console.log('Cami verisi güncel (' + b.t + '), atlandı'); return; } } catch (e) {}
  const hepsi = new Map();
  for (let g = KUTU.g; g < KUTU.k; g += ADIM) for (let b = KUTU.b; b < KUTU.d; b += ADIM) {
    const k = Math.min(KUTU.k, g + ADIM), d = Math.min(KUTU.d, b + ADIM);
    const el = await sor(`[out:json][timeout:120];nwr["amenity"="place_of_worship"]["religion"="muslim"](${g},${b},${k},${d});out center;`);
    for (const e of el) {
      const lat = e.lat || (e.center && e.center.lat), lng = e.lon || (e.center && e.center.lon); if (!lat || !lng) continue;
      const ad = ((e.tags && (e.tags['name:tr'] || e.tags.name)) || '').trim().slice(0, 80);
      hepsi.set(e.type + e.id, [ad, Math.round(lat * 1e5) / 1e5, Math.round(lng * 1e5) / 1e5]);
    }
    console.log(`${g},${b} → ${el.length} (toplam ${hepsi.size})`);
    await bekle(1500);
  }
  if (hepsi.size < 15000) throw new Error('Beklenenden az cami geldi (' + hepsi.size + '); eski veri korunuyor');
  const karolar = new Map();
  for (const c of hepsi.values()) { const a = Math.floor(c[1] * KARO) + '_' + Math.floor(c[2] * KARO); if (!karolar.has(a)) karolar.set(a, []); karolar.get(a).push(c); }
  fs.rmSync(HEDEF, { recursive: true, force: true }); fs.mkdirSync(HEDEF, { recursive: true });
  for (const [a, l] of karolar) fs.writeFileSync(path.join(HEDEF, a + '.json'), JSON.stringify(l));
  fs.writeFileSync(path.join(HEDEF, 'bilgi.json'), JSON.stringify({ t: new Date().toISOString().slice(0, 10), n: hepsi.size, karo: karolar.size, kutu: KUTU }));
  console.log(`✅ ${hepsi.size} cami, ${karolar.size} karo yazıldı`);
})().catch(e => { console.error('::error::' + (e.message || e)); process.exit(1); });
