// Ana ekran araç takımı (widget): seçili konumun 31 günlük vakitlerini telefona bırakır.
// Araç takımı bu veriyle sıradaki vakti vurgular ve geri sayımı kendisi yapar; uygulama açık olmasa da çalışır.
let widgetZaman = null;
function widgetGuncelle() {
  const W = eklenti('WidgetVeri'); if (!NATIVE || !W) return;
  try {
    const gunler = [], b = new Date(); b.setHours(12, 0, 0, 0);
    for (let g = -1; g < 30; g++) { const d = new Date(b); d.setDate(d.getDate() + g); gunler.push({ t: ymd(d), v: gunVakitleri(d).v.map(x => x.getTime()), h: widgetHicri(d) }); }
    W.kaydet({ veri: JSON.stringify({ konum: konumAdi(), gunler }) }).catch(() => {});
  } catch (e) {}
}
function widgetHicri(d) { try { return String(hicri(d) || '').replace(/\s*\(yaklaşık\)$/, ''); } catch (e) { return ''; } }
function widgetYakinda() { clearTimeout(widgetZaman); widgetZaman = setTimeout(widgetGuncelle, 400); }
// Konum veya Diyanet verisi her değiştiğinde bildirimler yeniden planlanıyor; araç takımı da aynı anda tazelenir
if (typeof bildirimPlanla === 'function') { const eskiPlan = bildirimPlanla; bildirimPlanla = function () { widgetYakinda(); return eskiPlan.apply(this, arguments); }; }
widgetYakinda();
document.addEventListener('visibilitychange', () => { if (!document.hidden) widgetYakinda(); });

// ---------- "Ana ekrana ekle" kartı ----------
// Android'de tek dokunuşla sistemin ekleme penceresi açılır; iPhone'da Apple izin vermediği için adımlar gösterilir.
const WIDGET_CSS = `
.wk-kart{position:relative;display:flex;gap:12px;align-items:center;padding:14px;margin:0 0 14px;border-radius:18px;background:var(--kart);box-shadow:var(--golge)}
.wk-onizleme{flex:none;width:92px;height:92px;border-radius:20px;padding:10px;color:#fff;background:linear-gradient(140deg,#1d6b50,#0f3d2e 55%,#0a2b20);border:1px solid rgba(232,196,110,.3);display:flex;flex-direction:column;justify-content:flex-end;font-size:10px;line-height:1.25}
.wk-onizleme b{color:#e8c46e;font-weight:600}.wk-onizleme strong{font-size:17px;font-variant-numeric:tabular-nums;letter-spacing:-.3px}
.wk-onizleme i{display:block;height:3px;border-radius:2px;margin-top:4px;background:linear-gradient(90deg,#e8c46e 55%,rgba(255,255,255,.2) 55%)}
.wk-metin{flex:1;min-width:0}.wk-metin b{display:block;font-size:15px;margin-bottom:3px}.wk-metin p{margin:0 0 9px;font-size:13px}
.wk-metin .btn{padding:8px 14px;font-size:14px}
.wk-kapat{position:absolute;top:6px;right:8px;width:28px;height:28px;border-radius:50%;font-size:18px;line-height:28px;opacity:.5}
.wk-adim{display:flex;gap:10px;align-items:flex-start;margin:10px 0}.wk-adim span{flex:none;width:24px;height:24px;border-radius:50%;background:#0f3d2e;color:#e8c46e;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center}
.wk-adim div{font-size:14px;line-height:1.4}`;
(function () { const s = document.createElement('style'); s.textContent = WIDGET_CSS; document.head.appendChild(s); })();

