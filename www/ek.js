/* Üç Nur — öğrenme, ses, kaza takvimi, camiler, cuma gecesi, kabir sualleri.
   app.js'ten önce yüklenir; buradaki fonksiyonlar app.js'teki yardımcıları (oku, yaz, $, esc, sayfa...) çağrıldıkları anda kullanır. */
'use strict';

// =====================================================================
// SES
// =====================================================================
const KARILER = {
  muallim: ['Husarî (öğretici, yavaş)', 'Husary_Muallim_128kbps'],
  husary: ['Mahmûd Halîl el-Husarî', 'Husary_128kbps'],
  alafasy: ['Mişârî Râşid el-Afâsî', 'Alafasy_128kbps'],
  abdulbasit: ['Abdulbâsit Abdussamed', 'Abdul_Basit_Murattal_192kbps'],
  minshawy: ['Muhammed Sıddîk el-Minşâvî', 'Minshawy_Murattal_128kbps'],
};
const uc = n => String(n).padStart(3, '0');
function ayetSesi(s, a, kari) { const k = KARILER[kari || oku('kari', 'alafasy')] || KARILER.alafasy; return `https://everyayah.com/data/${k[1]}/${uc(s)}${uc(a)}.mp3`; }

// Uygulamayla gelen yapay seslerin listesi (derlemede üretilir); yoksa telefonun kendi Arapça sesi kullanılır
let sesListesiP = null;
function yerelSesler() { return sesListesiP || (sesListesiP = fetch('ses/liste.json').then(r => r.ok ? r.json() : []).then(l => new Set(l)).catch(() => new Set())); }

const Calar = (() => {
  const au = new Audio(); au.preload = 'auto';
  let liste = [], i = 0, tekrar = 1, kalanTekrar = 1, araVer = false, olay = {}, bekle = null, calisiyor = false;
  const ileri = () => {
    if (--kalanTekrar > 0) return oynat();
    i++; kalanTekrar = tekrar;
    if (i >= liste.length) { calisiyor = false; olay.bitti && olay.bitti(); return; }
    oynat();
  };
  const oynat = () => {
    clearTimeout(bekle); const x = liste[i]; calisiyor = true;
    olay.parca && olay.parca(i, x);
    if (x.tts) { konus(x.tts, ileri); return; }
    au.src = x.url; au.playbackRate = oku('sesHiz', 1);
    au.play().catch(() => {});
  };
  au.addEventListener('ended', () => {
    if (!calisiyor) return;
    if (araVer && au.duration) { olay.bekliyor && olay.bekliyor(i); bekle = setTimeout(ileri, Math.min(20, au.duration) * 1000 + 400); }
    else ileri();
  });
  au.addEventListener('error', () => { if (!calisiyor || !au.src) return; calisiyor = false; toast('Ses yüklenemedi. İnternet bağlantınızı kontrol edin.', 3500); olay.hata && olay.hata(); });
  return {
    baslat(l, o = {}) { this.durdur(); liste = l; i = o.bas || 0; tekrar = kalanTekrar = o.tekrar || 1; araVer = !!o.araVer; olay = o; if (l.length) oynat(); },
    durdur() { calisiyor = false; clearTimeout(bekle); au.pause(); try { speechSynthesis.cancel(); } catch (e) {} },
    duraklat() { if (!calisiyor) return; calisiyor = false; clearTimeout(bekle); au.pause(); try { speechSynthesis.cancel(); } catch (e) {} },
    devam() { if (calisiyor || !liste.length) return; if (i >= liste.length) { i = 0; kalanTekrar = tekrar; au.removeAttribute('src'); } calisiyor = true; if (au.src && !au.ended && !liste[i].tts) au.play().catch(() => {}); else oynat(); },
    get calisiyor() { return calisiyor; }, get sira() { return i; },
    ayar(o) { if ('tekrar' in o) { tekrar = o.tekrar; kalanTekrar = Math.min(kalanTekrar, tekrar); } if ('araVer' in o) araVer = o.araVer; },
  };
})();

function konus(metin, sonra) {
  try {
    if (!('speechSynthesis' in window)) throw 0;
    const u = new SpeechSynthesisUtterance(metin); u.lang = 'ar-SA'; u.rate = .75;
    const v = speechSynthesis.getVoices().find(x => /^ar/i.test(x.lang)); if (v) u.voice = v;
    u.onend = () => sonra && sonra(); u.onerror = () => sonra && sonra();
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  } catch (e) { toast('Bu cihazda Arapça ses bulunamadı.'); sonra && sonra(); }
}
// Yapay ses: dosya varsa onu, yoksa cihazın sesini çal
async function sesCal(dosya, metin, o = {}) {
  const var_ = (await yerelSesler()).has(dosya);
  Calar.baslat([var_ ? { url: 'ses/' + dosya + '.mp3' } : { tts: metin }], o);
}
// Kur'an âyetleri: [[sûre, âyet], ...] -> çalma listesi (sûre başında besmele)
function ayetListesi(ayetler, kari, besmele = true) {
  const l = [];
  ayetler.forEach(([s, a]) => { if (besmele && a === 1 && s !== 1 && s !== 9) l.push({ url: ayetSesi(1, 1, kari), s, a: 0 }); l.push({ url: ayetSesi(s, a, kari), s, a }); });
  return l;
}

// Kur'an okuyucuda alt çalar çubuğu
function kuranCalar(m, n, ayetSayisi, o = {}) {
  const eski = $('#calar'); if (eski) eski.remove();
  const bar = document.createElement('div'); bar.id = 'calar'; bar.hidden = true; document.body.appendChild(bar);
  temizlik.push(() => { Calar.durdur(); bar.remove(); document.querySelectorAll('.ayet.caliyor').forEach(e => e.classList.remove('caliyor')); });
  let tekrar = oku('sesTekrar', 1), araVer = oku('sesAra', false);
  const isaretle = a => {
    m.querySelectorAll('.ayet.caliyor').forEach(e => e.classList.remove('caliyor'));
    const el = $('#a' + a, m); if (!el) return; el.classList.add('caliyor');
    const r = el.getBoundingClientRect(), mr = m.getBoundingClientRect();
    if (r.top < mr.top + 10 || r.bottom > mr.bottom - 120) m.scrollTop += r.top - mr.top - 70;
  };
  const ciz = () => {
    bar.innerHTML = `<button id="c-oynat" class="c-ana">${Calar.calisiyor ? '❚❚' : '▶'}</button>
      <div class="c-orta"><b id="c-yazi">${esc(KARILER[oku('kari', 'alafasy')][0])}</b>
        <div class="c-ayar"><select id="c-kari">${Object.entries(KARILER).map(([k, v]) => `<option value="${k}" ${k === oku('kari', 'alafasy') ? 'selected' : ''}>${esc(v[0])}</option>`).join('')}</select>
        <select id="c-tekrar">${[1, 2, 3, 5, 10].map(x => `<option value="${x}" ${x === tekrar ? 'selected' : ''}>${x === 1 ? 'Tekrarsız' : x + ' kez'}</option>`).join('')}</select>
        <button id="c-ara" class="cip ${araVer ? 'acik' : ''}">Tekrar için bekle</button></div></div>
      <button id="c-kapat" class="c-kapat" aria-label="Kapat">✕</button>`;
    $('#c-oynat').onclick = () => { if (Calar.calisiyor) Calar.duraklat(); else Calar.devam(); ciz(); };
    $('#c-kapat').onclick = () => { Calar.durdur(); bar.hidden = true; m.style.paddingBottom = ''; m.querySelectorAll('.ayet.caliyor').forEach(e => e.classList.remove('caliyor')); };
    $('#c-kari').onchange = e => { yaz('kari', e.target.value); const a = Math.max(1, aktif); basla(a); };
    $('#c-tekrar').onchange = e => { tekrar = +e.target.value; yaz('sesTekrar', tekrar); Calar.ayar({ tekrar }); };
    $('#c-ara').onclick = () => { araVer = !araVer; yaz('sesAra', araVer); Calar.ayar({ araVer }); $('#c-ara').classList.toggle('acik', araVer); toast(araVer ? 'Her âyetten sonra tekrar etmeniz için bekler' : 'Kesintisiz okur'); };
  };
  let aktif = 1;
  const basla = (a = 1) => {
    bar.hidden = false; m.style.paddingBottom = '150px';
    const l = []; for (let x = a; x <= ayetSayisi; x++) l.push([n, x]);
    Calar.baslat(ayetListesi(l, null, a === 1), {
      tekrar, araVer,
      parca: (i, x) => { aktif = x.a || 1; isaretle(aktif); const y = $('#c-yazi'); if (y) y.textContent = x.a ? `${x.a}. âyet · ${KARILER[oku('kari', 'alafasy')][0]}` : 'Besmele'; const b = $('#c-oynat'); if (b) b.textContent = '❚❚'; },
      bekliyor: () => { const y = $('#c-yazi'); if (y) y.textContent = `${aktif}. âyet · şimdi siz tekrar edin…`; },
      bitti: () => { ciz(); if (o.bitti) o.bitti(); },
      hata: () => ciz(),
    });
    ciz();
  };
  ciz();
  return { basla };
}

