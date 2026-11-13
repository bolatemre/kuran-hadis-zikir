// Üç Nur — Yakındaki Camiler: hazır cami dosyaları (hızlı ve güvenilir), olmazsa canlı harita sorgusu.
// Hazır dosyalar ayda bir GitHub'da üretilir (scripts/camiler.js → docs/vakitler/camiler/); telefon yalnızca bulunduğu karonun dosyasını indirir.
(function () {
  const CAMI_URL = 'https://bolatemre.github.io/kuran-hadis-zikir/vakitler/camiler/', KARO = 5;
  const SUNUCULAR = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
  const getir = async (url, ms, secenek) => { const c = new AbortController(), z = setTimeout(() => c.abort(), ms); try { return await fetch(url, { ...(secenek || {}), signal: c.signal }); } finally { clearTimeout(z); } };
  const duzenle = (l, lat, lng, r) => l.map(x => ({ ...x, d: mesafe(lat, lng, x.lat, x.lng), y: yon(lat, lng, x.lat, x.lng) })).filter(x => x.d <= r / 1000).sort((a, b) => a.d - b.d);
  let bilgi = null;
  async function hazirdan(lat, lng, r) {
    if (!bilgi) { const b = await getir(CAMI_URL + 'bilgi.json', 7000); if (!b.ok) throw new Error('hazir-yok'); bilgi = await b.json(); }
    const k = bilgi.kutu; if (!k || lat < k.g || lat > k.k || lng < k.b || lng > k.d) throw new Error('kapsam-disi');
    const dlat = r / 111000, dlng = r / (111000 * Math.cos(lat * Math.PI / 180)), karolar = new Set();
    for (const a of [lat - dlat, lat, lat + dlat]) for (const b of [lng - dlng, lng, lng + dlng]) karolar.add(Math.floor(a * KARO) + '_' + Math.floor(b * KARO));
    const parcalar = await Promise.all([...karolar].map(async a => { const res = await getir(CAMI_URL + a + '.json', 9000); if (res.status === 404) return []; if (!res.ok) throw new Error('http'); return res.json(); }));
    return duzenle(parcalar.flat().map(c => ({ ad: c[0] || 'Cami', lat: c[1], lng: c[2] })), lat, lng, r);
  }
  function ilkBasarili(isler) { return new Promise((tamam, hata) => { let kalan = isler.length; isler.forEach(p => p.then(tamam, () => { if (--kalan === 0) hata(new Error('baglanti')); })); }); }
  async function canli(lat, lng, r) { // hazır dosya yoksa ya da Türkiye dışındaysa: harita sunucularının hepsine aynı anda sorulur, ilk cevap kullanılır
    const q = `[out:json][timeout:25];nwr["amenity"="place_of_worship"]["religion"="muslim"](around:${r},${lat},${lng});out center 120;`;
    return ilkBasarili(SUNUCULAR.map(async u => {
      const res = await getir(u, 30000, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      if (!res.ok) throw new Error('http'); const j = await res.json(); if (!j.elements) throw new Error('bos');
      return duzenle(j.elements.map(e => ({ ad: (e.tags && (e.tags['name:tr'] || e.tags.name)) || 'Cami', lat: e.lat || (e.center && e.center.lat), lng: e.lon || (e.center && e.center.lon) })).filter(x => x.lat), lat, lng, r);
    }));
  }
  camiAra = async function (lat, lng, r) {
    try { return await hazirdan(lat, lng, r); } catch (e) { return canli(lat, lng, r); }
  };
  window.camiKaynak = { hazirdan, canli };
})();