let widgetBilgi = null; // { eklenen, sabitlenebilir } — eski sürümde eklenti bu yöntemi bilmiyorsa null kalır
async function widgetDurum() {
  const W = eklenti('WidgetVeri'); if (!NATIVE || !W || !W.durum) return null;
  try { widgetBilgi = await W.durum(); } catch (e) { widgetBilgi = null; }
  return widgetBilgi;
}
function widgetOnizleme() {
  let ad = 'Akşam', kalan = '1:41:00';
  try { const s = siradakiVakit(), ms = Math.max(0, s.t - new Date()), h = Math.floor(ms / 36e5), dk = Math.floor(ms / 6e4) % 60, sn = Math.floor(ms / 1e3) % 60; ad = VAKIT_ADLARI[s.i]; kalan = (h ? h + ':' + String(dk).padStart(2, '0') : dk) + ':' + String(sn).padStart(2, '0'); } catch (e) {}
  return `<div class="wk-onizleme"><b>${esc(ad)} vaktine</b><strong>${kalan}</strong><i></i></div>`;
}
function widgetAdimlari() {
  const ios = PLATFORM === 'ios';
  const adimlar = ios ? [
    'Ana ekranda boş bir yere <b>basılı tutun</b>, simgeler sallanmaya başlasın.',
    'Sol üstteki <b>Düzenle</b> → <b>Araç Takımı Ekle</b>’ye dokunun (eski iOS’ta <b>+</b> düğmesi).',
    'Listeden <b>Üç Nur</b>’u seçin, boyutu kaydırarak beğenin ve <b>Araç Takımı Ekle</b>’ye dokunun.',
    'Kilit ekranına da ekleyebilirsiniz: kilit ekranına basılı tutun → <b>Özelleştir</b> → saatin altındaki alana dokunun → <b>Üç Nur</b>.'
  ] : [
    'Ana ekranda boş bir yere <b>basılı tutun</b>.',
    'Açılan menüden <b>Widget’lar</b>’a dokunun.',
    'Listede <b>Üç Nur</b>’u bulun, istediğiniz boyutu basılı tutup ana ekrana sürükleyin.'
  ];
  const k = document.createElement('div'); k.className = 'sor-zemin';
  k.innerHTML = `<div class="sor-kutu"><b>Vakitleri ana ekrana ekleyin</b><p class="soluk">Sıradaki vakte kalan süre ve günün vakitleri, uygulamayı açmadan ana ekranınızda görünür.</p>
    ${adimlar.map((a, i) => `<div class="wk-adim"><span>${i + 1}</span><div>${a}</div></div>`).join('')}
    <div class="sor-alt"><button class="btn ana" id="wk-tamam">Anladım</button></div></div>`;
  document.body.appendChild(k);
  const kapat = () => k.remove();
  k.querySelector('#wk-tamam').onclick = kapat; k.onclick = e => { if (e.target === k) kapat(); };
  temizlik.push(() => k.isConnected && kapat());
}
async function widgetEkle() {
  const W = eklenti('WidgetVeri');
  if (PLATFORM === 'android' && W && W.ekle && widgetBilgi && widgetBilgi.sabitlenebilir) {
    try { const r = await W.ekle({ boyut: 'buyuk' }); if (r && r.istendi) { toast('Telefonun penceresinden “Ekle”ye dokunun'); return; } } catch (e) {}
  }
  widgetAdimlari();
}
function widgetDugme(cls) { return `<button class="btn ana ${cls}">${PLATFORM === 'android' && widgetBilgi && widgetBilgi.sabitlenebilir ? 'Ana ekrana ekle' : 'Nasıl eklenir?'}</button>`; }
function widgetKartlari() {
  if (!NATIVE || !yigin.length) return;
  const top = yigin[yigin.length - 1].fn, m = $('#icerik'), ekli = widgetBilgi && widgetBilgi.eklenen > 0;
  if (top === sBugun && !ekli && !oku('widgetKartKapali', false) && !m.querySelector('#wk-bugun')) {
    const hedef = m.querySelector('.hizli'); if (!hedef) return;
    hedef.insertAdjacentHTML('afterend', `<div class="wk-kart" id="wk-bugun">${widgetOnizleme()}<div class="wk-metin"><b>Vakitler ana ekranında olsun</b><p class="soluk">Ezana kalan süreyi uygulamayı açmadan görün.</p>${widgetDugme('wk-ekle')}</div><button class="wk-kapat" aria-label="Kapat">×</button></div>`);
    const k = m.querySelector('#wk-bugun');
    k.querySelector('.wk-ekle').onclick = widgetEkle;
    k.querySelector('.wk-kapat').onclick = () => { yaz('widgetKartKapali', true); k.remove(); toast('İsterseniz Vakitler sayfasından ekleyebilirsiniz'); };
  }
  if (top === sVakitler && !m.querySelector('#wk-vakit')) {
    const hedef = m.querySelector('.vakit-liste'); if (!hedef) return;
    hedef.insertAdjacentHTML('afterend', `<div class="wk-kart" id="wk-vakit">${widgetOnizleme()}<div class="wk-metin"><b>Ana ekran araç takımı</b><p class="soluk">${ekli ? 'Ana ekranınızda ekli. Başka boyut da ekleyebilirsiniz.' : 'Vakitler ve geri sayım ana ekranınızda.'}</p>${widgetDugme('wk-ekle')}</div></div>`);
    m.querySelector('#wk-vakit .wk-ekle').onclick = widgetEkle;
  }
}
// Sayfa her çizildiğinde (Bugün / Vakitler) kart yerine konur
if (NATIVE) {
  const gozcu = new MutationObserver(() => widgetKartlari());
  gozcu.observe($('#icerik'), { childList: true });
  widgetDurum().then(() => { ['#wk-bugun', '#wk-vakit'].forEach(x => { const k = $(x); if (k) k.remove(); }); widgetKartlari(); });
  widgetKartlari();
  // Kullanıcı ana ekrana ekleyip geri dönünce kart kalkar
  document.addEventListener('visibilitychange', () => { if (document.hidden) return; widgetDurum().then(() => { if (widgetBilgi && widgetBilgi.eklenen > 0) { const k = $('#wk-bugun'); if (k) k.remove(); } }); });
}