// =====================================================================
// ÖĞREN (merkez)
// =====================================================================
const satirBtn = (id, ikon, b, a) => `<button id="${id}"><span class="no">${ikon}</span><span class="orta"><b>${b}</b><span class="soluk">${a}</span></span><span class="soluk">›</span></button>`;
function sOgren(m) {
  const ez = oku('ezber', []);
  m.innerHTML = `<div class="kart ogren-ust"><h2>Namazı ve Kur'an'ı öğrenelim</h2><p style="margin:0">Adım adım, resimli ve sesli. Acele yok; her gün biraz.</p></div>
    <div class="liste">
      ${satirBtn('o-abdest', '💧', 'Abdest Nasıl Alınır', '8 adımda abdest')}
      ${satirBtn('o-namaz', '🕌', 'Namaz Nasıl Kılınır', 'Resimli, adım adım')}
      ${satirBtn('o-dua', '🤲', 'Namaz Duaları ve Sûreler', `Dinle, ezberle · ${ez.length} ezber`)}
      ${satirBtn('o-rekat', '🔢', 'Rekât Sayıları', 'Beş vakit ve cuma')}
    </div>
    <div class="liste">
      ${satirBtn('o-elifba', 'ا', 'Elif-Bâ', 'Harfler, harekeler, sesli')}
      ${satirBtn('o-kuran', '📖', 'Kur\'an Okumayı Öğren', 'Hafızı dinle, tekrar et')}
    </div>`;
  $('#o-abdest').onclick = () => sayfa(sAbdest, 'Abdest');
  $('#o-namaz').onclick = () => sayfa(sNamazKilinis, 'Namaz Nasıl Kılınır');
  $('#o-dua').onclick = () => sayfa(sDualar, 'Namaz Duaları');
  $('#o-rekat').onclick = () => sayfa(sRekat, 'Rekât Sayıları');
  $('#o-elifba').onclick = () => sayfa(sElifba, 'Elif-Bâ');
  $('#o-kuran').onclick = () => sayfa(sKuranOgren, 'Kur\'an Okumayı Öğren');
}
function sAbdest(m) {
  m.innerHTML = `<div class="liste adimlar">${ABDEST.map(([b, t], i) => `<div><span class="no">${i + 1}</span><span class="orta"><b>${esc(b)}</b><span>${esc(t)}</span></span></div>`).join('')}</div>
    <div class="kart"><h2>Abdestin farzları</h2><p style="margin:0">Yüzü yıkamak, kolları dirseklerle birlikte yıkamak, başın dörtte birini mesh etmek, ayakları topuklarla birlikte yıkamak.</p></div>
    <p class="soluk">“Ey iman edenler! Namaza kalkacağınız zaman yüzlerinizi, dirseklere kadar ellerinizi yıkayın; başlarınızı mesh edin ve topuklara kadar ayaklarınızı yıkayın.” (Mâide, 6)</p>`;
}
function sRekat(m) {
  m.innerHTML = REKATLAR.map(([v, l]) => `<div class="kart rekat"><h2>${v} namazı</h2>${l.map(([a, s]) => `<div class="ayar-satir"><span>${a}</span><b>${s} rekât</b></div>`).join('')}<div class="soluk" style="margin-top:6px">Toplam ${l.reduce((x, y) => x + y[1], 0)} rekât</div></div>`).join('')
    + `<p class="soluk">Cuma günü öğle namazı yerine cuma namazı kılınır.</p>`;
}

// Bir dua ya da zikir kartı (Arapça + okunuş + anlam + dinle)
function duaKutu(d, dosya) {
  return `<div class="dua-kutu"><div class="ar">${esc(d.ar)}</div><div class="okunus">${esc(d.ok)}</div><div class="soluk">${esc(d.anlam)}</div>
    <button class="cip dinle" data-dosya="${dosya}" data-metin="${esc(d.ar)}" ${d.ses ? `data-ayet="${d.ses.a.map(x => x.join(':')).join(',')}"` : ''}>▶ Dinle</button></div>`;
}
// #icerik her sayfada aynı öğe: dinleyiciler sayfa değişince kaldırılır
function olayEkle(el, ad, fn, o) { el.addEventListener(ad, fn, o); temizlik.push(() => el.removeEventListener(ad, fn, o)); }
function dinleBagla(m) {
  olayEkle(m, 'click', e => {
    const b = e.target.closest('button.dinle'); if (!b) return;
    if (b.dataset.ayet) Calar.baslat(ayetListesi(b.dataset.ayet.split(',').map(x => x.split(':').map(Number)), 'muallim', false));
    else if (b.dataset.sure) { const s = +b.dataset.sure, l = []; kuran().then(K => { for (let a = 1; a <= K[s - 1].v.length; a++) l.push([s, a]); Calar.baslat(ayetListesi(l, 'muallim')); }); }
    else sesCal(b.dataset.dosya, b.dataset.metin);
  });
  temizlik.push(() => Calar.durdur());
}

