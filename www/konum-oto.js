// Üç Nur — Konumu otomatik güncelle: uygulama açılınca / öne gelince konum izni zaten verilmişse
// sessizce konuma bakar; başka bir ilçeye (ya da yurt dışında 3 km'den uzağa) gidilmişse vakitleri,
// bildirimleri ve araç takımını kendiliğinden yeniler. Listeden elle il seçen kişide kapanır,
// "Konumumu bul" deyince açılır; Vakitler > Konum kartından da açılıp kapatılabilir.
(function () {
  const ARALIK = 15 * 60e3; // en sık 15 dakikada bir bak
  let son = 0, calisiyor = false;

  function acikMi() {
    const a = oku('otoKonum', null);
    if (a !== null) return a;
    const k = konum(); return k.tip === 'gps' || k.tip === 'ilce'; // GPS ile bulunmuş konumlarda varsayılan açık
  }
  // Telefonda yerel konum eklentisi: izin durumu güvenilir okunur, iPhone'da tekrar izin penceresi çıkmaz
  const G = () => (NATIVE ? eklenti('Geolocation') : null);
  async function izinVar() {
    const g = G();
    if (g && g.checkPermissions) try { const d = await g.checkPermissions(); return d.location === 'granted' || d.coarseLocation === 'granted'; } catch (e) {}
    if (!navigator.geolocation) return false;
    try { if (navigator.permissions && navigator.permissions.query) return (await navigator.permissions.query({ name: 'geolocation' })).state === 'granted'; } catch (e) {}
    return PLATFORM === 'android'; // izin durumu sorulamıyorsa iOS'ta pencere çıkmasın diye hiç denemeyiz
  }
  const AYAR = { timeout: 15000, maximumAge: 5 * 60e3, enableHighAccuracy: false };
  const konumAl = async () => {
    const g = G();
    if (g && g.getCurrentPosition) try { return await g.getCurrentPosition(AYAR); } catch (e) {}
    return new Promise((tamam, hata) => navigator.geolocation.getCurrentPosition(tamam, hata, AYAR));
  };

  async function kontrol(zorla) {
    if (calisiyor || !acikMi() || (!zorla && Date.now() - son < ARALIK)) return;
    if (!(await izinVar())) return;
    calisiyor = true; son = Date.now();
    try {
      const p = await konumAl(), lat = p.coords.latitude, lng = p.coords.longitude, k = konum();
      let en = null, ed = 1e9;
      ILCELER.forEach((l, i) => l.forEach(x => { const d = mesafe(lat, lng, x[1], x[2]); if (d < ed) { ed = d; en = [i + 1, x]; } }));
      let yeni = null;
      if (ed < 35) { if (!(k.tip === 'ilce' && k.plaka === en[0] && k.ilce === en[1][0])) yeni = { tip: 'ilce', plaka: en[0], ilce: en[1][0], lat: en[1][1], lng: en[1][2] }; }
      else if (k.tip !== 'gps' || mesafe(lat, lng, k.lat, k.lng) > 3) yeni = { tip: 'gps', lat, lng, ad: 'Konumum' };
      if (!yeni) return;
      yaz('konum', yeni);
      toast('Konum güncellendi: ' + konumAdi());
      try { await diyanetGuncelle(true); } catch (e) {}
      if (yigin.length === 1) ciz();
      try { await bildirimPlanla(); } catch (e) {}
      if (typeof widgetYakinda === 'function') widgetYakinda();
    } catch (e) { /* konum alınamadı: sessizce geç */ }
    finally { calisiyor = false; }
  }

  // Vakitler > Konum kartına anahtar
  function kartEkle() {
    const m = $('#icerik'), gps = m.querySelector('#gps'); if (!gps || m.querySelector('#oto-konum')) return;
    gps.insertAdjacentHTML('afterend', `<div class="ayar-satir" style="margin-top:12px"><span>Konumu otomatik güncelle<br><span class="soluk" style="font-size:.85em">Başka bir şehre gidince vakitler kendiliğinden değişir</span></span><button class="anahtar ${acikMi() ? 'acik' : ''}" id="oto-konum" aria-label="Konumu otomatik güncelle"></button></div>`);
    m.querySelector('#oto-konum').onclick = async e => {
      const ac = !acikMi(); yaz('otoKonum', ac); e.currentTarget.classList.toggle('acik', ac);
      if (ac) { toast('Konum otomatik güncellenecek'); if (await izinVar()) kontrol(true); else gps.click(); }
      else toast('Otomatik konum kapatıldı');
    };
    gps.addEventListener('click', () => yaz('otoKonum', true));
    const elle = () => yaz('otoKonum', false); // listeden elle seçen kişinin seçimine dokunmayız
    m.querySelector('#il') && m.querySelector('#il').addEventListener('change', e => { if (e.target.value) elle(); });
    m.querySelector('#ilce') && m.querySelector('#ilce').addEventListener('change', elle);
  }
  new MutationObserver(kartEkle).observe($('#icerik'), { childList: true });
  kartEkle();

  document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(() => kontrol(false), 1500); });
  setTimeout(() => kontrol(true), 2500);
  window.otoKonumKontrol = kontrol;
})();
