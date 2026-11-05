# Kuran Hadis Zikir

Allah rızası için hazırlanmış, tamamen ücretsiz mobil uygulama (iOS + Android, Capacitor).
Kur'an-ı Kerîm ve Diyanet meali, seçme hadisler, zikirmatik, Esmâü'l-Hüsnâ, namaz vakitleri, Ramazan imsakiyesi, dini günler, ezan bildirimi, kıble pusulası.
Reklam yalnızca kullanıcı "Destek ol" butonuna basarsa gösterilir.

## Yapı
- `www/` uygulamanın kendisi (`index.html`, `app.js`, `style.css`, `data/icerik.js`)
  - `data/kuran.json`, `vendor/adhan.min.js`, `fonts/` derleme sırasında `scripts/hazirla.js` ile npm paketlerinden üretilir (repoda tutulmaz)
  - Kur'an metni + Diyanet meali: Tanzil.net kaynaklı `quran-json` paketi
- `docs/` GitHub Pages: tanıtım, gizlilik politikası, `vakitler/<plaka>.json` (vakitler + hicri takvim) ve `vakitler/dini-gunler.json`
- `scripts/` derleme ve mağaza betikleri
- `kurulum/` GitHub Actions iş akışı dosyaları: bunları `.github/workflows/` klasörüne taşı

## Bilgisayarda deneme
```
npm install
npm run sunucu   # http://localhost:8080
```

## İş akışları
- **TestFlight**: iOS derleyip TestFlight'a yükler (secret: `KEY_PASS`, Köyden Şehre ile aynı)
- **Android AAB + APK**: Google Play için imzalı paket üretir (secret: `KEY_PASS`)
- **Namaz vakitleri (AlAdhan)**: ayın 1'i ve 15'inde otomatik çalışır; 81 il için bu yıl + gelecek yılın vakitlerini (Diyanet yöntemi), Diyanet hicri takvimini ve dini günleri (kandiller, bayramlar, Ramazan) `docs/vakitler/` içine yazar. Şifre gerekmez.
- **Eski derlemeleri temizle**

İmza anahtarlarının şifreli halleri derleme sırasında `bolatemre/memleketim` reposundan alınır; o repo gizli yapılırsa `secrets/` klasörünü buraya da kopyala.

## Yayından önce
- [ ] AdMob'da iOS + Android uygulaması aç; `scripts/ads.env` ve `www/app.js` (REKLAM) içindeki test kimliklerini değiştir
- [ ] Hadis metinlerini bir hocaya kontrol ettir (`www/data/icerik.js`)
- [ ] Diyanet meali için Diyanet'ten yazılı kullanım izni iste
- [ ] Ekran görüntüleri (`store/ios-6.9-1290x2796/`)