// ---------- Namaz kılınışı ----------
function sNamazKilinis(m) {
  let i = 0; const N = NAMAZ_ADIMLARI.length;
  const ciz = () => {
    const a = NAMAZ_ADIMLARI[i];
    let ek = '';
    if (a.zikir) ek += duaKutu(ZIKIR_KISA[a.zikir], 'z_' + a.zikir);
    (a.dualar || []).forEach(id => { const d = DUALAR.find(x => x.id === id); ek += `<div class="dua-baslik">${esc(d.ad)}</div>` + duaKutu(d, 'dua_' + id); });
    (a.sureler || []).forEach(s => { ek += `<button class="kart sure-link" data-s="${s}"><b>${s === 1 ? 'Fâtiha' : esc(sureAdi(s))} Sûresi</b><span class="soluk">Okunuşu ve meali ›</span></button>`; });
    m.innerHTML = `<div class="adim-ust"><span>${i + 1} / ${N}</span><div class="noktalar">${NAMAZ_ADIMLARI.map((_, j) => `<i class="${j === i ? 'acik' : j < i ? 'gecti' : ''}"></i>`).join('')}</div></div>
      <div class="kart figur-kart">${namazFiguru(a.poz)}<h3>${esc(a.baslik)}</h3><p>${esc(a.metin)}</p></div>
      ${ek}
      <div class="sure-gecis"><button id="n-geri" ${i === 0 ? 'disabled' : ''}>‹ Önceki</button><button id="n-ileri">${i === N - 1 ? 'Baştan' : 'Sonraki ›'}</button></div>
      ${i === N - 1 ? `<div class="kart" style="margin-top:12px"><h2>Üç ve dört rekâtlı namazlarda</h2><ul class="madde">${NAMAZ_EK.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
      <p class="soluk" style="text-align:center;margin-top:14px">Hanefî mezhebine göre anlatılmıştır.</p>`;
    $('#n-geri').onclick = () => { if (i > 0) { i--; ciz(); m.scrollTop = 0; } };
    $('#n-ileri').onclick = () => { i = (i + 1) % N; ciz(); m.scrollTop = 0; };
    m.querySelectorAll('.sure-link').forEach(b => b.onclick = () => sayfa(mm => sSureOgren(mm, +b.dataset.s), 'Sûre'));
  };
  dinleBagla(m); sureAdlariYukle().then(ciz);
  // kaydırarak geçiş
  let x0 = null;
  olayEkle(m, 'touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  olayEkle(m, 'touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 70) { if (dx < 0 && i < N - 1) i++; else if (dx > 0 && i > 0) i--; else return; ciz(); m.scrollTop = 0; } }, { passive: true });
}
let SURE_ADLARI = null;
function sureAdi(s) { return SURE_ADLARI ? SURE_ADLARI[s - 1] : ''; }
function sureAdlariYukle() { return kuran().then(K => { SURE_ADLARI = K.map(x => x.ad); return K; }); }

// ---------- Dualar ve sûreler (ezber) ----------
function sDualar(m) {
  sureAdlariYukle().then(() => {
    const ez = new Set(oku('ezber', [])), say = [...ez].filter(k => /^[ds]:/.test(k)).length;
    const tik = k => ez.has(k) ? '<span class="ezber-tik">✓</span>' : '<span class="soluk">›</span>';
    m.innerHTML = `<div class="kart"><h2>Ezber durumu</h2><div class="ilerleme koyu"><i style="width:${Math.round(say / (DUALAR.length + NAMAZ_SURELERI.length) * 100)}%"></i></div>
        <p class="soluk" style="margin:6px 0 0">${say} / ${DUALAR.length + NAMAZ_SURELERI.length} ezberlendi. Her birini dinle, okunuşu gizleyerek kendini dene.</p></div>
      <div class="kategori-baslik">Namaz duaları</div>
      <div class="liste">${DUALAR.map(d => `<button data-d="${d.id}"><span class="no">🤲</span><span class="orta"><b>${esc(d.ad)}</b><span class="soluk">${esc(d.yer)}</span></span>${tik('d:' + d.id)}</button>`).join('')}</div>
      <div class="kategori-baslik">Namazda okunan sûreler</div>
      <div class="liste">${NAMAZ_SURELERI.map(s => `<button data-s="${s}"><span class="no">${s}</span><span class="orta"><b>${esc(sureAdi(s))}</b><span class="soluk">${SURE_OKUNUS[s].length} âyet</span></span>${tik('s:' + s)}</button>`).join('')}</div>`;
    m.onclick = e => {
      const b = e.target.closest('button[data-d],button[data-s]'); if (!b) return;
      if (b.dataset.d) sayfa(mm => sDuaEzber(mm, b.dataset.d), DUALAR.find(x => x.id === b.dataset.d).ad);
      else sayfa(mm => sSureOgren(mm, +b.dataset.s), sureAdi(+b.dataset.s));
    };
  });
}
// Okunuşu kademeli gizleme: 0 açık, 1 yarısı, 2 baş harfler, 3 tamamen
function gizle(metin, seviye) {
  if (!seviye) return esc(metin);
  return metin.split(/(\s+)/).map((w, i) => {
    if (/^\s+$/.test(w) || !w) return w;
    const k = Math.floor(i / 2);
    if (seviye === 1 && k % 2 === 0) return esc(w);
    const harf = seviye === 3 ? '' : esc(w[0]);
    return `<span class="gizli" data-w="${esc(w)}">${harf}${'•'.repeat(Math.max(1, Math.min(6, w.length - (harf ? 1 : 0))))}</span>`;
  }).join('');
}
function ezberAyari(m, anahtar, ciz) {
  const ez = new Set(oku('ezber', [])), var_ = ez.has(anahtar);
  return {
    html: `<div class="ezber-ayar"><span class="soluk">Okunuşu gizle:</span>${['Açık', 'Yarısı', 'Baş harf', 'Tamamı'].map((x, i) => `<button class="cip ${i === oku('gizle', 0) ? 'acik' : ''}" data-g="${i}">${x}</button>`).join('')}</div>`,
    alt: `<button class="btn tam ${var_ ? '' : 'ana'}" id="ezberledim">${var_ ? '✓ Ezberledim (geri al)' : 'Ezberledim ✓'}</button>`,
    bagla() {
      m.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { yaz('gizle', +b.dataset.g); ciz(); });
      m.querySelectorAll('.gizli').forEach(g => g.onclick = () => { g.outerHTML = `<span class="acilan">${esc(g.dataset.w)}</span>`; });
      $('#ezberledim').onclick = () => { const s = new Set(oku('ezber', [])); if (s.has(anahtar)) s.delete(anahtar); else { s.add(anahtar); titres('HEAVY'); toast('Mâşâallah! Allah hıfzını kolaylaştırsın.'); } yaz('ezber', [...s]); ciz(); };
    },
  };
}
function sDuaEzber(m, id) {
  const d = DUALAR.find(x => x.id === id);
  const ciz = () => {
    const e = ezberAyari(m, 'd:' + id, ciz), sev = oku('gizle', 0);
    m.innerHTML = `<div class="kart"><h2>${esc(d.ad)}</h2><p class="soluk" style="margin-top:0">${esc(d.yer)}</p>
        <div class="ar ar-buyuk">${esc(d.ar)}</div>
        <div class="dinle-satir"><button class="btn ana" id="d-dinle">▶ Dinle</button><button class="btn" id="d-3">3 kez dinle</button></div>
        ${d.ses ? '' : '<p class="soluk ses-not">Dua sesi yardımcı okumadır; telaffuzu bir hocadan da dinlemeniz tavsiye edilir.</p>'}</div>
      <div class="kart"><h2>Okunuşu</h2>${e.html}<div class="okunus buyuk">${gizle(d.ok, sev)}</div></div>
      <div class="kart"><h2>Anlamı</h2><p style="margin:0">${esc(d.anlam)}</p></div>${e.alt}`;
    const cal = t => d.ses ? Calar.baslat(ayetListesi(d.ses.a, 'muallim', false), { tekrar: t }) : yerelSesler().then(s => Calar.baslat([s.has('dua_' + id) ? { url: 'ses/dua_' + id + '.mp3' } : { tts: d.ar }], { tekrar: t }));
    $('#d-dinle').onclick = () => cal(1); $('#d-3').onclick = () => cal(3);
    e.bagla();
  };
  temizlik.push(() => Calar.durdur()); ciz();
}
function sSureOgren(m, s) {
  kuran().then(K => {
    const sure = K[s - 1], okn = SURE_OKUNUS[s] || [];
    $('#baslik').textContent = sure.ad + ' Sûresi';
    const ciz = () => {
      const e = okn.length ? ezberAyari(m, 's:' + s, ciz) : { html: '', alt: '', bagla() {} }, sev = oku('gizle', 0);
      m.innerHTML = `<div class="kart vakit-kart"><h2>${esc(sure.ad)} Sûresi · ${sure.v.length} âyet</h2>
          <div class="dinle-satir"><button class="btn ana" id="s-dinle">▶ Dinle</button><button class="btn" id="s-tekrar">Dinle ve tekrar et</button></div>
          <p class="soluk" style="color:#dfe9e3;margin:8px 0 0">“Dinle ve tekrar et”te hafız her âyeti okur, sonra sizin tekrar etmeniz için bekler.</p></div>
        ${e.html}
        ${s !== 1 && s !== 9 ? '<div class="besmele">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ</div>' : ''}
        ${sure.v.map((v, i) => `<div class="ayet" id="a${i + 1}" data-a="${i + 1}"><div class="ayet-ust"><span class="no">${i + 1}</span><span class="bosluk"></span><button data-oyna="${i + 1}" aria-label="Dinle">▶</button></div>
          <div class="ar">${esc(v[0])}</div>${okn[i] ? `<div class="okunus">${gizle(okn[i], sev)}</div>` : ''}<div class="meal soluk">${esc(v[1])}</div></div>`).join('')}
        ${e.alt}`;
      e.bagla();
      const l = (bas = 1) => { const x = []; for (let a = bas; a <= sure.v.length; a++) x.push([s, a]); return ayetListesi(x, 'muallim', bas === 1); };
      const isaretle = a => { m.querySelectorAll('.ayet.caliyor').forEach(el => el.classList.remove('caliyor')); const el = $('#a' + a, m); if (el) { el.classList.add('caliyor'); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } };
      const o = { parca: (i, x) => x.a && isaretle(x.a), bitti: () => m.querySelectorAll('.ayet.caliyor').forEach(el => el.classList.remove('caliyor')) };
      $('#s-dinle').onclick = () => Calar.baslat(l(), o);
      $('#s-tekrar').onclick = () => Calar.baslat(l(), { ...o, araVer: true });
      m.querySelectorAll('[data-oyna]').forEach(b => b.onclick = () => Calar.baslat(ayetListesi([[s, +b.dataset.oyna]], 'muallim', false), o));
    };
    temizlik.push(() => Calar.durdur()); ciz();
  });
}
function sKuranOgren(m) {
  sureAdlariYukle().then(K => {
    m.innerHTML = `<div class="kart"><h2>Nasıl çalışalım?</h2><ol class="madde"><li>Önce <b>Elif-Bâ</b> ile harfleri ve harekeleri öğren.</li><li>Kısa sûrelerden birini seç, hafızı (Husarî, öğretici kıraat) dinle.</li><li><b>Dinle ve tekrar et</b>e bas: her âyetten sonra sen tekrar et.</li><li>Okunuşu gizleyerek kendini dene, ezberleyince işaretle.</li></ol>
      <button class="btn tam" id="ko-elifba">ا Elif-Bâ'ya git</button></div>
      <div class="kategori-baslik">Kısa sûrelerle başla</div>
      <div class="liste">${NAMAZ_SURELERI.map(s => `<button data-s="${s}"><span class="no">${s}</span><span class="orta"><b>${esc(K[s - 1].ad)}</b><span class="soluk">${K[s - 1].v.length} âyet · okunuşlu</span></span><span class="soluk">›</span></button>`).join('')}</div>
      <div class="kategori-baslik">Bütün Kur'an</div>
      <div class="kart"><p style="margin:0">Kur'an sekmesinde her sûreyi açıp <b>▶ Dinle</b> ile hafızdan dinleyebilir, “Tekrar için bekle” ile âyet âyet tekrar edebilirsin.</p><button class="btn tam" id="ko-kuran">Kur'an-ı Kerîm'i aç</button></div>`;
    $('#ko-elifba').onclick = () => sayfa(sElifba, 'Elif-Bâ');
    $('#ko-kuran').onclick = () => sekme('kuran');
    m.querySelector('.liste').onclick = e => { const b = e.target.closest('button[data-s]'); if (b) sayfa(mm => sSureOgren(mm, +b.dataset.s), K[b.dataset.s - 1].ad); };
  });
}

