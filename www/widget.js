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
