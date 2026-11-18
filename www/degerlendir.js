// Üç Nur — "Uygulamayı değerlendir": mağazanın kendi puanlama penceresi (Apple ve Google'ın resmi yolu).
// Pencere yalnızca uygulamayı birkaç gün kullanmış birine, güzel bir anın hemen ardından gösterilmek istenir
// (bir seviye bitince, bir cüz okununca…). Ne zaman ve kaç kez görüneceğine asıl karar veren Apple / Google'dır;
// biz sadece "şimdi uygun bir an" deriz. Ayrıca Daha sayfasında elle değerlendirme ve görüş gönderme satırları var.
(function () {
  const APP_STORE_ID = '6831062117', PAKET = 'com.bolatemre.khz', POSTA = 'support@kidvo.net';
  const MAGAZA = () => PLATFORM === 'ios' ? `https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review` : `https://play.google.com/store/apps/details?id=${PAKET}`;
  const GUN = 864e5;

  // ---------- Kullanım günleri (bugün açıldıysa bir kez sayılır) ----------
  const bugun = ymd(new Date()), k = oku('degerlendirme', { gunler: 0, son: '', istek: 0, sonIstek: 0 });
  if (k.son !== bugun) { k.gunler++; k.son = bugun; yaz('degerlendirme', k); }

  let bekliyor = false;
  function uygunMu() {
    const d = oku('degerlendirme', k);
    return NATIVE && !bekliyor && d.gunler >= 3 && d.istek < 4 && Date.now() - (d.sonIstek || 0) > 60 * GUN;
  }
  // Güzel bir andan sonra mağazanın puanlama penceresini iste (gösterilip gösterilmeyeceğine mağaza karar verir)
  function degerlendirmeIste() {
    if (!uygunMu()) return;
    const R = eklenti('InAppReview'); if (!R || !R.requestReview) return;
    bekliyor = true;
    setTimeout(() => {
      const d = oku('degerlendirme', k); d.istek++; d.sonIstek = Date.now(); yaz('degerlendirme', d);
      R.requestReview().catch(() => {}).finally(() => { bekliyor = false; });
    }, 1800); // önce "Allah kabul etsin" / "Maşallah" mesajı görünsün
  }

  // ---------- Güzel anlar: kayıtlar yazılırken yakalanır ----------
  const eskiYaz = yaz;
  yaz = function (anahtar, deger) {
    let once;
    try {
      if (anahtar === 'kelimeAvi') once = oku('kelimeAvi', { acik: 1 }).acik;
      else if (/^halkaCuz\./.test(anahtar)) once = oku(anahtar, 0);
    } catch (e) {}
    eskiYaz(anahtar, deger);
    try {
      if (anahtar === 'kelimeAvi' && deger && deger.acik > once && deger.acik >= 6) degerlendirmeIste(); // en az 5 seviye bitirmiş
      else if (/^hatimOkudum\./.test(anahtar) && deger === true) degerlendirmeIste();             // haftalık hatimde cüzünü okudu
      else if (/^halkaCuz\./.test(anahtar) && deger > once) degerlendirmeIste();                   // ruhuna hatimde cüzünü okudu
    } catch (e) {}
  };

  // ---------- Daha sayfasına iki satır ----------
  function dahaEkle() {
    if (!yigin.length || yigin[yigin.length - 1].fn !== sDaha) return;
    const m = $('#icerik'), hak = m.querySelector('#d-hak'); if (!hak || m.querySelector('#d-degerlendir')) return;
    hak.closest('.liste').insertAdjacentHTML('afterend', `<div class="kategori-baslik">Bize destek olun</div><div class="liste">
      <button id="d-degerlendir"><span class="no">⭐</span><span class="orta"><b>Üç Nur’u değerlendir</b><span class="soluk">${PLATFORM === 'ios' ? 'App Store' : 'Google Play'}’de birkaç güzel söz, daha çok kişiye ulaşmamıza vesile olur</span></span><span class="soluk">›</span></button>
      <button id="d-gorus"><span class="no">✉️</span><span class="orta"><b>Görüş ve öneri gönder</b><span class="soluk">Hata, eksik ya da fikir: doğrudan bize yazın</span></span><span class="soluk">›</span></button>
      <button id="d-paylas"><span class="no">🤝</span><span class="orta"><b>Sevdiklerinle paylaş</b><span class="soluk">Hayra vesile olana, yapan gibi sevap vardır</span></span><span class="soluk">›</span></button></div>`);
    m.querySelector('#d-degerlendir').onclick = () => disLink(MAGAZA());
    m.querySelector('#d-gorus').onclick = () => {
      const surum = (window.Capacitor && Capacitor.getPlatform && Capacitor.getPlatform()) || 'web';
      disLink(`mailto:${POSTA}?subject=${encodeURIComponent('Üç Nur hakkında görüş')}&body=${encodeURIComponent(`\n\n\n— Telefon: ${surum}`)}`);
    };
    m.querySelector('#d-paylas').onclick = () => paylas('Kur’an, ezan vakti, zikir ve ailece hatim tek uygulamada: Üç Nur. Ücretsiz, araya giren reklam yok 🤍\ntinyurl.com/ucnur', 'Üç Nur');
  }
  new MutationObserver(dahaEkle).observe($('#icerik'), { childList: true });
  dahaEkle();

  window.degerlendirmeIste = degerlendirmeIste;
})();