// ---------- Elif-Bâ ----------
function sElifba(m) {
  let sek = oku('elifbaSekme', 'harf'), hareke = 0;
  const harfSes = (i, tip) => { const h = ELIFBA[i], b = i === 0 ? ['أَ', 'إِ', 'أُ'] : ['َ', 'ِ', 'ُ'].map(x => h[0] + x);
    const ad = tip === 'ad' ? 'h' + i : 'h' + i + ['e', 'i', 'u'][tip]; sesCal(ad, tip === 'ad' ? h[3] : b[tip]); };
  const ciz = () => {
    const ogrenilen = new Set(oku('harfler', []));
    let ic = '';
    if (sek === 'harf') {
      ic = `<p class="soluk" style="margin-top:0">Harfe dokun, adını dinle. Arapça sağdan sola okunur. Öğrendiğin harfler yeşil olur (${ogrenilen.size}/28).</p>
        <div class="harf-izgara">${ELIFBA.map((h, i) => `<button class="harf ${ogrenilen.has(i) ? 'ok' : ''}" data-h="${i}"><span class="ar">${h[0]}</span><b>${h[1]}</b></button>`).join('')}</div>`;
    } else if (sek === 'hareke') {
      const [ad, isr, ack] = HAREKELER[hareke];
      ic = `<div class="okuyucu-ayar">${HAREKELER.map((x, i) => `<button class="cip ${i === hareke ? 'acik' : ''}" data-hr="${i}">${x[0]}</button>`).join('')}</div>
        <p class="soluk" style="margin-top:0">${esc(ack)}</p>
        <div class="harf-izgara">${ELIFBA.map((h, i) => `<button class="harf" data-hs="${i}"><span class="ar">${i === 0 ? ['أَ', 'إِ', 'أُ'][hareke] : h[0] + isr}</span><b>${h[4 + hareke]}</b></button>`).join('')}</div>
        <button class="btn tam" id="hepsi">▶ Hepsini sırayla dinle</button>`;
    } else {
      ic = ELIFBA_DERSLER.map((d, i) => `<div class="kart"><h2>${esc(d[0])}</h2><p style="margin-top:0">${esc(d[1])}</p>
        <div class="harf-izgara genis">${d[2].map((x, j) => `<button class="harf" data-ders="${i}_${j}" data-metin="${esc(x[0])}"><span class="ar">${esc(x[0])}</span><b>${esc(x[1])}</b></button>`).join('')}</div></div>`).join('')
        + `<button class="btn ana tam" id="okumaya">📖 Kısa sûrelerle okumaya geç</button>`;
    }
    m.innerHTML = `<div class="sekme-cip">${[['harf', 'Harfler'], ['hareke', 'Harekeler'], ['ders', 'Dersler']].map(([k, a]) => `<button class="cip ${sek === k ? 'acik' : ''}" data-sk="${k}">${a}</button>`).join('')}</div>${ic}<div id="harf-detay"></div>`;
    m.querySelectorAll('[data-sk]').forEach(b => b.onclick = () => { sek = b.dataset.sk; yaz('elifbaSekme', sek); ciz(); });
    m.querySelectorAll('[data-hr]').forEach(b => b.onclick = () => { hareke = +b.dataset.hr; ciz(); });
    m.querySelectorAll('[data-h]').forEach(b => b.onclick = () => { harfSes(+b.dataset.h, 'ad'); detay(+b.dataset.h); });
    m.querySelectorAll('[data-hs]').forEach(b => b.onclick = () => harfSes(+b.dataset.hs, hareke));
    m.querySelectorAll('[data-ders]').forEach(b => b.onclick = () => sesCal('d' + b.dataset.ders, b.dataset.metin));
    const hp = $('#hepsi'); if (hp) hp.onclick = () => yerelSesler().then(s => Calar.baslat(ELIFBA.map((h, i) => { const ad = 'h' + i + ['e', 'i', 'u'][hareke]; return s.has(ad) ? { url: 'ses/' + ad + '.mp3', i } : { tts: i === 0 ? ['أَ', 'إِ', 'أُ'][hareke] : h[0] + HAREKELER[hareke][1], i }; }),
      { parca: (k) => { m.querySelectorAll('.harf.caliyor').forEach(e => e.classList.remove('caliyor')); const el = m.querySelector(`[data-hs="${k}"]`); if (el) el.classList.add('caliyor'); }, bitti: () => m.querySelectorAll('.harf.caliyor').forEach(e => e.classList.remove('caliyor')) }));
    const ok = $('#okumaya'); if (ok) ok.onclick = () => sayfa(sKuranOgren, 'Kur\'an Okumayı Öğren');
  };
  const detay = i => {
    const h = ELIFBA[i], sk = ELIFBA_SEKIL[h[0]], ogr = new Set(oku('harfler', []));
    const el = $('#harf-detay');
    el.innerHTML = `<div class="kart harf-detay"><button class="c-kapat" id="hd-kapat">✕</button>
      <div class="ar harf-dev">${h[0]}</div><h3>${h[1]}</h3><p class="soluk" style="margin:0 0 10px">${esc(h[2])}</p>
      <div class="sekil">${[['Sonda', sk[2]], ['Ortada', sk[1]], ['Başta', sk[0]], ['Tek', h[0]]].map(([a, x]) => `<div><span class="ar">${x}</span><small>${a}</small></div>`).join('')}</div>
      <div class="sekil">${[0, 1, 2].map(k => `<button data-hk="${k}"><span class="ar">${i === 0 ? ['أَ', 'إِ', 'أُ'][k] : h[0] + HAREKELER[k][1]}</span><small>${h[4 + k]}</small></button>`).join('')}</div>
      <button class="btn ${ogr.has(i) ? '' : 'ana'} tam" id="hd-ok">${ogr.has(i) ? '✓ Öğrendim' : 'Bu harfi öğrendim'}</button></div>`;
    $('#hd-kapat').onclick = () => { el.innerHTML = ''; };
    el.querySelectorAll('[data-hk]').forEach(b => b.onclick = () => harfSes(i, +b.dataset.hk));
    $('#hd-ok').onclick = () => { const s = new Set(oku('harfler', [])); if (s.has(i)) s.delete(i); else { s.add(i); titres(); } yaz('harfler', [...s]); ciz(); detay(i); };
  };
  temizlik.push(() => Calar.durdur()); ciz();
}

