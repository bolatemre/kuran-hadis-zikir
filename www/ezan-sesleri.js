// Üç Nur — Uzun / tam ezan seçeneği.
// iOS bildirim sesi en fazla 30 saniye olabildiği için iPhone'da "Uzun ezan (30 sn)",
// Android'de bildirim kanalı sesi sonuna kadar çaldığı için "Tam ezan" sunulur.
(function () {
  const ek = PLATFORM === 'android' ? ['tam', ['Tam ezan', 'ezan_tam.mp3']] : ['uzun', ['Uzun ezan (30 sn)', 'ezan_uzun.wav']];
  // Listede "Kısa ezan"ın hemen altında görünsün diye sırayı yeniden kur
  const eski = Object.entries(BILDIRIM_SESLERI);
  eski.forEach(([k]) => delete BILDIRIM_SESLERI[k]);
  eski.forEach(([k, v]) => { BILDIRIM_SESLERI[k] = v; if (k === 'ezan') BILDIRIM_SESLERI[ek[0]] = ek[1]; });
  if (PLATFORM === 'android') {
    let kuruldu = false;
    const eskiKur = kanallariKur;
    kanallariKur = async function (LN) {
      if (!kuruldu && LN && LN.createChannel) {
        try { await LN.createChannel({ id: 'vakit-tam', name: 'Namaz vakitleri · tam ezan', description: 'Namaz vakitleri · tam ezan', sound: 'ezan_tam.mp3', importance: 4, visibility: 1, vibration: true }); kuruldu = true; } catch (e) {}
      }
      return eskiKur(LN);
    };
  }
})();
