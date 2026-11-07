/* Üç Nur — ek özellikler 2: iyilik defteri, bildirim sesleri ve hatırlatmalar, zekât, kıssalar,
   ilmihal, hatim halkası (Firebase), sayfa sayfa Mushaf. app.js'den önce yüklenir; app.js'deki
   yardımcıları (oku, yaz, $, esc, sayfa, toast...) yalnızca çağrıldıkları anda kullanır. */
'use strict';

// Hatim halkası için Firebase (Firestore + anonim giriş). Boşsa hatim sayfası "hazırlanıyor" der.
const FIREBASE = window.FIREBASE_AYAR || { apiKey: '', projectId: '' };

const arRakam = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const tlYaz = x => (Math.round(x * 100) / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';
function paylas(metin, baslik) {
  if (navigator.share) { navigator.share({ title: baslik || 'Üç Nur', text: metin }).catch(() => {}); return; }
  try { navigator.clipboard.writeText(metin).then(() => toast('Kopyalandı')); } catch (e) { toast('Kopyalanamadı'); }
}
// Basit alt pencere (prompt yerine): {baslik, aciklama, deger, yer, tamam} → Promise<string|null>
function sor(o) {
  return new Promise(son => {
    const k = document.createElement('div'); k.className = 'sor-zemin';
    k.innerHTML = `<div class="sor-kutu"><b>${esc(o.baslik)}</b>${o.aciklama ? `<p class="soluk">${esc(o.aciklama)}</p>` : ''}
      <input class="giris" id="sor-in" value="${esc(o.deger || '')}" placeholder="${esc(o.yer || '')}" maxlength="${o.uzunluk || 40}" autocomplete="off">
      <div class="sor-alt"><button class="btn" id="sor-iptal">Vazgeç</button><button class="btn ana" id="sor-tamam">${esc(o.tamam || 'Tamam')}</button></div></div>`;
    document.body.appendChild(k);
    const inp = k.querySelector('#sor-in'), bitir = v => { k.remove(); son(v); };
    setTimeout(() => inp.focus(), 50);
    k.querySelector('#sor-iptal').onclick = () => bitir(null);
    k.querySelector('#sor-tamam').onclick = () => bitir(inp.value.trim());
    inp.onkeydown = e => { if (e.key === 'Enter') bitir(inp.value.trim()); };
    k.onclick = e => { if (e.target === k) bitir(null); };
    temizlik.push(() => k.isConnected && bitir(null));
  });
}
// Sayfa değiştiyse geç gelen (ağdan) sonuçlar ekrana yazılmasın
function bekci() { const t = yigin[yigin.length - 1]; return () => yigin[yigin.length - 1] === t; }
// Metin biçimi: "• " madde, "1. " sıralı madde, diğerleri paragraf
function metinHtml(t) {
  let h = '', liste = null;
  const kapat = () => { if (liste) { h += `</${liste}>`; liste = null; } };
  t.split('\n').forEach(s => {
    const m1 = s.match(/^• (.*)/), m2 = s.match(/^(\d+)\. (.*)/);
    if (m1 || m2) { const tur = m1 ? 'ul' : 'ol'; if (liste !== tur) { kapat(); h += m2 && m2[1] !== '1' ? `<ol start="${m2[1]}">` : `<${tur}>`; liste = tur; } h += `<li>${esc(m1 ? m1[1] : m2[2])}</li>`; }
    else { kapat(); h += `<p>${esc(s)}</p>`; }
  });
  kapat(); return h;
}

// =====================================================================
// BİLDİRİM SESLERİ, KANALLAR VE EK HATIRLATMALAR
// =====================================================================
const BILDIRIM_SESLERI = {
  ezan: ['Kısa ezan', 'ezan_kisa.wav'],
  zil: ['Nur zili (yumuşak)', 'nur_zil.wav'],
  varsayilan: ['Telefonun bildirim sesi', null],
  sessiz: ['Sessiz (yalnızca yazı)', 'sessiz.wav'],
};
function ezanSesi() { const k = oku('ezanSesi', 'ezan'); return BILDIRIM_SESLERI[k] ? k : 'ezan'; }
function vakitSesi() {
  const k = ezanSesi(), d = BILDIRIM_SESLERI[k][1];
  return PLATFORM === 'android' ? { channelId: 'vakit-' + k } : d ? { sound: d } : {};
}
function genelKanal() { return PLATFORM === 'android' ? { channelId: 'genel' } : {}; }
let kanallarKuruldu = false;
async function kanallariKur(LN) {
  if (kanallarKuruldu || PLATFORM !== 'android' || !LN || !LN.createChannel) return;
  const k = [
    { id: 'vakit-ezan', name: 'Namaz vakitleri · kısa ezan', sound: 'ezan_kisa.wav', importance: 4 },
    { id: 'vakit-zil', name: 'Namaz vakitleri · nur zili', sound: 'nur_zil.wav', importance: 4 },
    { id: 'vakit-varsayilan', name: 'Namaz vakitleri · varsayılan ses', importance: 4 },
    { id: 'vakit-sessiz', name: 'Namaz vakitleri · sessiz', importance: 2 },
    { id: 'genel', name: 'Hatırlatmalar (hadis, cuma, hatim, iyilik)', importance: 4 },
  ];
  for (const c of k) try { await LN.createChannel({ description: c.name, visibility: 1, vibration: c.importance > 2, ...c }); } catch (e) {}
  kanallarKuruldu = true;
}
let onizleme = null;
function sesOnizle(k) {
  const d = BILDIRIM_SESLERI[k][1];
  if (!d || k === 'sessiz') { toast(k === 'sessiz' ? 'Bildirim sessiz gelir, yalnızca yazı görünür' : 'Telefonunuzun kendi bildirim sesi çalar'); return; }
  try { if (onizleme) onizleme.pause(); onizleme = new Audio('bildirim/' + d); onizleme.play().catch(() => toast('Ses önizlemesi bu cihazda açılamadı')); temizlik.push(() => onizleme && onizleme.pause()); } catch (e) {}
}
function saatAyar(k, v) { const a = oku(k, null); return a && typeof a === 'object' ? { ...v, ...a } : v; }
const IYILIK_VARSAYILAN = { acik: true, saat: '21:30' }, OLUM_VARSAYILAN = { acik: false, saat: '21:00' };
function gunSaat(gun, hm) { const [h, mi] = hm.split(':').map(Number); const d = new Date(gun); d.setHours(h, mi, 0, 0); return d; }
// app.js'deki bildirimPlanla bunu çağırır: iyilik, ölüm ve hatim hatırlatmaları
function ekBildirimler(simdi) {
  const l = [], g = genelKanal();
  hatimlerim().slice(0, 2).forEach((h, hi) => {
    for (let d = 0, n = 0; d < 15 && n < 2; d++) {
      const gun = new Date(simdi); gun.setDate(gun.getDate() + d); if (gun.getDay() !== 4) continue;
      const at = new Date(gunVakitleri(gun).v[4].getTime() + 40 * 60e3); if (at <= simdi) continue;
      const w = haftaNo(gun), cuz = hatimCuzu(h, h.slot, w); n++;
      if (oku(`hatimOkudum.${h.kod}.${w}`, false)) continue;
      l.push({ id: 3200 + hi * 10 + n, title: 'Bu haftaki cüzünü okudun mu? 📖', body: `${h.ad}: ${cuz}. cüz. Okuduysan “Okudum” de; gelecek hafta ${cuz % 30 + 1}. cüz sende.`, schedule: { at, allowWhileIdle: true }, extra: { git: 'hatim', kod: h.kod }, ...g });
    }
  });
  const o = saatAyar('olumBildirim', OLUM_VARSAYILAN);
  if (o.acik) for (let d = 0; d < 5; d++) {
    const gun = new Date(simdi); gun.setDate(gun.getDate() + d); const at = gunSaat(gun, o.saat); if (at <= simdi) continue;
    const [soz, kay] = OLUM_HATIRLA[gunNo(gun) % OLUM_HATIRLA.length];
    l.push({ id: 3400 + d, title: 'Ey insanoğlu! Ölüm var. 🌿', body: `${soz} (${kay})`, largeBody: `${soz} (${kay})`, schedule: { at, allowWhileIdle: true }, extra: { git: 'olum' }, ...g });
  }
  const iy = saatAyar('iyilikBildirim', IYILIK_VARSAYILAN);
  if (iy.acik) for (let d = 0; d < 5; d++) {
    const gun = new Date(simdi); gun.setDate(gun.getDate() + d); const at = gunSaat(gun, iy.saat); if (at <= simdi) continue;
    if (d === 0 && iyilikGunu(ymd(simdi)).s.length) continue;
    l.push({ id: 3300 + d, title: 'Bugün Allah için ne yaptın? 🤍', body: IYILIK_SOZLER[gunNo(gun) % IYILIK_SOZLER.length], schedule: { at, allowWhileIdle: true }, extra: { git: 'iyilik' }, ...g });
  }
  return l;
}
// Ayarlar ve diğer sayfalarda saatli hatırlatma satırı
function hatirlatmaSatiri(k, baslik, alt, v) {
  const a = saatAyar(k, v);
  return `<div class="ayar-satir hatirlat" data-hk="${k}"><span>${baslik}<br><span class="soluk">${alt}</span></span>
    <span class="hatirlat-sag"><input type="time" class="saat-sec" value="${a.saat}" ${a.acik ? '' : 'disabled'}><button class="anahtar ${a.acik ? 'acik' : ''}"></button></span></div>`;
}
function hatirlatmaBagla(kok) {
  kok.querySelectorAll('.hatirlat').forEach(el => {
    const k = el.dataset.hk, v = k === 'olumBildirim' ? OLUM_VARSAYILAN : IYILIK_VARSAYILAN, an = el.querySelector('.anahtar'), saat = el.querySelector('input');
    an.onclick = async () => {
      const a = saatAyar(k, v); a.acik = !a.acik;
      if (a.acik && !(await bildirimIzni())) { toast('Bildirim izni verilmedi. Telefon ayarlarından açabilirsiniz.'); return; }
      yaz(k, a); an.classList.toggle('acik', a.acik); saat.disabled = !a.acik; bildirimPlanla();
      if (a.acik) toast(`Her gün ${a.saat}'de hatırlatılacak`);
    };
    saat.onchange = () => { if (!saat.value) return; const a = saatAyar(k, v); a.saat = saat.value; yaz(k, a); bildirimPlanla(); toast(`Hatırlatma saati ${a.saat}`); };
  });
}

// =====================================================================
// İYİLİK DEFTERİ: "Bugün Allah için ne yaptın?"
// =====================================================================
const IYILIKLER = [
  ['namaz', '🕌', 'Namazımı vaktinde kıldım'], ['kuran', '📖', 'Kur\'an okudum'], ['zikir', '📿', 'Zikir ve istiğfar çektim'],
  ['dua', '🤲', 'Başkaları için dua ettim'], ['sadaka', '💝', 'Sadaka verdim'], ['yetim', '🧒', 'Bir yetimi sevindirdim'],
  ['anne', '👨‍👩‍👧', 'Anne babamı sevindirdim'], ['akraba', '🏡', 'Akrabamı aradım, ziyaret ettim'], ['hasta', '🩺', 'Hasta ziyaret ettim'],
  ['komsu', '🚪', 'Komşuma iyilik yaptım'], ['doyur', '🍲', 'Birini doyurdum'], ['yardim', '🤝', 'Birinin işini gördüm'],
  ['gulumse', '😊', 'Tebessüm ettim, tatlı söz söyledim'], ['affet', '🕊️', 'Affettim, kırgınlığı bıraktım'], ['dil', '🤐', 'Gıybetten, kötü sözden uzak durdum'],
  ['ilim', '📚', 'İlim öğrendim, öğrettim'], ['oruc', '🌙', 'Nafile oruç tuttum'], ['hayvan', '🐈', 'Bir hayvana su, yem verdim'],
  ['yol', '🌱', 'Yoldan eziyet veren bir şeyi kaldırdım'], ['israf', '💧', 'İsraftan kaçındım'],
];
const IYILIK_SOZLER = [
  'Kim zerre miktarı hayır işlerse onu görür. (Zilzâl, 7) Bugünün iyiliklerini deftere yaz.',
  'Tebessüm etmek de sadakadır. Bugün kimi sevindirdin?',
  'Amellerin Allah’a en sevimli olanı, az da olsa devamlı olanıdır. (Buhârî) Defterin seni bekliyor.',
  'Yetimin başını okşayan, okşadığı her saç teli sayısınca sevap alır. Bugün bir iyilik ekle.',
  'Sadaka malı eksiltmez. (Müslim) Bugün Allah için ne yaptın?',
  'Hesaba çekilmeden önce kendinizi hesaba çekin. (Hz. Ömer) Bugünü bir düşün.',
  'İyilik eden, iyiliğini kendisi için eder. Bugünün iyiliklerini işaretle.',
];
function iyilikVeri() { return oku('iyilik', {}); }
function iyilikGunu(t) { const v = iyilikVeri()[t]; return { s: (v && v.s) || [], n: (v && v.n) || '' }; }
function iyilikKaydet(t, g) { const v = iyilikVeri(); if (g.s.length || g.n) v[t] = g; else delete v[t]; yaz('iyilik', v); }
function iyilikSeri() {
  const v = iyilikVeri(); let n = 0; const d = new Date();
  if (!(v[ymd(d)] && v[ymd(d)].s.length)) d.setDate(d.getDate() - 1); // bugün henüz yazılmadıysa dünden say
  while (v[ymd(d)] && (v[ymd(d)].s.length || v[ymd(d)].n)) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function sIyilik(m, ilkGun) {
  const bugun = ymd(new Date());
  let gun = ilkGun || bugun, yil = +gun.slice(0, 4);
  const ciz = () => {
    const g = iyilikGunu(gun), v = iyilikVeri(), seri = iyilikSeri();
    const yilGunleri = Object.entries(v).filter(([t]) => +t.slice(0, 4) === yil);
    const toplam = yilGunleri.reduce((a, [, x]) => a + x.s.length, 0), sayac = {};
    yilGunleri.forEach(([, x]) => x.s.forEach(k => sayac[k] = (sayac[k] || 0) + 1));
    const enCok = Object.entries(sayac).sort((a, b) => b[1] - a[1]), tepe = enCok.length ? enCok[0][1] : 1;
    const buGun = gun === bugun;
    m.innerHTML = `<div class="kart iy-ust"><div class="iy-baslik">${buGun ? 'Bugün Allah için ne yaptın?' : esc(tarihYaz(gun)) + ' günü'}</div>
        <div class="iy-alt">${buGun ? esc(tarihYaz(gun)) : '<button class="cip" id="iy-bugun">Bugüne dön</button>'}</div>
        <div class="iy-ozet"><div><b>${g.s.length}</b><span>${buGun ? 'bugün' : 'o gün'}</span></div><div><b>${seri}</b><span>gün üst üste</span></div><div><b>${toplam}</b><span>${yil} yılında</span></div></div></div>
      <div class="iy-secenekler">${IYILIKLER.map(([k, i, a]) => `<button class="iy-cip ${g.s.includes(k) ? 'secili' : ''}" data-k="${k}"><span>${i}</span>${esc(a)}</button>`).join('')}</div>
      <textarea class="giris iy-not" id="iy-not" rows="2" maxlength="300" placeholder="Başka bir iyilik ya da not (isteğe bağlı)">${esc(g.n)}</textarea>
      <p class="soluk iy-bilgi">“Kim zerre miktarı hayır işlerse onu görür.” (Zilzâl, 7) Bu defter yalnızca senin telefonunda saklanır; kimseye gösterilmez. Riyadan uzak, kendinle bir muhasebe içindir.</p>
      <div class="kart"><div class="takvim-ust"><button id="iy-geri" aria-label="Önceki yıl">‹</button><b>${yil} yılı iyilik takvimi</b><button id="iy-ileri" aria-label="Sonraki yıl" ${yil >= +bugun.slice(0, 4) ? 'disabled style="opacity:.3"' : ''}>›</button></div>
        <div class="iy-aylar">${iyilikAylari(yil, v, gun, bugun)}</div>
        <div class="iy-lejant"><span>Az</span><i class="d1"></i><i class="d2"></i><i class="d3"></i><span>Çok</span></div>
        <p class="soluk" style="margin:6px 0 0;text-align:center">Bir güne dokunarak o günü görebilir, ekleme yapabilirsin.</p></div>
      ${enCok.length ? `<div class="kart"><h2>${yil} yılında en çok</h2>${enCok.map(([k, n]) => { const x = IYILIKLER.find(y => y[0] === k); return x ? `<div class="iy-cubuk"><span>${x[1]} ${esc(x[2])}</span><b>${n}</b><i style="width:${Math.max(4, n / tepe * 100)}%"></i></div>` : ''; }).join('')}</div>` : ''}
      <div class="kart"><h2>Hatırlatma</h2>${hatirlatmaSatiri('iyilikBildirim', 'Her akşam sor', 'Gün bitmeden “Bugün Allah için ne yaptın?”', IYILIK_VARSAYILAN)}</div>`;
    m.querySelectorAll('.iy-cip').forEach(b => b.onclick = () => {
      const x = iyilikGunu(gun), k = b.dataset.k, var_ = x.s.includes(k);
      x.s = var_ ? x.s.filter(y => y !== k) : [...x.s, k]; iyilikKaydet(gun, x);
      if (!var_) { titres(); if (x.s.length === 1 && gun === bugun) toast('Allah kabul etsin 🤍'); }
      const sc = m.scrollTop; ciz(); m.scrollTop = sc;
      if (gun === bugun) bildirimPlanla();
    });
    $('#iy-not').onchange = e => { const x = iyilikGunu(gun); x.n = e.target.value.trim(); iyilikKaydet(gun, x); };
    if ($('#iy-bugun')) $('#iy-bugun').onclick = () => { gun = bugun; yil = +bugun.slice(0, 4); ciz(); };
    $('#iy-geri').onclick = () => { yil--; ciz(); };
    $('#iy-ileri').onclick = () => { if (yil < +bugun.slice(0, 4)) { yil++; ciz(); } };
    m.querySelectorAll('.iy-gun[data-t]').forEach(b => b.onclick = () => { gun = b.dataset.t; ciz(); m.scrollTop = 0; });
    hatirlatmaBagla(m);
  };
  ciz();
}
function iyilikAylari(yil, v, secili, bugun) {
  const AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  let h = '';
  for (let a = 0; a < 12; a++) {
    const ilk = new Date(yil, a, 1), gunSay = new Date(yil, a + 1, 0).getDate(), bos = (ilk.getDay() + 6) % 7;
    let hucre = '<i></i>'.repeat(bos);
    for (let d = 1; d <= gunSay; d++) {
      const t = `${yil}-${String(a + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, x = v[t], n = x ? x.s.length + (x.n ? 1 : 0) : 0;
      const sev = n === 0 ? '' : n <= 2 ? 'd1' : n <= 4 ? 'd2' : 'd3';
      hucre += t > bugun ? '<i class="iy-gun gelecek"></i>' : `<button class="iy-gun ${sev} ${t === secili ? 'secili' : ''} ${t === bugun ? 'bugun' : ''}" data-t="${t}" aria-label="${d} ${AY[a]}: ${n}"></button>`;
    }
    h += `<div class="iy-ay"><small>${AY[a]}</small><div class="iy-izgara">${hucre}</div></div>`;
  }
  return h;
}

// =====================================================================
// ZEKÂT HESAPLAMA (Hanefî): nisap 80,18 gram altın, oran kırkta bir
// =====================================================================
const ZEKAT_NISAP_GR = 80.18;
function sZekat(m) {
  const alanlar = [
    ['altinFiyat', 'Gram altın fiyatı (24 ayar)', '₺', 'Güncel fiyatı kuyumcudan ya da bankanızdan öğrenip yazın'],
    ['nakit', 'Nakit ve bankadaki para', '₺', 'Vadeli, vadesiz hesaplar dâhil'],
    ['doviz', 'Döviz (TL karşılığı)', '₺', 'Dolar, euro vb. bugünkü kurla'],
    ['altin24', 'Altın (24 ayar, gram altın, külçe)', 'gr', ''],
    ['altin22', 'Altın (22 ayar: bilezik, çeyrek, yarım, tam)', 'gr', 'Çeyrek ≈ 1,75 gr · yarım ≈ 3,5 gr · tam ≈ 7 gr (22 ayar)'],
    ['altin14', 'Altın (14 ayar takı)', 'gr', ''],
    ['gumus', 'Gümüş (TL karşılığı)', '₺', ''],
    ['ticari', 'Ticaret malları (satış değeri)', '₺', 'Dükkândaki satılık mallar; dükkân, araç ve aletler hariç'],
    ['alacak', 'Tahsili umulan alacaklar', '₺', ''],
    ['borc', 'Borçlar (bir yıl içinde ödenecek)', '₺', 'Kredi kartı, taksit ve ödenecek borçlar'],
  ];
  const v = oku('zekat', {});
  m.innerHTML = `<div class="kart"><h2>Zekât hesapla</h2><p style="margin:0">Temel ihtiyaçlarınız ve borcunuz dışında, üzerinden bir kamerî yıl geçmiş malınız <b>80,18 gram altın</b> değerine (nisap) ulaşıyorsa, malınızın <b>kırkta birini</b> (%2,5) zekât olarak verirsiniz.</p></div>
    <div class="kart zekat-form">${alanlar.map(([k, b, br, a]) => `<label class="zk-satir"><span>${esc(b)}${a ? `<small>${esc(a)}</small>` : ''}</span><span class="zk-giris"><input class="giris" inputmode="decimal" data-k="${k}" value="${v[k] != null ? esc(String(v[k]).replace('.', ',')) : ''}" placeholder="0"><em>${br}</em></span></label>`).join('')}</div>
    <div class="kart zekat-sonuc" id="zk-sonuc"></div>
    <div class="kart"><h2>Zekât kimlere verilir?</h2><p style="margin:0">Fakirler, miskinler, borçlular, yolda kalmışlar, Allah yolunda olanlar (ilim talebeleri dâhil) ve Tevbe sûresi 60. âyette sayılan diğer sınıflar.</p>
      <p class="soluk">Anne, baba, dede, nine, çocuk, torun ve eşe zekât verilmez. Muhtaç kardeş, amca, dayı, hala ve teyzeye verilebilir, hatta önceliklidir.</p>
      <button class="btn tam" id="zk-ilmihal">İlmihalde zekât bölümünü oku</button></div>
    <p class="soluk" style="text-align:center">Hesaplama Hanefî mezhebine göre bir yaklaşımdır. Özel durumlar için müftülüğe veya ALO 190'a danışabilirsiniz.</p>`;
  const sayi = s => { s = String(s || '').trim().replace(/\s|₺/g, ''); const x = parseFloat(/^\d+\.\d{1,2}$/.test(s) ? s : s.replace(/\./g, '').replace(',', '.')); return isFinite(x) && x > 0 ? x : 0; };
  const hesap = () => {
    const d = {}; m.querySelectorAll('[data-k]').forEach(i => d[i.dataset.k] = sayi(i.value));
    yaz('zekat', Object.fromEntries(Object.entries(d).filter(([, x]) => x)));
    const f = d.altinFiyat, altinTl = f * (d.altin24 + d.altin22 * 22 / 24 + d.altin14 * 14 / 24);
    const varlik = d.nakit + d.doviz + altinTl + d.gumus + d.ticari + d.alacak, net = varlik - d.borc, nisap = ZEKAT_NISAP_GR * f;
    let h = '<h2>Sonuç</h2>';
    if (!f) h += '<p style="margin:0">Nisabı hesaplayabilmek için önce <b>gram altın fiyatını</b> yazın.</p>';
    else {
      h += `<div class="zk-tablo"><span>Toplam varlık</span><b>${tlYaz(varlik)}</b><span>Borçlar</span><b>− ${tlYaz(d.borc)}</b><span>Zekâta tabi net mal</span><b>${tlYaz(Math.max(0, net))}</b><span>Nisap (80,18 gr altın)</span><b>${tlYaz(nisap)}</b></div>`;
      h += net >= nisap ? `<div class="zk-vurgu"><span>Vermeniz gereken zekât</span><b>${tlYaz(net / 40)}</b></div><p class="soluk" style="margin:8px 0 0">Malınız nisaba ulaşmış. Zekâtınızı bir yıl dolduğunda, gizlice ve gönül hoşluğuyla vermeniz faziletlidir. Allah kabul etsin.</p>`
        : `<div class="zk-vurgu bos"><span>Zekât düşmüyor</span><b>Nisabın altında</b></div><p class="soluk" style="margin:8px 0 0">Net malınız nisap miktarına ulaşmadığı için zekât farz değildir. Dilediğiniz kadar sadaka verebilirsiniz.</p>`;
    }
    $('#zk-sonuc').innerHTML = h;
  };
  m.querySelectorAll('[data-k]').forEach(i => i.oninput = hesap);
  $('#zk-ilmihal').onclick = () => sayfa(mm => sIlmihalBolum(mm, ILMIHAL.findIndex(b => b[0].startsWith('Zekât'))), 'Zekât ve Sadaka');
  hesap();
}

// =====================================================================
// KISSADAN HİSSE · AİLE SOHBETİ
// =====================================================================
function kissaKategorileri() { return [...new Set(KISSALAR.map(k => k[0]))]; }
function sKissalar(m) {
  let kat = oku('kissaKat', ''), q = '';
  const okunan = () => new Set(oku('kissaOkunan', []));
  const gk = gunNo() % KISSALAR.length;
  m.innerHTML = `<button class="kart kissa-gunun" id="ks-gunun"><small>Bugünün kıssası</small><b>${esc(KISSALAR[gk][1])}</b><span>${esc(KISSALAR[gk][3])}</span></button>
    <div class="kart kissa-bilgi"><p style="margin:0">Akşam sofradan sonra ailecek bir kıssa okuyun, sonra “Bu hikâyeden ne anladık?” diye sohbet edin. Her hikâyenin altında hissesi var.</p><div class="soluk" id="ks-ilerleme"></div></div>
    <input class="ara" id="ks-ara" type="search" placeholder="Kıssalarda ara" autocomplete="off">
    <div class="kissa-kat"><button class="cip ${!kat ? 'acik' : ''}" data-kat="">Hepsi</button>${kissaKategorileri().map(k => `<button class="cip ${kat === k ? 'acik' : ''}" data-kat="${esc(k)}">${esc(k)}</button>`).join('')}</div>
    <div class="liste" id="ks-liste"></div><button class="btn tam" id="ks-rastgele">🎲 Rastgele bir kıssa</button>`;
  const listele = () => {
    const ok = okunan(), qq = trKucuk(q.trim());
    const l = KISSALAR.map((k, i) => [k, i]).filter(([k]) => (!kat || k[0] === kat) && (!qq || trKucuk(k[1] + ' ' + k[2] + ' ' + k[3]).includes(qq)));
    $('#ks-liste').innerHTML = l.map(([k, i]) => `<button data-i="${i}"><span class="no">${ok.has(i) ? '✓' : i + 1}</span><span class="orta"><b>${esc(k[1])}</b><span class="soluk">${esc(k[0])}</span></span><span class="soluk">›</span></button>`).join('') || '<div class="soluk">Sonuç yok</div>';
    $('#ks-ilerleme').textContent = `${KISSALAR.length} kıssa · ${ok.size} tanesini okudunuz`;
  };
  listele();
  m.querySelectorAll('[data-kat]').forEach(b => b.onclick = () => { kat = b.dataset.kat; yaz('kissaKat', kat); m.querySelectorAll('[data-kat]').forEach(x => x.classList.toggle('acik', x === b)); listele(); });
  $('#ks-ara').oninput = e => { q = e.target.value; listele(); };
  $('#ks-liste').onclick = e => { const b = e.target.closest('[data-i]'); if (b) sayfa(mm => sKissa(mm, +b.dataset.i), 'Kıssadan Hisse'); };
  $('#ks-gunun').onclick = () => sayfa(mm => sKissa(mm, gk), 'Kıssadan Hisse');
  $('#ks-rastgele').onclick = () => sayfa(mm => sKissa(mm, Math.floor(Math.random() * KISSALAR.length)), 'Kıssadan Hisse');
}
function sKissa(m, i) {
  const [kat, bas, hik, hisse] = KISSALAR[i];
  const o = new Set(oku('kissaOkunan', [])); o.add(i); yaz('kissaOkunan', [...o]);
  m.innerHTML = `<div class="kissa-etiket">${esc(kat)} · ${i + 1}/${KISSALAR.length}</div><h2 class="kissa-baslik">${esc(bas)}</h2>
    <div class="kart kissa-metin">${hik.split(/\n+/).map(p => `<p>${esc(p)}</p>`).join('')}</div>
    <div class="kart kissa-hisse"><small>Kıssadan hisse</small><p>${esc(hisse)}</p></div>
    <div class="kart kissa-soru"><b>Aile sohbeti için</b><p>Bu hikâyede en çok neyi beğendin? Sen olsan ne yapardın? Bugün bu hisseyi nasıl yaşayabiliriz?</p></div>
    <div class="sure-gecis">${i > 0 ? `<button id="ks-onceki">‹ Önceki</button>` : '<span></span>'}<button id="ks-paylas">Paylaş</button>${i < KISSALAR.length - 1 ? `<button id="ks-sonraki">Sonraki ›</button>` : '<span></span>'}</div>`;
  const git = j => { yigin.pop(); sayfa(mm => sKissa(mm, j), 'Kıssadan Hisse'); };
  if ($('#ks-onceki')) $('#ks-onceki').onclick = () => git(i - 1);
  if ($('#ks-sonraki')) $('#ks-sonraki').onclick = () => git(i + 1);
  $('#ks-paylas').onclick = () => paylas(`${bas}\n\n${hik}\n\nKıssadan hisse: ${hisse}\n\n(Üç Nur: Kuran Hadis Zikir)`, bas);
}

// =====================================================================
// İLMİHAL
// =====================================================================
function sIlmihal(m) {
  m.innerHTML = `<div class="kart ilmihal-ust"><h2>Temel İlmihal</h2><p style="margin:0">İman, ibadet ve günlük hayatla ilgili temel dinî bilgiler. Hanefî mezhebine göre kısa ve sade bir özettir.</p></div>
    <input class="ara" id="il-ara" type="search" placeholder="İlmihalde ara (ör. abdest, sehiv, fitre)" autocomplete="off">
    <div id="il-sonuc"></div>
    <div class="liste" id="il-liste">${ILMIHAL.map(([b, ik, a], i) => `<button data-i="${i}"><span class="no">${ik}</span><span class="orta"><b>${esc(b)}</b><span class="soluk">${a.map(x => x[0]).slice(0, 3).map(esc).join(' · ')}${a.length > 3 ? '…' : ''}</span></span><span class="soluk">›</span></button>`).join('')}</div>
    <p class="soluk" style="text-align:center">${esc(ILMIHAL_NOT)}</p>`;
  $('#il-liste').onclick = e => { const b = e.target.closest('[data-i]'); if (b) sayfa(mm => sIlmihalBolum(mm, +b.dataset.i), ILMIHAL[+b.dataset.i][0]); };
  $('#il-ara').oninput = e => {
    const qq = trKucuk(e.target.value.trim()), s = $('#il-sonuc');
    if (qq.length < 3) { s.innerHTML = ''; $('#il-liste').hidden = false; return; }
    const l = []; ILMIHAL.forEach(([b, , a], i) => a.forEach(([k, t], j) => { if (trKucuk(k + ' ' + t).includes(qq)) l.push([i, j, b, k]); }));
    $('#il-liste').hidden = true;
    s.innerHTML = `<div class="liste">${l.map(([i, j, b, k]) => `<button data-i="${i}" data-j="${j}"><span class="orta"><b>${esc(k)}</b><span class="soluk">${esc(b)}</span></span><span class="soluk">›</span></button>`).join('') || '<div class="soluk">Sonuç yok</div>'}</div>`;
    s.onclick = ev => { const b = ev.target.closest('[data-i]'); if (b) sayfa(mm => sIlmihalBolum(mm, +b.dataset.i, +b.dataset.j), ILMIHAL[+b.dataset.i][0]); };
  };
}
function sIlmihalBolum(m, i, acik) {
  if (i < 0) i = 0;
  const [b, ik, a] = ILMIHAL[i];
  m.innerHTML = `<div class="ilmihal-bas"><span>${ik}</span>${esc(b)}</div>
    ${a.map(([k, t], j) => `<details class="kart ilmihal-konu" ${j === acik || (acik == null && j === 0) ? 'open' : ''} id="ik${j}"><summary>${esc(k)}</summary><div class="ilmihal-metin">${metinHtml(t)}</div></details>`).join('')}
    <div class="sure-gecis">${i > 0 ? `<button id="il-onceki">‹ ${esc(ILMIHAL[i - 1][0])}</button>` : '<span></span>'}${i < ILMIHAL.length - 1 ? `<button id="il-sonraki">${esc(ILMIHAL[i + 1][0])} ›</button>` : ''}</div>
    <p class="soluk" style="text-align:center">${esc(ILMIHAL_NOT)}</p>`;
  const git = j => { yigin.pop(); sayfa(mm => sIlmihalBolum(mm, j), ILMIHAL[j][0]); };
  if ($('#il-onceki')) $('#il-onceki').onclick = () => git(i - 1);
  if ($('#il-sonraki')) $('#il-sonraki').onclick = () => git(i + 1);
  if (acik > 0) setTimeout(() => { const el = $('#ik' + acik, m); if (el) m.scrollTop = el.offsetTop - m.offsetTop - 8; }, 30);
}

// =====================================================================
// SAYFA SAYFA KUR'AN (Mushaf düzeni, 604 sayfa)
// =====================================================================
const ayetKiyas = (a, b) => a[0] - b[0] || a[1] - b[1];
function sayfaAyetleri(p, K) {
  const bas = SAYFALAR[p - 1], son = SAYFALAR[p] || [115, 1], l = [];
  let [s, a] = bas;
  while (ayetKiyas([s, a], son) < 0) { l.push([s, a]); a++; if (a > K[s - 1].v.length) { s++; a = 1; } }
  return l;
}
function ayetSayfasi(s, a) { let lo = 0, hi = SAYFALAR.length - 1; while (lo < hi) { const md = (lo + hi + 1) >> 1; if (ayetKiyas(SAYFALAR[md], [s, a]) <= 0) lo = md; else hi = md - 1; } return lo + 1; }
function sayfaCuzu(p) { const b = SAYFALAR[p - 1]; let c = 1; CUZLER.forEach((x, i) => { if (ayetKiyas(x, b) <= 0) c = i + 1; }); return c; }
function cuzSayfalari(c) { const ilk = ayetSayfasi(...CUZLER[c - 1]); const son = c < 30 ? ayetSayfasi(...CUZLER[c]) - 1 : 604; return [ilk, Math.max(ilk, son)]; }
function sMushaf(m, ilkSayfa) {
  const burada = bekci();
  sureAdlariYukle().then(K => {
    if (!burada()) return;
    let p = Math.min(604, Math.max(1, ilkSayfa || oku('sonSayfa', 1))), meal = oku('mushafMeal', false);
    let calar = null, ayetler = [];
    const ciz = () => {
      ayetler = sayfaAyetleri(p, K); yaz('sonSayfa', p);
      const sureler = [...new Set(ayetler.map(x => x[0]))];
      $('#baslik').textContent = `Sayfa ${p} · ${K[sureler[0] - 1].ad}`;
      let metin = '';
      ayetler.forEach(([s, a]) => {
        if (a === 1) metin += `<div class="ms-sure"><span class="ar">${esc(K[s - 1].ar)}</span><small>${esc(K[s - 1].ad)} Sûresi · ${K[s - 1].v.length} âyet</small></div>${s !== 1 && s !== 9 ? '<div class="ms-besmele ar">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ</div>' : ''}`;
        metin += `<span class="ms-ayet" id="a${s}_${a}" data-s="${s}" data-a="${a}">${esc(K[s - 1].v[a - 1][0])}<span class="ms-no">﴿${arRakam(a)}﴾</span></span> `;
      });
      m.innerHTML = `<div class="okuyucu-ayar ms-arac"><button class="cip" id="ms-git">Sayfa ${p} · ${sayfaCuzu(p)}. Cüz ▾</button><button class="cip ${meal ? 'acik' : ''}" id="ms-meal">Meal</button>
          <button class="cip" id="b-k">A−</button><button class="cip" id="b-b">A+</button><button class="cip dinle-cip" id="ms-dinle">▶ Dinle</button></div>
        <div class="kart mushaf-sayfa"><div class="ms-metin ar">${metin}</div><div class="ms-sayfa-no">${arRakam(p)}</div></div>
        ${meal ? `<div class="kart ms-meal">${ayetler.map(([s, a]) => `<p><b>${s !== ayetler[0][0] || a === 1 ? esc(K[s - 1].ad) + ' ' : ''}${a}.</b> ${esc(K[s - 1].v[a - 1][1])}</p>`).join('')}</div>` : ''}
        <div class="ms-gecis"><button id="ms-sonraki" ${p >= 604 ? 'disabled' : ''}>‹ Sonraki sayfa</button><span>${p} / 604</span><button id="ms-onceki" ${p <= 1 ? 'disabled' : ''}>Önceki sayfa ›</button></div>
        <p class="kaynak" style="text-align:center">Sayfa düzeni: Medine Mushafı (Tanzil.net) · Meal: Diyanet İşleri Başkanlığı</p>`;
      m.scrollTop = 0;
      calar = kuranCalar(m, ayetler[0][0], 0, { ayetler, bitti: () => { if (p < 604 && oku('mushafDevam', true)) { p++; ciz(); calar.basla({ s: ayetler[0][0], a: ayetler[0][1] }); } else toast('Sayfa tamamlandı'); } });
      $('#ms-dinle').onclick = () => calar.basla({ s: ayetler[0][0], a: ayetler[0][1] });
      $('#ms-meal').onclick = () => { meal = !meal; yaz('mushafMeal', meal); ciz(); };
      $('#ms-sonraki').onclick = () => { if (p < 604) { p++; ciz(); } };
      $('#ms-onceki').onclick = () => { if (p > 1) { p--; ciz(); } };
      $('#ms-git').onclick = () => mushafGit(K, x => { p = x; ciz(); });
      $('#b-k').onclick = () => { yaz('arBoyut', Math.max(20, oku('arBoyut', 28) - 2)); yaz('trBoyut', Math.max(13, oku('trBoyut', 16) - 1)); boyutUygula(); };
      $('#b-b').onclick = () => { yaz('arBoyut', Math.min(44, oku('arBoyut', 28) + 2)); yaz('trBoyut', Math.min(24, oku('trBoyut', 16) + 1)); boyutUygula(); };
    };
    // Âyete dokununca meali ve "buradan dinle"
    m.onclick = e => {
      const el = e.target.closest('.ms-ayet'); const eski = $('#ms-pop'); if (eski) eski.remove();
      m.querySelectorAll('.ms-ayet.secili').forEach(x => x.classList.remove('secili'));
      if (!el) return;
      const s = +el.dataset.s, a = +el.dataset.a; el.classList.add('secili');
      const pop = document.createElement('div'); pop.id = 'ms-pop'; pop.className = 'ms-pop';
      pop.innerHTML = `<b>${esc(K[s - 1].ad)} ${a}</b><p>${esc(K[s - 1].v[a - 1][1])}</p><div><button class="cip dinle-cip" id="pop-dinle">▶ Buradan dinle</button><button class="cip" id="pop-sure">Sûre olarak aç</button><button class="cip" id="pop-kapat">Kapat</button></div>`;
      document.body.appendChild(pop); temizlik.push(() => pop.remove());
      pop.querySelector('#pop-dinle').onclick = () => { pop.remove(); calar.basla({ s, a }); };
      pop.querySelector('#pop-sure').onclick = () => { pop.remove(); sayfa(mm => sOku(mm, s, a), K[s - 1].ad); };
      pop.querySelector('#pop-kapat').onclick = () => { pop.remove(); el.classList.remove('secili'); };
    };
    // Kaydırarak sayfa çevirme (Mushaf sağdan sola: sağa kaydırınca sonraki sayfa)
    let x0 = null, y0 = 0;
    olayEkle(m, 'touchstart', e => { if (e.touches.length === 1) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; } }, { passive: true });
    olayEkle(m, 'touchend', e => {
      if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
      if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx) * .6) return;
      if (dx > 0 && p < 604) { p++; ciz(); } else if (dx < 0 && p > 1) { p--; ciz(); }
    }, { passive: true });
    ciz();
  });
}
function mushafGit(K, sec) {
  const k = document.createElement('div'); k.className = 'sor-zemin';
  k.innerHTML = `<div class="sor-kutu"><b>Sayfaya git</b>
    <label class="soluk">Sayfa (1–604)</label><input class="giris" id="mg-s" inputmode="numeric" placeholder="Sayfa numarası">
    <label class="soluk">Cüz</label><select class="sec" id="mg-c"><option value="">Cüz seçin</option>${CUZLER.map((_, i) => `<option value="${i + 1}">${i + 1}. Cüz</option>`).join('')}</select>
    <label class="soluk">Sûre</label><select class="sec" id="mg-u"><option value="">Sûre seçin</option>${K.map(x => `<option value="${x.n}">${x.n}. ${esc(x.ad)}</option>`).join('')}</select>
    <div class="sor-alt"><button class="btn" id="mg-iptal">Vazgeç</button><button class="btn ana" id="mg-git">Git</button></div></div>`;
  document.body.appendChild(k); temizlik.push(() => k.remove());
  const kapat = () => k.remove();
  k.querySelector('#mg-c').onchange = e => { if (e.target.value) { kapat(); sec(cuzSayfalari(+e.target.value)[0]); } };
  k.querySelector('#mg-u').onchange = e => { if (e.target.value) { kapat(); sec(ayetSayfasi(+e.target.value, 1)); } };
  k.querySelector('#mg-git').onclick = () => { const x = parseInt(k.querySelector('#mg-s').value, 10); if (x >= 1 && x <= 604) { kapat(); sec(x); } else toast('1 ile 604 arasında bir sayfa yazın'); };
  k.querySelector('#mg-iptal').onclick = kapat;
  k.onclick = e => { if (e.target === k) kapat(); };
}

// =====================================================================
// HATİM HALKASI (Firebase Firestore REST + anonim giriş)
// Veri: hatimler/{KOD} {ad, kuran, w0} · hatimler/{KOD}/cuzler/{01..30} {ad, uid} · hatimler/{KOD}/haftalar/{w} {sNN: {uid, ad, cuz, t}}
// =====================================================================
function haftaNo(d = new Date()) { const [y, mo, g] = haftaAnahtari(d).split('-').map(Number); return Math.round(Date.UTC(y, mo - 1, g) / 864e5 / 7); }
function haftaAraligi(w) { const cuma = new Date((w * 7 + 1) * 864e5); const bas = new Date(cuma.getTime() - 6 * 864e5); const f = d => new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }); return `${f(bas)} – ${f(cuma)}`; }
function hatimCuzu(h, slot, w) { return (((slot - 1 + (w - (h.w0 || 0))) % 30) + 30) % 30 + 1; }
function hatimlerim() { return oku('hatimlerim', []); }
const sn = n => String(n).padStart(2, '0');
const hatimHazir = () => !!(FIREBASE.apiKey && FIREBASE.projectId);
const fbKok = () => `projects/${FIREBASE.projectId}/databases/(default)/documents`;
const fbUrl = yol => `https://firestore.googleapis.com/v1/${fbKok()}${yol}`;
const fv = v => v == null ? { nullValue: null } : typeof v === 'number' ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }) : typeof v === 'boolean' ? { booleanValue: v } : typeof v === 'string' ? { stringValue: v } : Array.isArray(v) ? { arrayValue: { values: v.map(fv) } } : { mapValue: { fields: fenc(v) } };
const fenc = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, fv(v)]));
const fdv = x => 'stringValue' in x ? x.stringValue : 'integerValue' in x ? +x.integerValue : 'doubleValue' in x ? x.doubleValue : 'booleanValue' in x ? x.booleanValue : 'mapValue' in x ? fdec(x.mapValue.fields) : 'arrayValue' in x ? (x.arrayValue.values || []).map(fdv) : 'timestampValue' in x ? x.timestampValue : null;
const fdec = f => Object.fromEntries(Object.entries(f || {}).map(([k, v]) => [k, fdv(v)]));
let fbGirisP = null;
function fbGiris() { return fbGirisP || (fbGirisP = fbGiris_().finally(() => { fbGirisP = null; })); }
async function fbGiris_() {
  let a = oku('fbGiris', null);
  if (a && a.exp > Date.now() + 120e3) return a;
  const k = FIREBASE.apiKey;
  if (a && a.rt) {
    const r = await fetch(`https://securetoken.googleapis.com/v1/token?key=${k}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(a.rt) });
    if (r.ok) { const j = await r.json(); a = { id: j.id_token, rt: j.refresh_token, uid: j.user_id, exp: Date.now() + (+j.expires_in) * 1000 }; yaz('fbGiris', a); return a; }
  }
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${k}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ returnSecureToken: true }) });
  if (!r.ok) throw new Error('giris');
  const j = await r.json(); a = { id: j.idToken, rt: j.refreshToken, uid: j.localId, exp: Date.now() + (+j.expiresIn) * 1000 }; yaz('fbGiris', a); return a;
}
async function fb(yol, o = {}) {
  const a = await fbGiris();
  const r = await fetch(o.tam || fbUrl(yol), { method: o.method || 'GET', headers: { Authorization: 'Bearer ' + a.id, 'Content-Type': 'application/json' }, body: o.body ? JSON.stringify(o.body) : undefined });
  if (r.status === 404 && o.yoksaNull) return null;
  if (!r.ok) { let j = {}; try { j = await r.json(); } catch (e) {} const h = new Error((j.error && j.error.status) || 'HTTP ' + r.status); h.durum = (j.error && j.error.status) || ''; throw h; }
  return r.json();
}
const fbCommit = writes => fb('', { tam: `https://firestore.googleapis.com/v1/${fbKok()}:commit`, method: 'POST', body: { writes } });
async function hatimGetir(kod) {
  const [d, c, w] = await Promise.all([fb(`/hatimler/${kod}`, { yoksaNull: true }), fb(`/hatimler/${kod}/cuzler?pageSize=30`, { yoksaNull: true }), fb(`/hatimler/${kod}/haftalar/${haftaNo()}`, { yoksaNull: true })]);
  if (!d) return null;
  const h = { kod, ...fdec(d.fields), slotlar: {}, okunan: w ? fdec(w.fields) : {} };
  ((c && c.documents) || []).forEach(x => { const n = +x.name.split('/').pop(); h.slotlar[n] = { ...fdec(x.fields), ut: x.updateTime }; });
  yaz('hatimOnbellek.' + kod, h);
  return h;
}
function hatimKoduUret() { const a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let s = ''; const r = new Uint32Array(6); (crypto.getRandomValues ? crypto.getRandomValues(r) : r.forEach((_, i) => r[i] = Math.random() * 1e9)); r.forEach(x => s += a[x % a.length]); return s; }
function hatimHata(e) { toast(e && e.durum === 'FAILED_PRECONDITION' ? 'Bu cüz az önce başkası tarafından alındı. Liste yenilendi.' : 'İnternete bağlanılamadı. Biraz sonra tekrar deneyin.', 3500); }
function hatimYerelKaydet(h, slot) {
  const l = hatimlerim().filter(x => x.kod !== h.kod);
  if (slot) l.unshift({ kod: h.kod, ad: h.ad, slot, w0: h.w0 || 0 }); yaz('hatimlerim', l); bildirimPlanla();
}
function sHatimler(m) {
  if (!hatimHazir()) {
    m.innerHTML = `<div class="kart hatim-ust"><div class="hatim-ikon">📖</div><h2>Hatim Halkası</h2><p>Arkadaşlarınızla, ailenizle ya da cemaatinizle bir halka kurun; herkes haftada bir cüz okusun, her hafta birlikte bir hatim indirelim.</p>
      <p class="soluk">Bu bölüm çok yakında açılacak. Halkadaki herkesin birbirini görebilmesi için ortak bir sunucu hazırlanıyor.</p></div>`;
    return;
  }
  const l = hatimlerim(), w = haftaNo();
  m.innerHTML = `<div class="kart hatim-ust"><div class="hatim-ikon">📖</div><h2>Hatim Halkası</h2><p style="margin:0">Bir halka kurun, kodu sevdiklerinize gönderin. Herkes bir cüz alır, her hafta perşembe akşamı “Cüzünü okudun mu?” diye hatırlatılır, okuyan “Okudum” der ve gelecek hafta sıradaki cüz ona geçer. Böylece her hafta birlikte bir hatim olur.</p></div>
    ${l.length ? `<div class="kategori-baslik">Halkalarım</div><div class="liste" id="ht-liste">${l.map(h => { const c = hatimCuzu(h, h.slot, w), ok = oku(`hatimOkudum.${h.kod}.${w}`, false);
      return `<button data-kod="${h.kod}"><span class="no">${ok ? '✓' : c}</span><span class="orta"><b>${esc(h.ad)}</b><span class="soluk">Bu hafta ${c}. cüz · ${ok ? 'okudun' : 'okunacak'} · Kod ${h.kod}</span></span><span class="soluk">›</span></button>`; }).join('')}</div>` : ''}
    <button class="btn ana tam" id="ht-kur">＋ Yeni halka kur</button>
    <div class="kart" style="margin-top:12px"><h2>Bir halkaya katıl</h2><div class="kod-satir"><input class="giris kod-giris" id="ht-kod" maxlength="6" placeholder="KOD" autocomplete="off" autocapitalize="characters"><button class="btn ana" id="ht-katil">Katıl</button></div>
      <p class="soluk" style="margin:8px 0 0">Size gönderilen 6 haneli kodu yazın.</p></div>`;
  if ($('#ht-liste')) $('#ht-liste').onclick = e => { const b = e.target.closest('[data-kod]'); if (b) sayfa(mm => sHatim(mm, b.dataset.kod), 'Hatim Halkası'); };
  $('#ht-kur').onclick = () => sayfa(sHatimKur, 'Yeni Halka');
  $('#ht-kod').oninput = e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); };
  $('#ht-katil').onclick = () => { const k = $('#ht-kod').value.trim(); if (k.length !== 6) { toast('Kod 6 haneli olmalı'); return; } sayfa(mm => sHatim(mm, k), 'Hatim Halkası'); };
}
function sHatimKur(m) {
  m.innerHTML = `<div class="kart"><h2>Yeni hatim halkası</h2>
      <label class="soluk">Halkanın adı</label><input class="giris" id="hk-ad" maxlength="40" placeholder="Ör. Aile Hatmi, Cuma Halkası">
      <label class="soluk">Sizin adınız (halkada görünecek)</label><input class="giris" id="hk-ben" maxlength="30" value="${esc(oku('hatimAd', ''))}" placeholder="Ör. Emre">
      <label class="soluk">Bu hafta hangi cüzü okumak istersiniz?</label><select class="sec" id="hk-slot">${Array.from({ length: 30 }, (_, i) => `<option value="${i + 1}">${i + 1}. cüz</option>`).join('')}</select>
      <p class="soluk" style="margin:8px 0 0">Halkayı kuran kişi, katılmayanlar için de cüzlere isim yazabilir (atayabilir).</p>
      <button class="btn ana tam" id="hk-kur">Halkayı kur</button></div>`;
  $('#hk-kur').onclick = async e => {
    const ad = $('#hk-ad').value.trim(), ben = $('#hk-ben').value.trim(), slot = +$('#hk-slot').value;
    if (!ad || !ben) { toast('Halka adını ve kendi adınızı yazın'); return; }
    yaz('hatimAd', ben); e.target.disabled = true; e.target.textContent = 'Kuruluyor…';
    try {
      const a = await fbGiris(), w0 = haftaNo();
      for (let deneme = 0; deneme < 4; deneme++) {
        const kod = hatimKoduUret(), kok = fbKok() + '/hatimler/' + kod;
        try {
          await fbCommit([{ update: { name: kok, fields: fenc({ ad, kuran: a.uid, w0, t: Date.now() }) }, currentDocument: { exists: false } },
            ...Array.from({ length: 30 }, (_, i) => ({ update: { name: `${kok}/cuzler/${sn(i + 1)}`, fields: fenc(i + 1 === slot ? { ad: ben, uid: a.uid } : { ad: '', uid: null }) } }))]);
          hatimYerelKaydet({ kod, ad, w0 }, slot); yigin.pop(); sayfa(mm => sHatim(mm, kod, true), 'Hatim Halkası'); return;
        } catch (er) { if (er.durum !== 'ALREADY_EXISTS' && er.durum !== 'FAILED_PRECONDITION') throw er; }
      }
      throw new Error('kod');
    } catch (er) { hatimHata(er); e.target.disabled = false; e.target.textContent = 'Halkayı kur'; }
  };
}
function sHatim(m, kod, yeni) {
  let h = oku('hatimOnbellek.' + kod, null); const burada = bekci();
  const ciz = () => {
    if (!h) { m.innerHTML = '<div class="kart"><p class="soluk" style="margin:0">Yükleniyor…</p></div>'; return; }
    const a = oku('fbGiris', {}), w = haftaNo(), benim = Object.entries(h.slotlar).find(([, x]) => x.uid && x.uid === a.uid), kurucu = h.kuran === a.uid;
    const okunanSay = Object.keys(h.okunan || {}).length, slot = benim ? +benim[0] : 0;
    const benimCuz = slot ? hatimCuzu(h, slot, w) : 0, okudum = slot && h.okunan && h.okunan['s' + sn(slot)];
    let ust = `<div class="kart hatim-ust"><h2>${esc(h.ad)}</h2><div class="hatim-kod"><span>Halka kodu</span><b>${esc(kod)}</b><button class="cip" id="ht-paylas">Davet et</button></div>
      <div class="ilerleme koyu"><i style="width:${okunanSay / 30 * 100}%"></i></div><div class="soluk">Bu hafta (${haftaAraligi(w)}): ${okunanSay}/30 cüz okundu${okunanSay === 30 ? ' · Hatim tamam, Allah kabul etsin 🤲' : ''}</div></div>`;
    if (yeni) ust += `<div class="kart dua-kart"><p style="margin:0">Halka kuruldu. Kodu sevdiklerinize gönderin; katılan herkes boş bir cüzü seçebilir.</p></div>`;
    if (slot) {
      const [s1, s2] = cuzSayfalari(benimCuz);
      ust += `<div class="kart hatim-ben ${okudum ? 'okundu' : ''}"><small>Bu haftaki cüzün</small><b>${benimCuz}. Cüz</b><span class="soluk">Sayfa ${s1}–${s2}</span>
        <div class="hatim-dugme"><button class="btn" id="ht-oku">📖 Oku</button>${okudum ? '<button class="btn" id="ht-geri">✓ Okudum (geri al)</button>' : '<button class="btn ana" id="ht-okudum">✓ Okudum</button>'}</div>
        ${okudum ? `<p class="soluk" style="margin:8px 0 0">Allah kabul etsin. Gelecek hafta ${benimCuz % 30 + 1}. cüz sende.</p>` : ''}</div>`;
    } else ust += `<div class="kart"><p style="margin:0"><b>Halkaya katılmak için</b> aşağıdan boş bir cüz seçin ya da sizin için ayrılmış adı seçin.</p></div>`;
    const satirlar = Array.from({ length: 30 }, (_, i) => {
      const n = i + 1, x = h.slotlar[n] || { ad: '', uid: null }, c = hatimCuzu(h, n, w), ok = h.okunan && h.okunan['s' + sn(n)];
      let sag = '';
      if (!x.ad && !x.uid) sag = slot ? '<span class="soluk">boş</span>' : `<button class="cip" data-al="${n}">Bunu al</button>`;
      else if (!x.uid) sag = slot ? '<span class="soluk">ayrıldı</span>' : `<button class="cip" data-al="${n}">Bu benim</button>`;
      else sag = ok ? '<span class="ht-ok">✓ okudu</span>' : '<span class="soluk">okunacak</span>';
      return `<div class="ht-satir ${x.uid && x.uid === a.uid ? 'ben' : ''}"><span class="no">${c}</span><span class="orta"><b>${x.ad ? esc(x.ad) : '<i class="soluk">Boş</i>'}${!x.uid && x.ad ? ' <small class="soluk">(ayrıldı)</small>' : ''}</b><span class="soluk">${c}. cüz bu hafta</span></span>${sag}${kurucu ? `<button class="ht-yonet" data-yonet="${n}" aria-label="Düzenle">⋯</button>` : ''}</div>`;
    }).join('');
    m.innerHTML = ust + `<div class="kategori-baslik">Halkadakiler ve bu haftaki cüzleri</div><div class="liste">${satirlar}</div>
      ${slot ? '<button class="btn tam" id="ht-ayril">Halkadan ayrıl</button>' : ''}<button class="btn tam" id="ht-yenile">↻ Yenile</button>`;
    $('#ht-paylas').onclick = () => paylas(`“${h.ad}” hatim halkasına katıl! Üç Nur uygulamasında Hatim Halkası bölümüne bu kodu yaz: ${kod}\nHer hafta birer cüz okuyup birlikte hatim indirelim.`, 'Hatim Halkası');
    $('#ht-yenile').onclick = yukle;
    if ($('#ht-oku')) $('#ht-oku').onclick = () => sayfa(mm => sMushaf(mm, cuzSayfalari(benimCuz)[0]), `${benimCuz}. Cüz`);
    if ($('#ht-okudum')) $('#ht-okudum').onclick = () => okunduYap(slot, benimCuz, true);
    if ($('#ht-geri')) $('#ht-geri').onclick = () => okunduYap(slot, benimCuz, false);
    if ($('#ht-ayril')) $('#ht-ayril').onclick = async () => { const ok = await sor({ baslik: 'Halkadan ayrılmak istiyor musunuz?', aciklama: 'Onaylamak için EVET yazın.', yer: 'EVET', tamam: 'Ayrıl' }); if (!ok || trKucuk(ok) !== 'evet') return; slotYaz(slot, { ad: '', uid: null }, () => hatimYerelKaydet(h, 0)); };
    m.querySelectorAll('[data-al]').forEach(b => b.onclick = async () => {
      const n = +b.dataset.al, x = h.slotlar[n] || {};
      const ad = x.ad || await sor({ baslik: 'Halkada görünecek adınız', deger: oku('hatimAd', ''), yer: 'Ör. Ahmet', tamam: 'Katıl' }); if (!ad) return;
      yaz('hatimAd', x.ad ? oku('hatimAd', ad) : ad);
      slotYaz(n, { ad, uid: (await fbGiris()).uid }, () => { hatimYerelKaydet(h, n); toast('Halkaya katıldınız. Allah kolaylık versin.'); });
    });
    m.querySelectorAll('[data-yonet]').forEach(b => b.onclick = async () => {
      const n = +b.dataset.yonet, x = h.slotlar[n] || {};
      const ad = await sor({ baslik: `${n}. sıraya isim yaz`, aciklama: 'Uygulamayı kullanmayan biri için de cüz ayırabilirsiniz. Boş bırakırsanız sıra boşalır.', deger: x.ad || '', yer: 'Ör. Ayşe teyze', tamam: 'Kaydet' });
      if (ad === null) return;
      slotYaz(n, ad ? { ad, uid: x.uid && x.ad === ad ? x.uid : null } : { ad: '', uid: null }, () => { if (x.uid === a.uid && !ad) hatimYerelKaydet(h, 0); });
    });
  };
  const slotYaz = async (n, veri, sonra) => {
    const x = h.slotlar[n];
    try {
      await fbCommit([{ update: { name: `${fbKok()}/hatimler/${kod}/cuzler/${sn(n)}`, fields: fenc(veri) }, ...(x && x.ut ? { currentDocument: { updateTime: x.ut } } : {}) }]);
      sonra && sonra(); titres();
    } catch (e) { hatimHata(e); }
    yukle();
  };
  const okunduYap = async (slot, cuz, ok) => {
    const w = haftaNo(), alan = 's' + sn(slot);
    try {
      const a = await fbGiris();
      await fb(`/hatimler/${kod}/haftalar/${w}?updateMask.fieldPaths=${alan}`, { method: 'PATCH', body: { fields: ok ? { [alan]: fv({ uid: a.uid, ad: (h.slotlar[slot] || {}).ad || '', cuz, t: Date.now() }) } : {} } });
      yaz(`hatimOkudum.${kod}.${w}`, ok); bildirimPlanla();
      if (ok) { titres('HEAVY'); toast('Allah kabul etsin 🤲 Gelecek hafta ' + (cuz % 30 + 1) + '. cüz sende.', 3500); }
    } catch (e) { hatimHata(e); }
    yukle();
  };
  const yukle = async () => {
    try {
      const y = await hatimGetir(kod);
      if (!y) { if (burada()) m.innerHTML = '<div class="kart"><p style="margin:0">Bu kodla bir hatim halkası bulunamadı. Kodu kontrol edin.</p></div>'; yaz('hatimlerim', hatimlerim().filter(x => x.kod !== kod)); return; }
      h = y;
      // Yerel listeyi sunucudaki duruma göre düzelt (kurucu sırayı boşalttıysa vb.)
      const a = oku('fbGiris', {}), benim = Object.entries(h.slotlar).find(([, x]) => x.uid && x.uid === a.uid), yerel = hatimlerim().find(x => x.kod === kod);
      if (benim && (!yerel || yerel.slot !== +benim[0] || yerel.ad !== h.ad)) hatimYerelKaydet(h, +benim[0]);
      if (!benim && yerel) hatimYerelKaydet(h, 0);
      const ok = benim && h.okunan['s' + sn(+benim[0])]; yaz(`hatimOkudum.${kod}.${haftaNo()}`, !!ok);
    } catch (e) { if (!burada()) return; if (!h) { m.innerHTML = '<div class="kart"><p style="margin:0">İnternete bağlanılamadı. Hatim halkası için internet gerekir.</p></div>'; return; } toast('Güncel durum alınamadı (internet yok)'); }
    if (burada()) ciz();
  };
  ciz(); yukle();
}