// =====================================================================
// KAZA TAKVİMİ
// =====================================================================
const KAZA_VAKIT = ['Sabah', 'Öğle', 'İkindi', 'Akşam', 'Yatsı', 'Vitir'];
function kazaVeri() { return oku('kaza', null); }
function kazaKaydet(k) { yaz('kaza', k); }
function gunEkle(t, n) { const [y, mo, d] = t.split('-').map(Number), x = new Date(y, mo - 1, d + n); return ymd(x); }
// Takip edilen günlerde kılınmayan vakitler (bugün hariç)
function kazaListesi(k) {
  const l = [], bugun = ymd(new Date());
  for (let t = k.bas; t < bugun; t = gunEkle(t, 1)) {
    const [kil, ode] = k.gun[t] || [0, 0];
    for (let v = 0; v < 6; v++) if (!(kil >> v & 1)) l.push({ t, v, odendi: !!(ode >> v & 1) });
  }
  return l;
}
function sKaza(m) {
  let k = kazaVeri(), ay = new Date(); ay.setDate(1); let secili = ymd(new Date()), hepsi = false;
  if (!k) {
    m.innerHTML = `<div class="kart"><h2>Kaza Takvimi</h2>
      <p>Her gün kıldığın namazları işaretle. İşaretlenmeyen vakitler kaza listene düşer; kazasını kıldığında üzerine dokun, üstü çizilsin.</p>
      <p class="soluk">Geçmiş yıllardan kalan borçlarını da ayrıca sayaçla takip edebilirsin.</p>
      <label class="soluk" for="kz-bas">Takibe başlama tarihi</label><input type="date" id="kz-bas" class="sec" value="${ymd(new Date())}" max="${ymd(new Date())}">
      <button class="btn ana tam" id="kz-basla">Takibe başla</button></div>
      <p class="soluk">“Kim bir namazı unutursa hatırladığında onu kılsın.” (Buhârî, Mevâkît; Müslim, Mesâcid)</p>`;
    $('#kz-basla').onclick = () => { kazaKaydet({ bas: $('#kz-bas').value || ymd(new Date()), gun: {}, eski: [0, 0, 0, 0, 0, 0], eskiOd: [0, 0, 0, 0, 0, 0] }); sKaza(m); };
    return;
  }
  const ciz = () => {
    k = kazaVeri(); const bugun = ymd(new Date()), liste = kazaListesi(k);
    const kalan = liste.filter(x => !x.odendi).length, odenen = liste.filter(x => x.odendi).length;
    const eskiKalan = k.eski.reduce((a, x, i) => a + Math.max(0, x - k.eskiOd[i]), 0), eskiOd = k.eskiOd.reduce((a, x) => a + x, 0);
    const [kil] = k.gun[secili] || [0, 0];
    // takvim
    const y = ay.getFullYear(), mo = ay.getMonth(), ilkGun = (new Date(y, mo, 1).getDay() + 6) % 7, gs = new Date(y, mo + 1, 0).getDate();
    let tk = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map(x => `<b>${x}</b>`).join('') + '<span></span>'.repeat(ilkGun);
    for (let d = 1; d <= gs; d++) {
      const t = ymd(new Date(y, mo, d)), [kl] = k.gun[t] || [0], sayi = [0, 1, 2, 3, 4, 5].filter(v => kl >> v & 1).length;
      const durum = t > bugun || t < k.bas ? 'bos' : sayi === 6 ? 'tam' : t === bugun ? 'bugun' : sayi ? 'yarim' : 'eksik';
      tk += `<button class="gun ${durum} ${t === secili ? 'secili' : ''}" data-t="${t}" ${t > bugun || t < k.bas ? 'disabled' : ''}>${d}${durum !== 'bos' && durum !== 'tam' && t !== bugun ? `<i>${6 - sayi}</i>` : ''}</button>`;
    }
    const gorunen = liste.slice().sort((a, b) => b.t.localeCompare(a.t) || a.v - b.v), sinir = hepsi ? 2000 : 40;
    let gruplar = '', son = '';
    gorunen.slice(0, sinir).forEach(x => { if (x.t !== son) { gruplar += `${son ? '</div>' : ''}<div class="kaza-gun"><span class="soluk">${esc(tarihYaz(x.t, { day: 'numeric', month: 'long', weekday: 'short' }))}</span>`; son = x.t; }
      gruplar += `<button class="kaza-cip ${x.odendi ? 'odendi' : ''}" data-kt="${x.t}" data-kv="${x.v}">${KAZA_VAKIT[x.v]}</button>`; });
    if (son) gruplar += '</div>';
    m.innerHTML = `<div class="kart vakit-kart kaza-ozet"><div><b>${kalan + eskiKalan}</b><span>kalan kaza</span></div><div><b>${odenen + eskiOd}</b><span>kılınan kaza</span></div></div>
      <div class="kart"><h2>${secili === bugun ? 'Bugün kıldıklarım' : esc(tarihYaz(secili, { day: 'numeric', month: 'long', weekday: 'long' }))}</h2>
        <div class="vakit-cipler">${KAZA_VAKIT.map((v, i) => `<button class="kil ${kil >> i & 1 ? 'acik' : ''}" data-v="${i}">${kil >> i & 1 ? '✓ ' : ''}${v}</button>`).join('')}</div>
        <p class="soluk" style="margin:8px 0 0">Kıldığın vakte dokun. ${secili === bugun ? 'Gün bitince işaretlenmeyenler kaza listesine geçer.' : ''}</p></div>
      <div class="kart"><div class="takvim-ust"><button id="ay-geri">‹</button><b>${ay.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</b><button id="ay-ileri">›</button></div>
        <div class="takvim">${tk}</div>
        <div class="takvim-acik soluk"><span><i class="r tam"></i>Tamam</span><span><i class="r yarim"></i>Eksik var</span><span><i class="r eksik"></i>Hiç işaretlenmedi</span></div></div>
      <div class="kategori-baslik">Kaza listem (${kalan} kalan)</div>
      ${liste.length ? `<div class="kart"><p class="soluk" style="margin-top:0">Kazasını kıldığın namaza dokun, üstü çizilsin.</p>${gruplar}${gorunen.length > sinir ? '<button class="btn tam" id="kz-hepsi">Tümünü göster</button>' : ''}</div>` : `<div class="kart"><p style="margin:0" class="soluk">Takip başladığından beri kaza yok. Allah kabul etsin.</p></div>`}
      <div class="kategori-baslik">Eski borçlarım</div>
      <div class="kart"><p class="soluk" style="margin-top:0">Ergenlik çağından beri kılınmamış namazlarını tahmin ederek gir; kıldıkça azalt.</p>
        ${KAZA_VAKIT.map((v, i) => `<div class="ayar-satir eski-satir"><span><b>${v}</b><br><span class="soluk">${Math.max(0, k.eski[i] - k.eskiOd[i])} kalan · ${k.eskiOd[i]} kılındı</span></span>
          <span><button class="cip" data-ee="${i}" data-x="-1">−</button><button class="cip" data-ee="${i}" data-x="1">+</button><button class="cip acik" data-eo="${i}">Kıldım</button></span></div>`).join('')}
        <div class="yil-ekle"><input type="number" id="kz-yil" min="1" max="80" placeholder="Yıl" class="sec"><button class="btn" id="kz-yil-ekle">Her vakte yıl × 365 ekle</button></div></div>
      <details class="kart"><summary>Takip ayarları</summary><label class="soluk" for="kz-bas2">Takip başlangıcı</label><input type="date" id="kz-bas2" class="sec" value="${k.bas}" max="${bugun}">
        <button class="btn tam" id="kz-sifirla">Kaza takvimini sıfırla</button></details>`;
    m.querySelectorAll('.kil').forEach(b => b.onclick = () => { const x = k.gun[secili] || [0, 0]; x[0] ^= 1 << +b.dataset.v; k.gun[secili] = x; kazaKaydet(k); titres(); ciz(); });
    m.querySelectorAll('.gun[data-t]').forEach(b => b.onclick = () => { secili = b.dataset.t; ciz(); });
    $('#ay-geri').onclick = () => { ay.setMonth(ay.getMonth() - 1); ciz(); };
    $('#ay-ileri').onclick = () => { ay.setMonth(ay.getMonth() + 1); ciz(); };
    m.querySelectorAll('.kaza-cip').forEach(b => b.onclick = () => { const t = b.dataset.kt, v = +b.dataset.kv, x = k.gun[t] || [0, 0]; x[1] ^= 1 << v; k.gun[t] = x; kazaKaydet(k);
      if (x[1] >> v & 1) { titres(); toast('Allah kabul etsin 🤲'); } const st = m.scrollTop; ciz(); m.scrollTop = st; });
    const hb = $('#kz-hepsi'); if (hb) hb.onclick = () => { hepsi = true; const st = m.scrollTop; ciz(); m.scrollTop = st; };
    m.querySelectorAll('[data-ee]').forEach(b => b.onclick = () => { const i = +b.dataset.ee; k.eski[i] = Math.max(k.eskiOd[i], k.eski[i] + +b.dataset.x); kazaKaydet(k); const st = m.scrollTop; ciz(); m.scrollTop = st; });
    m.querySelectorAll('[data-eo]').forEach(b => b.onclick = () => { const i = +b.dataset.eo; if (k.eskiOd[i] >= k.eski[i]) { toast('Bu vakitte kalan eski borç yok'); return; } k.eskiOd[i]++; kazaKaydet(k); titres(); toast(`${KAZA_VAKIT[i]} kazası kılındı. Allah kabul etsin.`); const st = m.scrollTop; ciz(); m.scrollTop = st; });
    $('#kz-yil-ekle').onclick = () => { const y2 = Math.round(+$('#kz-yil').value); if (!(y2 > 0 && y2 <= 80)) { toast('1 ile 80 arasında yıl yazın'); return; } k.eski = k.eski.map(x => x + y2 * 365); kazaKaydet(k); toast(`Her vakte ${y2 * 365} eklendi`); ciz(); };
    $('#kz-bas2').onchange = e => { if (e.target.value) { k.bas = e.target.value; kazaKaydet(k); ciz(); } };
    $('#kz-sifirla').onclick = () => { if (confirm('Kaza takvimindeki tüm kayıtlar silinsin mi?')) { yaz('kaza', null); sKaza(m); } };
  };
  ciz();
}

