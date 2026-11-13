// Üç Nur — çocuk köşesi (namaz çetelesi, yıldızlar, sesli kıssa), haftalık manevi özet ve Bugün sayfasındaki girişler.
(function () {
  const { INDIR, say, gunEk, son7, onay } = U3;
  // =====================================================================
  // ÇOCUK KÖŞESİ: namaz çetelesi ve yıldızlar (yalnızca bu telefonda saklanır)
  // =====================================================================
  const GOREVLER = [['sabah', '🌅', 'Sabah namazı'], ['ogle', '🌞', 'Öğle namazı'], ['ikindi', '⛅', 'İkindi namazı'], ['aksam', '🌇', 'Akşam namazı'], ['yatsi', '🌙', 'Yatsı namazı'],
    ['besmele', '🥣', 'Besmele çektim'], ['dua', '🤲', 'Dua ettim'], ['kuran', '📖', 'Kur’an / Elif-Bâ çalıştım'], ['yardim', '🧹', 'Anneme babama yardım ettim'], ['guzel', '😊', 'Güzel söz söyledim'], ['paylas', '🍬', 'Paylaştım']];
  const ROZETLER = [[10, '🌟 Minik Yıldız'], [50, '✨ Parlayan Yıldız'], [100, '🕌 Namaz Kahramanı'], [250, '🏅 İyilik Şampiyonu'], [500, '👑 Yıldızlar Sultanı']];
  const AVATAR = ['🧒', '👧', '👦', '👶', '🧑', '🙂'];
  const cocuklar = () => oku('cocuklar', []);
  const cocukVeri = id => oku('cocuk.' + id, {});
  const cocukToplam = id => Object.values(cocukVeri(id)).reduce((a, x) => a + x.length, 0);
  function sCocuk(m) {
    let l = cocuklar(), secili = oku('cocukSecili', l[0] && l[0].id);
    const ciz = () => {
      l = cocuklar(); if (!l.some(c => c.id === secili)) secili = l[0] && l[0].id;
      if (!l.length) {
        m.innerHTML = `<div class="kart b3-ust"><div class="b3-ikon">⭐</div><h2>Çocuk Köşesi</h2><p class="soluk">Çocuğunuz kıldığı her namaz ve yaptığı her güzel iş için bir yıldız kazansın. Her şey yalnızca bu telefonda saklanır.</p>
          <button class="btn ana tam" id="c3-ekle" style="margin-top:14px">＋ Çocuk ekle</button></div>`;
        $('#c3-ekle').onclick = ekle; return;
      }
      const bugun = ymd(new Date()), v = cocukVeri(secili), b = v[bugun] || [], top = cocukToplam(secili), c = l.find(x => x.id === secili);
      const sonraki = ROZETLER.find(r => r[0] > top);
      m.innerHTML = `<div class="c3-cocuk">${l.map(x => `<button class="cip ${x.id === secili ? 'acik' : ''}" data-c="${x.id}">${x.av} ${esc(x.ad)}</button>`).join('')}<button class="cip" id="c3-ekle">＋ Ekle</button></div>
        <div class="kart c3-yildiz"><b>⭐ ${say(top)}</b><p>${esc(c.ad)} bugün ${b.length} yıldız kazandı${sonraki ? ` · “${sonraki[1].slice(3)}” rozetine ${sonraki[0] - top} yıldız kaldı` : ''}</p></div>
        <div class="kategori-baslik">Bugün ne yaptın?</div>
        <div class="c3-gorev">${GOREVLER.map(([k, i, a]) => `<button class="${b.includes(k) ? 'ok' : ''}" data-g="${k}"><span>${i}</span>${a}</button>`).join('')}</div>
        <div class="kart"><h2>Bu hafta</h2><div class="c3-hafta">${son7().map(d => `<div class="${ymd(d) === bugun ? 'bugun' : ''}"><b>${(v[ymd(d)] || []).length || '·'}</b>${d.toLocaleDateString('tr-TR', { weekday: 'short' })}</div>`).join('')}</div></div>
        <div class="kart"><h2>Rozetler</h2><div class="c3-rozet">${ROZETLER.map(r => `<span class="${top >= r[0] ? 'var' : ''}">${r[1]} · ${r[0]}</span>`).join('')}</div></div>
        <button class="btn ana tam" id="c3-kissa">📚 Bugünün kıssasını dinle / oku</button>
        <button class="btn tam" id="c3-sil">${esc(c.ad)} adlı çocuğu sil</button>`;
      m.querySelectorAll('[data-c]').forEach(x => x.onclick = () => { secili = x.dataset.c; yaz('cocukSecili', secili); ciz(); });
      $('#c3-ekle').onclick = ekle;
      m.querySelectorAll('[data-g]').forEach(x => x.onclick = () => {
        const vv = cocukVeri(secili), g = new Set(vv[bugun] || []), k = x.dataset.g, vardi = g.has(k);
        vardi ? g.delete(k) : g.add(k); vv[bugun] = [...g]; if (!g.size) delete vv[bugun]; yaz('cocuk.' + secili, vv);
        const yeniTop = cocukToplam(secili), rozet = !vardi && ROZETLER.find(r => r[0] === yeniTop);
        if (rozet) { titres('HEAVY'); toast(`Maşallah! ${rozet[1]} rozeti kazanıldı 🎉`, 4000); } else if (!vardi) { titres(); toast('Aferin, bir yıldız daha ⭐', 1200); }
        const st = m.scrollTop; ciz(); m.scrollTop = st;
      });
      $('#c3-kissa').onclick = () => { const i = gunNo() % KISSALAR.length; sayfa(mm => sKissa(mm, i), 'Kıssadan Hisse'); };
      $('#c3-sil').onclick = async () => { if (!(await onay(`${c.ad} silinsin mi?`, 'Kazandığı bütün yıldızlar da silinir.', 'Sil'))) return; yaz('cocuklar', l.filter(x => x.id !== secili)); try { localStorage.removeItem('khz.cocuk.' + secili); } catch (e) {} ciz(); };
    };
    const ekle = async () => { const ad = await sor({ baslik: 'Çocuğun adı', yer: 'Ör. Zeynep', tamam: 'Ekle', uzunluk: 20 }); if (!ad) return; const ll = cocuklar(), id = 'c' + Date.now().toString(36); ll.push({ id, ad, av: AVATAR[ll.length % AVATAR.length] }); yaz('cocuklar', ll); secili = id; yaz('cocukSecili', id); ciz(); };
    ciz();
  }

  // ---------- Kıssaları sesli dinleme ----------
  let okuyor = false;
  function sesiDurdur() { okuyor = false; const T = eklenti('TextToSpeech'); if (NATIVE && T && T.stop) T.stop().catch(() => {}); try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} }
  async function sesliOku(metinler, bitince) {
    okuyor = true; const T = eklenti('TextToSpeech');
    try {
      for (const p of metinler) {
        if (!okuyor) break;
        if (NATIVE && T && T.speak) await T.speak({ text: p, lang: 'tr-TR', rate: 0.95, pitch: 1, volume: 1, category: 'playback' });
        else if (window.speechSynthesis && window.SpeechSynthesisUtterance) await new Promise((tamam, hata) => { const u = new SpeechSynthesisUtterance(p); u.lang = 'tr-TR'; u.rate = 0.95; u.onend = tamam; u.onerror = hata; speechSynthesis.speak(u); });
        else throw new Error('yok');
      }
    } catch (e) { if (okuyor) toast('Bu telefonda sesli okuma kullanılamıyor. Telefon ayarlarından Türkçe “metin okuma” sesini yükleyebilirsiniz.', 4500); }
    okuyor = false; bitince && bitince();
  }
  const eskiKissa = sKissa;
  sKissa = function (m, i) {
    eskiKissa(m, i);
    const [, bas, hik, hisse] = KISSALAR[i], hedef = m.querySelector('.kissa-metin'); if (!hedef) return;
    const b = document.createElement('button'); b.className = 'btn ana k3-dinle'; b.textContent = '🔊 Sesli dinle'; hedef.before(b);
    const yaz_ = () => { b.textContent = okuyor ? '⏹ Durdur' : '🔊 Sesli dinle'; };
    b.onclick = () => { if (okuyor) { sesiDurdur(); yaz_(); return; } sesliOku([bas, ...hik.split(/\n+/), 'Kıssadan hisse.', hisse].filter(Boolean), () => b.isConnected && yaz_()); yaz_(); };
    temizlik.push(sesiDurdur);
  };

  // =====================================================================
  // HAFTALIK MANEVİ ÖZET
  // =====================================================================
  function ozetVeri() {
    const g = son7(), iy = (typeof iyilikVeri === 'function' ? iyilikVeri() : {}), kz = (typeof kazaVeri === 'function' ? kazaVeri() : null), w = haftaNo();
    const top = f => g.reduce((a, d) => a + (f(ymd(d)) || 0), 0);
    return {
      aralik: `${g[0].toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} – ${g[6].toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}`,
      zikir: top(t => oku('gunluk.' + t, 0)),
      halka: top(t => oku('halkaGunluk.' + t, 0)),
      cuz: Math.max(0, top(t => oku('halkaCuz.' + t, 0))) + hatimlerim().filter(h => oku(`hatimOkudum.${h.kod}.${w}`, false)).length,
      namaz: kz && kz.gun ? top(t => { const [kl] = kz.gun[t] || [0]; return [0, 1, 2, 3, 4].filter(v => kl >> v & 1).length; }) : 0,
      iyilik: top(t => iy[t] && iy[t].s ? iy[t].s.length : 0),
      yildiz: cocuklar().reduce((a, c) => { const v = cocukVeri(c.id); return a + top(t => (v[t] || []).length); }, 0),
    };
  }
  const OZET_SATIR = [['zikir', '📿', 'zikir çektin', 'zikir'], ['halka', '🤝', 'ortak halkalara katkın', 'halka katkısı'], ['cuz', '📖', 'cüz okudun', 'cüz'], ['namaz', '🕌', 'vakit namaz işaretledin', ''], ['iyilik', '🤍', 'iyilik yazdın', ''], ['yildiz', '⭐', 'çocukların kazandığı yıldız', '']];
  function ozetGorsel(o) {
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1350; const x = c.getContext('2d');
    const gr = x.createLinearGradient(0, 0, 1080, 1350); gr.addColorStop(0, '#175c44'); gr.addColorStop(.55, '#0f3d2e'); gr.addColorStop(1, '#08241a'); x.fillStyle = gr; x.fillRect(0, 0, 1080, 1350);
    const isik = x.createRadialGradient(950, 80, 0, 950, 80, 700); isik.addColorStop(0, 'rgba(232,196,110,.28)'); isik.addColorStop(1, 'rgba(232,196,110,0)'); x.fillStyle = isik; x.fillRect(0, 0, 1080, 1350);
    x.strokeStyle = 'rgba(232,196,110,.45)'; x.lineWidth = 4; x.strokeRect(36, 36, 1008, 1278);
    const F = (px, w) => `${w || 700} ${px}px -apple-system, "Segoe UI", Roboto, "Inter", sans-serif`; x.textAlign = 'center';
    x.fillStyle = '#e8c46e'; x.font = F(40, 600); x.fillText('HAFTALIK MANEVİ ÖZET', 540, 150);
    x.fillStyle = '#fff'; x.font = F(76, 800); x.fillText('Bu hafta, elhamdülillah', 540, 260);
    x.fillStyle = '#e9d9a8'; x.font = F(38, 500); x.fillText(o.aralik, 540, 330);
    // Paylaşılan görselde iyilikler ve namazlar yer almaz; onlar kul ile Rabbi arasında kalır
    const s = OZET_SATIR.filter(r => r[3] && o[r[0]] > 0);
    if (!s.length) { x.fillStyle = '#fff'; x.font = F(54, 600); x.fillText('Her gün küçük bir adım,', 540, 640); x.fillText('büyük bir yolculuktur.', 540, 720); }
    s.forEach((r, i) => { const y = 520 + i * 230 + (3 - s.length) * 100;
      x.fillStyle = 'rgba(255,255,255,.09)'; x.beginPath(); x.roundRect ? x.roundRect(130, y - 120, 820, 190, 36) : x.rect(130, y - 120, 820, 190); x.fill();
      x.fillStyle = '#f0d48a'; x.font = F(96, 800); x.fillText(say(o[r[0]]), 540, y - 10); x.fillStyle = '#fff'; x.font = F(40, 500); x.fillText(r[3], 540, y + 46); });
    x.fillStyle = '#fff'; x.font = F(44, 700); x.fillText('Üç Nur · Kur’an, Hadis, Zikir', 540, 1200);
    x.fillStyle = '#e8c46e'; x.font = F(36, 500); x.fillText('Ücretsiz: ' + INDIR, 540, 1256);
    return c;
  }
  function sOzet(m) {
    const o = ozetVeri(), s = OZET_SATIR.filter(r => o[r[0]] > 0), c = ozetGorsel(o), veri = c.toDataURL('image/jpeg', .9);
    m.innerHTML = `<div class="kart b3-ust"><div class="b3-ikon">📊</div><h2>Haftalık Manevi Özet</h2><p class="soluk">${esc(o.aralik)}</p></div>
      <div class="kart">${s.length ? s.map(r => `<div class="o3-satir"><span>${r[1]}</span><div>${r[2]}</div><b>${say(o[r[0]])}</b></div>`).join('') : '<p class="soluk" style="margin:0">Bu hafta henüz bir kayıt yok. Zikirmatik, hatim halkası ya da iyilik defteriyle küçük bir adım atabilirsin.</p>'}</div>
      <p class="soluk" style="margin:0 4px 12px">Bu özet yalnızca senin içindir, kendinle bir muhasebe. Paylaşacaksan niyetin sevdiklerini teşvik etmek olsun; iyiliklerin ve namazların paylaşılan görselde yer almaz.</p>
      <img class="o3-gorsel" src="${veri}" alt="Haftalık özet görseli">
      <button class="btn ana tam" id="o3-paylas">Teşvik için paylaş</button>`;
    $('#o3-paylas').onclick = async () => {
      const metin = `Bu hafta Üç Nur ile… Sen de katıl, birlikte devam edelim 🤍 ${INDIR}`, b64 = veri.split(',')[1];
      try {
        const FS = eklenti('Filesystem'), S = eklenti('Share');
        if (NATIVE && FS && S) { const r = await FS.writeFile({ path: 'ucnur-haftalik-ozet.jpg', data: b64, directory: 'CACHE' }); await S.share({ title: 'Haftalık Manevi Özet', text: metin, files: [r.uri], dialogTitle: 'Paylaş' }); return; }
        const blob = await (await fetch(veri)).blob(), dosya = new File([blob], 'ucnur-haftalik-ozet.jpg', { type: 'image/jpeg' });
        if (navigator.canShare && navigator.canShare({ files: [dosya] })) { await navigator.share({ files: [dosya], text: metin }); return; }
        throw new Error('yok');
      } catch (e) { if (/cancel|abort|iptal/i.test(String(e && (e.message || e.name)))) return; toast('Görselin ekran görüntüsünü alarak paylaşabilirsiniz.', 3500); }
    };
  }

  // ---------- Cuma akşamı "özetin hazır" bildirimi ----------
  const eskiBildirimler = ekBildirimler;
  ekBildirimler = function (simdi) {
    const l = eskiBildirimler(simdi);
    try {
      if (oku('ozetBildirim', true)) for (let g = 0, n = 0; g < 15 && n < 2; g++) {
        const at = gunEk(simdi, g); if (at.getDay() !== 5) continue; at.setHours(20, 30, 0, 0); if (at <= simdi) continue;
        l.push({ id: 3500 + n++, title: 'Haftalık manevi özetin hazır 📊', body: 'Bu hafta neler yaptın? Bir bak, şükret, gelecek haftaya niyet et.', schedule: { at, allowWhileIdle: true }, ...genelKanal() });
      }
    } catch (e) {}
    return l;
  };

  // ---------- Bugün sayfasına girişler ----------
  function bugunEkle() {
    if (!yigin.length || yigin[yigin.length - 1].fn !== sBugun) return;
    const m = $('#icerik'), hatim = m.querySelector('#k-hatim'); if (!hatim || m.querySelector('#k3-halka')) return;
    hatim.insertAdjacentHTML('beforebegin', `<button id="k3-halka"><span class="k-ikon">🤝</span><b>Halkalar</b><small>Ruhuna hatim, zikir, dua</small></button>
      <button id="k3-cocuk"><span class="k-ikon">⭐</span><b>Çocuk Köşesi</b><small>Namaz çetelesi</small></button>
      <button id="k3-ozet"><span class="k-ikon">📊</span><b>Haftalık Özet</b><small>Bu hafta neler yaptın?</small></button>`);
    m.querySelector('#k3-halka').onclick = () => sayfa(sBirlikte, 'Halkalar');
    m.querySelector('#k3-cocuk').onclick = () => sayfa(sCocuk, 'Çocuk Köşesi');
    m.querySelector('#k3-ozet').onclick = () => sayfa(sOzet, 'Haftalık Özet');
    if (new Date().getDay() === 5 && !m.querySelector('#o3-bugun')) { // cuma günü öne çıkar
      const hedef = m.querySelector('.hizli'); if (!hedef) return;
      hedef.insertAdjacentHTML('afterend', `<button class="o3-bugun" id="o3-bugun"><span>📊</span><div><b>Haftalık manevi özetin hazır</b><small>Bu hafta neler yaptın? Bir bak.</small></div></button>`);
      m.querySelector('#o3-bugun').onclick = () => sayfa(sOzet, 'Haftalık Özet');
    }
  }
  new MutationObserver(bugunEkle).observe($('#icerik'), { childList: true });
  bugunEkle();

  Object.assign(window, { sCocuk, sOzet });
})();
