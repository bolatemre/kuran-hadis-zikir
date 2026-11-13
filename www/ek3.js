// Üç Nur — birlikte ibadet halkaları: ruhuna hatim / Yâsîn, ortak zikir hedefi, dua halkası.
// Veri: halkalar/{KOD} {tur, bicim, ad, kisi, birim, hedef, aciklama, kuran, t}
//       halkalar/{KOD}/katki/{uid} {ad, n, t} · halkalar/{KOD}/parcalar/{01..30} {ad, uid, ok, t}
(function () {
  const INDIR = 'tinyurl.com/ucnur';
  // ---------- Ortak yardımcılar ----------
  const say = n => Number(n || 0).toLocaleString('tr-TR');
  const gunEk = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const son7 = () => Array.from({ length: 7 }, (_, i) => gunEk(new Date(), i - 6));
  const artir = (anahtar, n) => yaz(anahtar, oku(anahtar, 0) + n);
  const hazir = () => typeof hatimHazir === 'function' && hatimHazir();
  function onay(baslik, aciklama, tamam) {
    return new Promise(son => {
      const k = document.createElement('div'); k.className = 'sor-zemin';
      k.innerHTML = `<div class="sor-kutu"><b>${esc(baslik)}</b>${aciklama ? `<p class="soluk">${esc(aciklama)}</p>` : ''}<div class="sor-alt"><button class="btn" id="o-hayir">Vazgeç</button><button class="btn ana" id="o-evet">${esc(tamam || 'Evet')}</button></div></div>`;
      document.body.appendChild(k);
      const bitir = v => { k.remove(); son(v); };
      k.querySelector('#o-hayir').onclick = () => bitir(false); k.querySelector('#o-evet').onclick = () => bitir(true);
      k.onclick = e => { if (e.target === k) bitir(false); };
      temizlik.push(() => k.isConnected && bitir(false));
    });
  }
  async function adSor() {
    const ad = await sor({ baslik: 'Halkada görünecek adınız', deger: oku('hatimAd', ''), yer: 'Ör. Ahmet', tamam: 'Tamam', uzunluk: 30 });
    if (ad) yaz('hatimAd', ad);
    return ad;
  }
  // Telefonun kendi paylaşım penceresi (WhatsApp vb.); eklenti yoksa eski yönteme (kopyalama) döner
  const eskiPaylas = paylas;
  paylas = function (metin, baslik) {
    const S = eklenti('Share');
    if (NATIVE && S && S.share) { S.share({ title: baslik || 'Üç Nur', text: metin, dialogTitle: 'Paylaş' }).catch(e => { if (!/cancel|iptal/i.test(String(e && e.message))) eskiPaylas(metin, baslik); }); return; }
    eskiPaylas(metin, baslik);
  };

  // =====================================================================
  // HALKALAR: ruhuna hatim / Yâsîn, ortak zikir, dua
  // =====================================================================
  const TUR = {
    ruh: { ikon: '🕊', ad: 'Ruhuna Hatim / Yâsîn', alt: 'Vefat eden bir yakınınız için cüzleri ya da Yâsîn’leri paylaşın' },
    zikir: { ikon: '📿', ad: 'Ortak Zikir Hedefi', alt: 'Ailece 100.000 salavat gibi bir hedefi birlikte doldurun' },
    dua: { ikon: '🤲', ad: 'Dua Halkası', alt: 'Hasta, sınav, sıkıntı… sevdiklerinizden dua isteyin' },
  };
  const RUH_SECENEK = [['hatim', 'Hatim (30 cüz paylaşılır)', 30, 'cüz'], ['yasin', 'Yâsîn-i Şerîf', 41, 'Yâsîn'], ['ihlas', 'İhlâs-ı Şerîf', 1000, 'İhlâs'], ['fatiha', 'Fâtiha-i Şerîfe', 100, 'Fâtiha']];
  const ZIKIR_SECENEK = ['Salavat-ı Şerîfe', 'Kelime-i Tevhid', 'İstiğfar (Estağfirullah)', 'Sübhânallah', 'Hasbünallâhü ve ni‘me’l-vekîl', 'Lâ havle ve lâ kuvvete illâ billâh'];
  const halkalarim = () => oku('halkalarim', []);
  function halkaYerel(h, sil) { let l = halkalarim(); const y = { kod: h.kod, tur: h.tur, ad: h.ad }; if (sil) l = l.filter(x => x.kod !== h.kod); else if (l.some(x => x.kod === h.kod)) l = l.map(x => x.kod === h.kod ? y : x); else l.unshift(y); yaz('halkalarim', l); }
  async function halkaGetir(kod) {
    const [d, k, p] = await Promise.all([fb(`/halkalar/${kod}`, { yoksaNull: true }), fb(`/halkalar/${kod}/katki?pageSize=300`, { yoksaNull: true }), fb(`/halkalar/${kod}/parcalar?pageSize=30`, { yoksaNull: true })]);
    if (!d) return null;
    const h = { kod, ...fdec(d.fields), katki: {}, parca: {} };
    ((k && k.documents) || []).forEach(x => { h.katki[x.name.split('/').pop()] = fdec(x.fields); });
    ((p && p.documents) || []).forEach(x => { h.parca[+x.name.split('/').pop()] = fdec(x.fields); });
    yaz('halkaOnbellek.' + kod, h);
    return h;
  }
  const halkaHata = e => toast(e && (e.durum === 'FAILED_PRECONDITION' || e.durum === 'ALREADY_EXISTS') ? 'Bu cüz az önce başkası tarafından alındı. Liste yenilendi.' : e && e.durum === 'PERMISSION_DENIED' ? 'Bu işlem için izin yok.' : 'İnternete bağlanılamadı. Biraz sonra tekrar deneyin.', 3500);
  const davetMetni = h => `“${h.ad}” halkasına sen de katıl 🤍\nÜç Nur uygulamasında Bugün › Halkalar bölümüne bu kodu yaz: ${h.kod}\nUygulama ücretsiz: ${INDIR}`;
  const bitisDuasi = h => h.tur !== 'ruh' ? '' : `Allah’ım! Okuduğumuz ${h.bicim === 'cuz' ? 'bu Kur’ân-ı Kerîm’i' : 'bu ' + h.birim + '’leri'} dergâh-ı izzetinde kabul eyle. Hâsıl olan sevabı önce Peygamber Efendimizin (s.a.v.) mübarek ruhuna, sonra ${h.kisi || 'merhumun'} ruhuna hediye eyledik; vâsıl eyle. Kabrini nur, mekânını cennet eyle. Bizleri de sevdiklerimizle cennetinde buluştur. Âmin.`;

  function sBirlikte(m) {
    const l = halkalarim();
    m.innerHTML = `<div class="kart b3-ust"><div class="b3-ikon">🤝</div><h2>Birlikte İbadet Halkaları</h2><p class="soluk">Sevdiklerinizle aynı niyette buluşun: bir kod paylaşın, herkes kendi telefonundan katılsın.</p></div>
      ${l.length ? `<div class="kategori-baslik">Halkalarım</div><div class="liste" id="b3-liste">${l.map(h => `<button data-kod="${h.kod}"><span class="no">${(TUR[h.tur] || TUR.zikir).ikon}</span><span class="orta"><b>${esc(h.ad)}</b><span class="soluk">${esc((TUR[h.tur] || TUR.zikir).ad)} · Kod ${h.kod}</span></span><span class="soluk">›</span></button>`).join('')}</div>` : ''}
      <div class="kategori-baslik">Yeni halka kur</div>
      ${Object.entries(TUR).map(([k, t]) => `<button class="b3-tur" data-tur="${k}"><span>${t.ikon}</span><span><b>${t.ad}</b><small>${t.alt}</small></span><i>›</i></button>`).join('')}
      <button class="b3-tur" id="b3-hatim"><span>📖</span><span><b>Haftalık Hatim Halkası</b><small>Herkes haftada bir cüz okur, her hafta bir hatim</small></span><i>›</i></button>
      <div class="kart" style="margin-top:4px"><h2>Bir halkaya katıl</h2><div class="kod-satir"><input class="giris kod-giris" id="b3-kod" maxlength="6" placeholder="KOD" autocomplete="off" autocapitalize="characters"><button class="btn ana" id="b3-katil">Katıl</button></div>
        <p class="soluk" style="margin:8px 0 0">Size gönderilen 6 haneli kodu yazın.</p></div>`;
    if (!hazir()) { m.querySelectorAll('.b3-tur,[id="b3-katil"]').forEach(b => b.onclick = () => toast('Bu bölüm çok yakında açılacak.')); return; }
    if ($('#b3-liste')) $('#b3-liste').onclick = e => { const b = e.target.closest('[data-kod]'); if (b) sayfa(mm => sHalka(mm, b.dataset.kod), 'Halka'); };
    m.querySelectorAll('[data-tur]').forEach(b => b.onclick = () => sayfa(mm => sHalkaKur(mm, b.dataset.tur), TUR[b.dataset.tur].ad));
    $('#b3-hatim').onclick = () => sayfa(sHatimler, 'Hatim Halkası');
    $('#b3-kod').oninput = e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); };
    $('#b3-katil').onclick = async e => {
      const kod = $('#b3-kod').value.trim(); if (kod.length !== 6) { toast('Kod 6 haneli olmalı'); return; }
      e.target.disabled = true;
      try {
        if (await fb(`/halkalar/${kod}`, { yoksaNull: true })) sayfa(mm => sHalka(mm, kod), 'Halka');
        else sayfa(mm => sHatim(mm, kod), 'Hatim Halkası'); // haftalık hatim halkası kodu olabilir
      } catch (er) { halkaHata(er); }
      e.target.disabled = false;
    };
  }

  function sHalkaKur(m, tur) {
    const ben = `<label class="soluk">Sizin adınız (halkada görünecek)</label><input class="giris" id="hk-ben" maxlength="30" value="${esc(oku('hatimAd', ''))}" placeholder="Ör. Emre">`;
    const form = tur === 'ruh' ? `<label class="soluk">Kimin için?</label><input class="giris" id="hk-kisi" maxlength="50" placeholder="Ör. Babam Ahmet Bolat">
        <label class="soluk">Ne okunacak?</label><select class="sec" id="hk-ne">${RUH_SECENEK.map(x => `<option value="${x[0]}">${x[1]}</option>`).join('')}</select>
        <div id="hk-hedef-kutu" hidden><label class="soluk">Kaç tane okunsun?</label><input class="giris" id="hk-hedef" inputmode="numeric" maxlength="7" value="41"></div>
        <label class="soluk">Not (isteğe bağlı)</label><input class="giris" id="hk-not" maxlength="200" placeholder="Ör. 40. gecesi 12 Aralık’ta dua edilecek">`
      : tur === 'zikir' ? `<label class="soluk">Halkanın adı</label><input class="giris" id="hk-ad" maxlength="60" placeholder="Ör. Ailece 100.000 Salavat">
        <label class="soluk">Hangi zikir?</label><select class="sec" id="hk-zikir">${ZIKIR_SECENEK.map(x => `<option>${x}</option>`).join('')}<option value="">Başka (kendim yazacağım)</option></select>
        <input class="giris" id="hk-zikir2" maxlength="60" placeholder="Zikri yazın" hidden style="margin-top:8px">
        <label class="soluk">Hedef</label><select class="sec" id="hk-hedef-sec"><option>1000</option><option>4444</option><option>10000</option><option>70000</option><option selected>100000</option><option value="">Başka sayı</option></select>
        <input class="giris" id="hk-hedef" inputmode="numeric" maxlength="8" placeholder="Hedef sayı" hidden style="margin-top:8px">`
      : `<label class="soluk">Dua isteğinin başlığı</label><input class="giris" id="hk-ad" maxlength="60" placeholder="Ör. Annem için şifa duası">
        <label class="soluk">Ne için dua istiyorsunuz?</label><textarea class="giris" id="hk-not" rows="3" maxlength="300" placeholder="Ör. Annem yarın ameliyat olacak. Şifa bulması için dualarınızı bekliyoruz."></textarea>`;
    m.innerHTML = `<div class="kart"><h2>${TUR[tur].ikon} ${TUR[tur].ad}</h2>${form}${ben}<button class="btn ana tam" id="hk-kur">Halkayı kur</button></div>`;
    const sayiAl = el => Math.floor(+String(el.value).replace(/\D/g, ''));
    if (tur === 'ruh') $('#hk-ne').onchange = e => { const s = RUH_SECENEK.find(x => x[0] === e.target.value); $('#hk-hedef-kutu').hidden = s[0] === 'hatim'; $('#hk-hedef').value = s[2]; };
    if (tur === 'zikir') { $('#hk-zikir').onchange = e => { $('#hk-zikir2').hidden = !!e.target.value; }; $('#hk-hedef-sec').onchange = e => { $('#hk-hedef').hidden = !!e.target.value; }; }
    $('#hk-kur').onclick = async e => {
      const benAd = $('#hk-ben').value.trim(); let v;
      if (tur === 'ruh') {
        const kisi = $('#hk-kisi').value.trim(), s = RUH_SECENEK.find(x => x[0] === $('#hk-ne').value), hedef = s[0] === 'hatim' ? 30 : sayiAl($('#hk-hedef'));
        if (!kisi) { toast('Kimin için olduğunu yazın'); return; }
        v = { ad: `${kisi} ruhuna ${s[0] === 'hatim' ? 'hatim' : s[3]}`, kisi, bicim: s[0] === 'hatim' ? 'cuz' : 'sayac', birim: s[3], hedef, aciklama: $('#hk-not').value.trim() };
      } else if (tur === 'zikir') {
        const birim = ($('#hk-zikir').value || $('#hk-zikir2').value).trim(), hedef = $('#hk-hedef-sec').value ? +$('#hk-hedef-sec').value : sayiAl($('#hk-hedef'));
        v = { ad: $('#hk-ad').value.trim() || `${say(hedef)} ${birim}`, bicim: 'sayac', birim, hedef, aciklama: '' };
        if (!birim) { toast('Zikri yazın'); return; }
      } else v = { ad: $('#hk-ad').value.trim(), bicim: 'dua', birim: 'dua', hedef: 0, aciklama: $('#hk-not').value.trim() };
      if (!v.ad || !benAd) { toast('Başlığı ve kendi adınızı yazın'); return; }
      if (v.bicim === 'sayac' && !(v.hedef >= 1 && v.hedef <= 100000000)) { toast('Hedef sayıyı yazın'); return; }
      yaz('hatimAd', benAd); e.target.disabled = true; e.target.textContent = 'Kuruluyor…';
      try {
        const a = await fbGiris();
        for (let deneme = 0; deneme < 4; deneme++) {
          const kod = hatimKoduUret(), kok = fbKok() + '/halkalar/' + kod;
          try {
            await fbCommit([{ update: { name: kok, fields: fenc({ tur, ...v, kuran: a.uid, t: Date.now() }) }, currentDocument: { exists: false } },
              { update: { name: `${kok}/katki/${a.uid}`, fields: fenc({ ad: benAd, n: 0, t: Date.now() }) } }]);
            halkaYerel({ kod, tur, ad: v.ad }); yigin.pop(); sayfa(mm => sHalka(mm, kod, true), 'Halka'); return;
          } catch (er) { if (er.durum !== 'ALREADY_EXISTS' && er.durum !== 'FAILED_PRECONDITION') throw er; }
        }
        throw new Error('kod');
      } catch (er) { halkaHata(er); e.target.disabled = false; e.target.textContent = 'Halkayı kur'; }
    };
  }

  function sHalka(m, kod, yeni) {
    let h = oku('halkaOnbellek.' + kod, null), zaman = null, bekleyen = false; const burada = bekci();
    const uid = () => (oku('fbGiris', {}) || {}).uid;
    const benimN = () => Math.max(oku('halkaBenim.' + kod, 0), ((h && h.katki[uid()]) || {}).n || 0);
    const toplam = () => Object.entries(h.katki).reduce((a, [u, x]) => a + (u === uid() ? 0 : (x.n || 0)), 0) + benimN();
    const gonder = async () => {
      clearTimeout(zaman); if (!bekleyen) return; bekleyen = false;
      try { const a = await fbGiris(), n = benimN(), ad = oku('hatimAd', '') || 'Bir kardeşiniz'; await fb(`/halkalar/${kod}/katki/${a.uid}`, { method: 'PATCH', body: { fields: fenc({ ad, n, t: Date.now() }) } }); h.katki[a.uid] = { ad, n }; }
      catch (e) { bekleyen = true; }
    };
    const ekle = async n => {
      if (!oku('hatimAd', '') && !(await adSor())) return;
      halkaYerel(h); yaz('halkaBenim.' + kod, Math.min(100000000, benimN() + n)); artir('halkaGunluk.' + ymd(new Date()), n);
      bekleyen = true; clearTimeout(zaman); zaman = setTimeout(gonder, h.bicim === 'dua' ? 50 : 1500); titres(); sayilar();
      if (h.bicim === 'sayac' && toplam() >= h.hedef && toplam() - n < h.hedef) { titres('HEAVY'); toast('Hedef tamamlandı. Allah kabul etsin 🤲', 3500); gonder().then(() => burada() && ciz()); }
    };
    const sayilar = () => { // sayaca her dokunuşta bütün sayfayı yeniden çizmeden sayıları tazeler
      const t = toplam(), el = (s, v) => { const x = m.querySelector(s); if (x) x.textContent = v; };
      el('#b3-benim', say(benimN())); el('#b3-top', say(t));
      const c = m.querySelector('#b3-bar'); if (c && h.hedef) c.style.width = Math.min(100, t / h.hedef * 100) + '%';
    };
    const uyeler = () => { const l = Object.entries(h.katki).map(([u, x]) => ({ u, ad: x.ad, n: u === uid() ? benimN() : (x.n || 0) })).sort((a, b) => b.n - a.n);
      return l.length ? `<div class="kategori-baslik">Halkadakiler (${l.length})</div><div class="kart">${l.map(x => `<div class="b3-uye ${x.u === uid() ? 'ben' : ''}"><span>${esc(x.ad || 'Bir kardeşimiz')}</span>${h.bicim === 'dua' ? `<span class="soluk">${x.n ? '🤲 dua etti' : 'katıldı'}</span>` : `<b>${say(x.n)}</b>`}</div>`).join('')}</div>` : ''; };
    const ciz = () => {
      if (!h) { m.innerHTML = '<div class="kart"><p class="soluk" style="margin:0">Yükleniyor…</p></div>'; return; }
      const t = TUR[h.tur] || TUR.zikir, top = h.bicim === 'cuz' ? Object.values(h.parca).filter(x => x.ok).length : toplam(), bitti = h.bicim !== 'dua' && top >= h.hedef;
      let g = `<div class="kart b3-ust"><div class="b3-ikon">${t.ikon}</div><h2>${esc(h.ad)}</h2>${h.aciklama ? `<p>${esc(h.aciklama)}</p>` : ''}
        <div class="b3-kod"><span class="soluk">Kod</span><b>${esc(kod)}</b><button class="cip" id="b3-davet">Davet et</button></div></div>`;
      if (yeni) g += `<div class="kart dua-kart"><p style="margin:0">Halka kuruldu. “Davet et” ile kodu sevdiklerinize gönderin.</p></div>`;
      if (bitti) g += `<div class="kart b3-dua"><h2>${h.bicim === 'cuz' ? 'Hatim tamamlandı' : 'Hedef tamamlandı'} 🤲</h2><p>${esc(bitisDuasi(h) || 'Allah hepinizden razı olsun, okuduklarınızı kabul eylesin.')}</p></div>`;
      if (h.bicim === 'dua') {
        const eden = Object.values(h.katki).filter(x => x.n > 0).length + (benimN() > 0 && !((h.katki[uid()] || {}).n > 0) ? 1 : 0);
        g += `<div class="kart" style="text-align:center"><div class="b3-toplam"><span id="b3-eden">${say(eden)}</span> <small>kişi dua etti</small></div>
          <button class="btn ana tam" id="b3-dua" style="margin-top:12px">🤲 ${benimN() ? 'Tekrar dua ettim' : 'Dua ettim'}</button>
          <p class="soluk" style="margin:10px 0 0">“Bir Müslümanın, din kardeşi için gıyabında ettiği dua kabul olunur.” (Müslim, Zikir, 88)</p></div>`;
      } else if (h.bicim === 'sayac') {
        g += `<div class="kart" style="text-align:center"><div class="b3-toplam"><span id="b3-top">${say(top)}</span> <small>/ ${say(h.hedef)} ${esc(h.birim)}</small></div><div class="b3-cubuk"><i id="b3-bar" style="width:${Math.min(100, top / h.hedef * 100)}%"></i></div>
          <button class="b3-say" id="b3-say" aria-label="Say"><b id="b3-benim">${say(benimN())}</b><span>benim okuduğum<br>dokun, say</span></button>
          <div class="b3-hizli">${(h.tur === 'ruh' ? [1, 3, 7] : [10, 33, 100]).map(n => `<button class="cip" data-ekle="${n}">+${n}</button>`).join('')}<button class="cip" id="b3-yaz">Sayı yaz</button>${h.birim === 'Yâsîn' ? '<button class="cip" id="b3-oku">📖 Yâsîn’i aç</button>' : ''}</div>
          <p class="soluk" style="margin:6px 0 0">${esc(h.birim)} okudukça sayaca dokunun; okuduklarınız ortak hedefe eklenir.</p></div>`;
      } else {
        const benimkiler = Object.entries(h.parca).filter(([, x]) => x.uid === uid());
        g += `<div class="kart" style="text-align:center"><div class="b3-toplam">${top} <small>/ 30 cüz okundu</small></div><div class="b3-cubuk"><i style="width:${top / 30 * 100}%"></i></div>
          <p class="soluk" style="margin:0">Boş bir cüze dokunarak alın. Uygulamayı kullanmayan biri için de onun adına cüz alabilirsiniz.</p></div>
          ${benimkiler.length ? `<div class="kategori-baslik">Aldığım cüzler</div><div class="kart">${benimkiler.map(([n, x]) => `<div class="b3-benim"><span><b>${n}. cüz</b> <small class="soluk">${esc(x.ad)}</small></span><button class="btn" data-oku="${n}">📖 Oku</button>${x.ok ? `<button class="btn" data-ok="${n}" data-v="0">✓ Geri al</button>` : `<button class="btn ana" data-ok="${n}" data-v="1">✓ Okudum</button><button class="btn" data-birak="${n}">Bırak</button>`}</div>`).join('')}</div>` : ''}
          <div class="kategori-baslik">Cüzler</div><div class="b3-cuzler">${Array.from({ length: 30 }, (_, i) => { const n = i + 1, x = h.parca[n];
            return `<button class="b3-cuz ${x ? 'alindi' : ''} ${x && x.uid === uid() ? 'ben' : ''} ${x && x.ok ? 'ok' : ''}" data-cuz="${n}"><b>${n}</b><small>${x ? (x.ok ? '✓ ' : '') + esc(x.ad) : 'boş'}</small></button>`; }).join('')}</div>`;
      }
      m.innerHTML = g + (h.bicim === 'cuz' ? '' : uyeler()) + `<button class="btn tam" id="b3-yenile" style="margin-top:12px">↻ Yenile</button><button class="btn tam" id="b3-cikar">Listemden çıkar</button>`;
      $('#b3-davet').onclick = () => paylas(davetMetni(h), h.ad);
      $('#b3-yenile').onclick = () => gonder().then(yukle);
      $('#b3-cikar').onclick = async () => { if (!(await onay('Bu halka listenizden çıkarılsın mı?', 'Okuduklarınız halkada kalır. Kodu yazarak tekrar katılabilirsiniz.', 'Çıkar'))) return; halkaYerel(h, true); geri(); };
      if ($('#b3-dua')) $('#b3-dua').onclick = async () => { await ekle(1); if (!oku('hatimAd', '')) return; toast('Allah kabul etsin 🤲'); ciz(); };
      if ($('#b3-say')) $('#b3-say').onclick = () => ekle(1);
      m.querySelectorAll('[data-ekle]').forEach(b => b.onclick = () => ekle(+b.dataset.ekle));
      if ($('#b3-yaz')) $('#b3-yaz').onclick = async () => { const s = await sor({ baslik: `Kaç ${h.birim} okudunuz?`, aciklama: 'Yazdığınız sayı okuduklarınıza eklenir.', yer: 'Ör. 500', tamam: 'Ekle', uzunluk: 7 }); const n = Math.floor(+String(s || '').replace(/\D/g, '')); if (n > 0) ekle(n); };
      if ($('#b3-oku')) $('#b3-oku').onclick = () => sayfa(mm => sOku(mm, 36, 1), 'Yâsîn');
      m.querySelectorAll('[data-cuz]').forEach(b => b.onclick = async () => {
        const n = +b.dataset.cuz, x = h.parca[n];
        if (x) { toast(x.uid === uid() ? `${n}. cüz sizde (${x.ad})` : `${n}. cüzü ${x.ad} aldı${x.ok ? ' ve okudu' : ''}`); return; }
        const ad = await sor({ baslik: `${n}. cüzü kim okuyacak?`, aciklama: 'Kendi adınızı ya da adına aldığınız kişinin adını yazın.', deger: oku('hatimAd', ''), yer: 'Ör. Ayşe teyze', tamam: 'Cüzü al', uzunluk: 30 }); if (!ad) return;
        if (!oku('hatimAd', '')) yaz('hatimAd', ad);
        try { const a = await fbGiris(); await fbCommit([{ update: { name: `${fbKok()}/halkalar/${kod}/parcalar/${sn(n)}`, fields: fenc({ ad, uid: a.uid, ok: false, t: Date.now() }) }, currentDocument: { exists: false } }]); halkaYerel(h); titres(); toast(`${n}. cüz alındı. Allah kolaylık versin.`); }
        catch (e) { halkaHata(e); }
        yukle();
      });
      m.querySelectorAll('[data-oku]').forEach(b => b.onclick = () => sayfa(mm => sMushaf(mm, cuzSayfalari(+b.dataset.oku)[0]), `${b.dataset.oku}. Cüz`));
      m.querySelectorAll('[data-ok]').forEach(b => b.onclick = async () => {
        const n = +b.dataset.ok, ok = b.dataset.v === '1', x = h.parca[n];
        try { await fb(`/halkalar/${kod}/parcalar/${sn(n)}`, { method: 'PATCH', body: { fields: fenc({ ad: x.ad, uid: x.uid, ok, t: Date.now() }) } }); artir('halkaCuz.' + ymd(new Date()), ok ? 1 : -1); if (ok) { titres('HEAVY'); toast('Allah kabul etsin 🤲'); } }
        catch (e) { halkaHata(e); }
        yukle();
      });
      m.querySelectorAll('[data-birak]').forEach(b => b.onclick = async () => {
        if (!(await onay(`${b.dataset.birak}. cüz bırakılsın mı?`, 'Cüz boşa çıkar, başkası alabilir.', 'Bırak'))) return;
        try { await fb(`/halkalar/${kod}/parcalar/${sn(+b.dataset.birak)}`, { method: 'DELETE' }); } catch (e) { halkaHata(e); }
        yukle();
      });
    };
    const yukle = async () => {
      try {
        const y = await halkaGetir(kod);
        if (!y) { if (burada()) m.innerHTML = '<div class="kart"><p style="margin:0">Bu kodla bir halka bulunamadı. Kodu kontrol edin.</p></div>'; halkaYerel({ kod }, true); return; }
        h = y; halkaYerel(h);
        if (benimN() > ((h.katki[uid()] || {}).n || 0)) { bekleyen = true; gonder(); } // internet yokken sayılanlar
      } catch (e) { if (!burada()) return; if (!h) { m.innerHTML = '<div class="kart"><p style="margin:0">İnternete bağlanılamadı. Halkalar için internet gerekir.</p></div>'; return; } toast('Güncel durum alınamadı (internet yok)'); }
      if (burada()) ciz();
    };
    temizlik.push(() => { gonder(); });
    ciz(); yukle();
  }

  Object.assign(window, { sBirlikte, sHalka, sHalkaKur, U3: { INDIR, say, gunEk, son7, artir, onay } });
})();