// =====================================================================
// YAKINDAKİ CAMİLER (OpenStreetMap)
// =====================================================================
function haritaLinki(lat, lng, ad) {
  if (PLATFORM === 'ios') return `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=w&q=${encodeURIComponent(ad || 'Cami')}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
}
function disLink(url) { const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); }
async function camiAra(lat, lng, r) {
  const q = `[out:json][timeout:25];(node["amenity"="place_of_worship"]["religion"="muslim"](around:${r},${lat},${lng});way["amenity"="place_of_worship"]["religion"="muslim"](around:${r},${lat},${lng}););out center 80;`;
  for (const u of ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']) {
    try {
      const res = await fetch(u, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      if (!res.ok) continue; const j = await res.json();
      return j.elements.map(e => ({ ad: (e.tags && (e.tags['name:tr'] || e.tags.name)) || 'Cami', lat: e.lat || (e.center && e.center.lat), lng: e.lon || (e.center && e.center.lon) }))
        .filter(x => x.lat).map(x => ({ ...x, d: mesafe(lat, lng, x.lat, x.lng), y: yon(lat, lng, x.lat, x.lng) })).sort((a, b) => a.d - b.d);
    } catch (e) {}
  }
  throw new Error('baglanti');
}
function yon(a, b, c, d) { const r = Math.PI / 180, y = Math.sin((d - b) * r) * Math.cos(c * r), x = Math.cos(a * r) * Math.sin(c * r) - Math.sin(a * r) * Math.cos(c * r) * Math.cos((d - b) * r); return (Math.atan2(y, x) / r + 360) % 360; }
function mesafeYaz(km) { return km < 1 ? Math.round(km * 1000 / 10) * 10 + ' m' : km.toFixed(1).replace('.', ',') + ' km'; }
function sCamiler(m) {
  const bul = () => {
    m.innerHTML = `<div class="kart" style="text-align:center"><div class="yukleniyor"></div><p>Konumunuz alınıyor…</p></div>`;
    if (!navigator.geolocation) { hata('Bu cihazda konum alınamıyor.'); return; }
    navigator.geolocation.getCurrentPosition(async p => {
      // Gizlilik: konum yaklaşık 100 m'ye yuvarlanarak sorgulanır
      const lat = Math.round(p.coords.latitude * 1000) / 1000, lng = Math.round(p.coords.longitude * 1000) / 1000;
      m.innerHTML = `<div class="kart" style="text-align:center"><div class="yukleniyor"></div><p>Yakındaki camiler aranıyor…</p></div>`;
      try {
        let l = await camiAra(lat, lng, 2500), r = 2.5;
        if (l.length < 4) { l = await camiAra(lat, lng, 7000); r = 7; }
        goster(lat, lng, l, r);
      } catch (e) { hata('Camiler yüklenemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.', lat, lng); }
    }, () => hata('Konum izni verilmedi. Telefon ayarlarından Üç Nur için konum iznini açabilirsiniz.'), { timeout: 20000, maximumAge: 120000, enableHighAccuracy: true });
  };
  const hata = (msj, lat, lng) => {
    m.innerHTML = `<div class="kart"><p style="margin-top:0">${esc(msj)}</p><button class="btn ana tam" id="cm-tekrar">Tekrar dene</button>${lat ? '<button class="btn tam" id="cm-harita">Haritada camileri göster</button>' : ''}</div>`;
    $('#cm-tekrar').onclick = bul; const h = $('#cm-harita'); if (h) h.onclick = () => disLink(haritaAra(lat, lng));
  };
  const haritaAra = (lat, lng) => PLATFORM === 'ios' ? `https://maps.apple.com/?q=cami&sll=${lat},${lng}&z=15` : `https://www.google.com/maps/search/cami/@${lat},${lng},15z`;
  const goster = (lat, lng, l, r) => {
    const R = 120, nokta = l.filter(x => x.d <= r).map(x => { const o = Math.min(1, x.d / r) * (R - 10), a = x.y * Math.PI / 180; return `<circle cx="${(R + Math.sin(a) * o).toFixed(1)}" cy="${(R - Math.cos(a) * o).toFixed(1)}" r="5" class="rd-cami"/>`; }).join('');
    m.innerHTML = `<div class="kart radar-kart"><svg viewBox="0 0 ${2 * R} ${2 * R}" class="radar"><circle cx="${R}" cy="${R}" r="${R - 2}" class="rd-h"/><circle cx="${R}" cy="${R}" r="${(R - 2) / 2}" class="rd-h"/>
        <text x="${R}" y="16" text-anchor="middle" class="rd-k">K</text>${nokta}<circle cx="${R}" cy="${R}" r="7" class="rd-ben"/></svg>
        <p class="soluk" style="margin:4px 0 0;text-align:center">Siz ortadasınız · çember ${String(r).replace('.', ',')} km · kuzey yukarıda</p></div>
      ${l.length ? `<div class="liste">${l.slice(0, 40).map((x, i) => `<button data-i="${i}"><span class="no">🕌</span><span class="orta"><b>${esc(x.ad)}</b><span class="soluk">${mesafeYaz(x.d)} · ${['kuzey', 'kuzeydoğu', 'doğu', 'güneydoğu', 'güney', 'güneybatı', 'batı', 'kuzeybatı'][Math.round(x.y / 45) % 8]}</span></span><span class="yol">Yol tarifi ›</span></button>`).join('')}</div>`
        : '<div class="kart"><p style="margin:0">Yakınınızda kayıtlı cami bulunamadı.</p></div>'}
      <button class="btn tam" id="cm-harita">🗺️ Haritada tüm camileri göster</button><button class="btn tam" id="cm-yenile">↻ Yenile</button>
      <p class="soluk">Cami bilgileri OpenStreetMap gönüllülerinden gelir; bazı camiler eksik olabilir. © OpenStreetMap katkıcıları</p>`;
    m.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { const x = l[+b.dataset.i]; disLink(haritaLinki(x.lat, x.lng, x.ad)); });
    $('#cm-harita').onclick = () => disLink(haritaAra(lat, lng));
    $('#cm-yenile').onclick = bul;
  };
  bul();
}

// =====================================================================
// CUMA GECESİ (Perşembe akşamı Yâsîn, Tebâreke, Amme, Cuma)
// =====================================================================
function haftaAnahtari(d = new Date()) {
  // Perşembe akşamından sonraki cuma gününe göre: hafta = o cumanın tarihi
  const x = new Date(d); const gun = x.getDay(); let fark = (5 - gun + 7) % 7;
  if (gun === 5) fark = 0; else if (gun === 6) fark = 6;
  x.setDate(x.getDate() + fark); return ymd(x);
}
function cumaOkundu(s) { const hk = haftaAnahtari(), o = new Set(oku('cumaOkunan.' + hk, [])); o.add(s); yaz('cumaOkunan.' + hk, [...o]); }
function cumaGecesiMi(d = new Date()) {
  const g = d.getDay(); if (g === 5) return 'cuma';
  if (g === 4) { const ak = gunVakitleri(d).v[4]; return d >= ak ? 'gece' : 'persembe'; }
  return null;
}
function sCumaGecesi(m) {
  kuran().then(K => {
    const hk = haftaAnahtari(), okunan = new Set(oku('cumaOkunan.' + hk, [])), dg = cumaGecesiMi();
    m.innerHTML = `<div class="kart vakit-kart cuma-kart"><h2>${dg === 'gece' ? 'Bu gece Cuma gecesi' : dg === 'persembe' ? 'Bu akşam Cuma gecesi' : dg === 'cuma' ? 'Hayırlı Cumalar' : 'Perşembe akşamı buluşuyoruz'}</h2>
        <p style="margin:0">Her perşembe akşamı Yâsîn, Tebâreke, Amme ve Cuma sûrelerini birlikte okuyalım. Okuyamayan dinlesin; sevabını geçmişlerimizin ruhuna hediye edelim.</p>
        <div class="ilerleme" style="margin-top:12px"><i style="width:${okunan.size / CUMA_SURELERI.length * 100}%"></i></div>
        <p style="margin:6px 0 0;color:#dfe9e3;font-size:13px">Bu hafta ${okunan.size} / ${CUMA_SURELERI.length} sûre</p></div>
      <button class="btn ana tam" id="cg-hepsi" style="margin-bottom:12px">▶ Dördünü sırayla dinle</button>
      <div class="liste">${CUMA_SURELERI.map(([s, ad]) => `<div class="cuma-satir"><button class="tik ${okunan.has(s) ? 'acik' : ''}" data-tik="${s}" aria-label="Okudum">${okunan.has(s) ? '✓' : ''}</button>
        <span class="orta"><b>${esc(ad)}</b><span class="soluk">${K[s - 1].v.length} âyet</span></span>
        <button class="cip" data-dinle="${s}">▶ Dinle</button><button class="cip acik" data-oku="${s}">Oku</button></div>`).join('')}</div>
      <p class="soluk">Sûreyi açınca okurken hafızı da dinleyebilirsiniz. Okuduğunuz sûreyi işaretleyin; işaretler her hafta yenilenir.</p>
      <div class="kart"><h2>Hatırlatma</h2><div class="ayar-satir"><span>Perşembe akşamı bildirim gönder</span><button class="anahtar ${oku('cumaBildirim', true) ? 'acik' : ''}" id="cg-bil"></button></div></div>`;
    m.querySelectorAll('[data-tik]').forEach(b => b.onclick = () => { const s = +b.dataset.tik, o = new Set(oku('cumaOkunan.' + hk, [])); if (o.has(s)) o.delete(s); else { o.add(s); titres(); } yaz('cumaOkunan.' + hk, [...o]); sCumaGecesi(m); });
    m.querySelectorAll('[data-oku]').forEach(b => b.onclick = () => { const s = +b.dataset.oku; sayfa(mm => sOku(mm, s, 1, { cuma: true }), K[s - 1].ad); });
    m.querySelectorAll('[data-dinle]').forEach(b => b.onclick = () => { const s = +b.dataset.dinle; sayfa(mm => sOku(mm, s, 1, { cuma: true, dinle: true }), K[s - 1].ad); });
    $('#cg-hepsi').onclick = () => { const s = CUMA_SURELERI[0][0]; sayfa(mm => sOku(mm, s, 1, { cuma: true, dinle: true, zincir: true }), K[s - 1].ad); };
    $('#cg-bil').onclick = async () => { const a = !oku('cumaBildirim', true); if (a && !(await bildirimIzni())) { toast('Bildirim izni verilmedi'); return; } yaz('cumaBildirim', a); bildirimPlanla(); sCumaGecesi(m); toast(a ? 'Perşembe akşamları hatırlatılacak' : 'Hatırlatma kapatıldı'); };
  });
}

// =====================================================================
// ÖLÜMÜ HATIRLA · KABİR SUALLERİ
// =====================================================================
function sKabir(m) {
  const gn = gunNo(), [soz, kay] = OLUM_HATIRLA[gn % OLUM_HATIRLA.length];
  const ciz = () => {
    const ez = new Set(oku('ezber', [])), gizli = oku('kabirGizle', false);
    m.innerHTML = `<div class="kart olum-kart"><div class="olum-ikon">🌿</div><p class="olum-soz">“${esc(soz)}”</p><div class="kaynak" style="text-align:center">${esc(kay)}</div></div>
      <div class="kart"><h2>Kabirde sorulacak sorular</h2>
        <p style="margin-top:0">Peygamber Efendimiz (s.a.v.), kabirde iki meleğin kula “Rabbin kim? Dinin ne? Peygamberin kim?” diye soracağını haber vermiştir (Ebû Dâvûd, Sünnet). Mümin bu sorulara dosdoğru cevap verir.</p>
        <p class="soluk" style="margin:0">Bu cevaplar yalnız ezberle değil, bir ömür boyu yaşanan imanla verilir. Nasıl yaşarsak öyle ölür, nasıl ölürsek öyle diriliriz. Bugün öğrenelim, her gün yaşayalım.</p></div>
      <div class="ezber-ayar"><button class="cip ${gizli ? '' : 'acik'}" id="kb-ac">Cevapları göster</button><button class="cip ${gizli ? 'acik' : ''}" id="kb-gizle">Kendimi deneyeyim</button></div>
      ${KABIR.map((k, i) => `${i === 3 ? '<div class="kategori-baslik">İlmihallerde ayrıca öğretilenler</div>' : ''}<div class="kart kabir-kart">
        <div class="soru"><span class="ar">${esc(k.s)}</span><div><b>${esc(k.st)}</b><span class="soluk">${esc(k.so)}</span></div></div>
        <div class="cevap ${gizli ? 'kapali' : ''}" data-c="${i}"><span class="ar">${esc(k.c)}</span><div><b>${esc(k.ct)}</b><span class="soluk">${esc(k.co)}</span></div></div>
        <button class="cip dinle" data-dosya="kabir${i}" data-metin="${esc(k.s + ' ' + k.c)}">▶ Dinle</button></div>`).join('')}
      <div class="kart"><h2>Âyet</h2><p style="margin:0">“Allah, iman edenleri dünya hayatında da ahirette de sağlam söz üzere sabit kılar.”</p><div class="kaynak">İbrâhîm, 27 · Peygamberimiz bu âyetin kabirde sorgu hakkında indiğini bildirmiştir (Buhârî, Cenâiz).</div></div>
      <button class="btn tam ${ez.has('kabir') ? '' : 'ana'}" id="kb-ez">${ez.has('kabir') ? '✓ Ezberledim (geri al)' : 'Ezberledim ✓'}</button>
      <div class="kart dua-kart" style="margin-top:12px"><p style="margin:0">Allah’ım! Bizi Müslüman olarak yaşat, Müslüman olarak vefat ettir ve salih kullarının arasına kat. Âmin.</p></div>`;
    $('#kb-ac').onclick = () => { yaz('kabirGizle', false); ciz(); };
    $('#kb-gizle').onclick = () => { yaz('kabirGizle', true); ciz(); };
    m.querySelectorAll('.cevap.kapali').forEach(c => c.onclick = () => c.classList.remove('kapali'));
    $('#kb-ez').onclick = () => { const s = new Set(oku('ezber', [])); if (s.has('kabir')) s.delete('kabir'); else { s.add('kabir'); titres('HEAVY'); toast('Allah son nefeste bu cevapları kolaylaştırsın. Âmin.', 3500); } yaz('ezber', [...s]); ciz(); };
  };
  dinleBagla(m); ciz();
}
