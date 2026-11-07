// npm paketlerinden uygulamaya gereken büyük dosyaları üretir (repoda tutulmaz):
// Kur'an metni + Diyanet meali (quran-json, kaynak Tanzil.net), adhan vakit hesaplama, Amiri Quran yazı tipi.
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '..'), nm = p => path.join(R, 'node_modules', p), www = p => path.join(R, 'www', p);
for (const d of ['data', 'vendor', 'fonts']) fs.mkdirSync(www(d), { recursive: true });
const tr = JSON.parse(fs.readFileSync(nm('quran-json/dist/quran_tr.json'), 'utf8'));
const out = tr.map(s => ({ n: s.id, ar: s.name, ad: s.translation, t: s.type === 'meccan' ? 'k' : 'd', v: s.verses.map(v => [v.text, v.translation]) }));
if (out.length !== 114 || out.reduce((a, s) => a + s.v.length, 0) !== 6236) throw new Error('Kur\'an verisi eksik');
fs.writeFileSync(www('data/kuran.json'), JSON.stringify(out));
fs.copyFileSync(nm('adhan/lib/bundles/adhan.umd.min.js'), www('vendor/adhan.min.js'));
fs.copyFileSync(nm('@fontsource/amiri-quran/files/amiri-quran-arabic-400-normal.woff2'), www('fonts/amiri-quran.woff2'));
console.log('www hazır: kuran.json, adhan, yazı tipi');
// Elif-Bâ, dualar ve kabir sualleri için yapay ses: yalnızca derleme sunucusunda (olmazsa uygulama telefonun kendi sesini kullanır)
if (process.env.GITHUB_ACTIONS) {
  const { execSync } = require('child_process'), v = path.join(process.env.RUNNER_TEMP || '/tmp', 'sesvenv');
  try { execSync(`python3 -m venv "${v}" && "${v}/bin/pip" install --quiet edge-tts && "${v}/bin/python" scripts/ses-uret.py`, { cwd: R, stdio: 'inherit' }); }
  catch (e) { console.log('::warning::Yapay sesler üretilemedi; uygulama telefonun kendi sesini kullanacak'); }
  // Bildirim sesleri (kısa ezan, zil, sessiz): sesler/*.wav → derleme betikleri iOS/Android projesine ekler
  try { execSync(`"${v}/bin/pip" install --quiet miniaudio || true; "${v}/bin/python" scripts/bildirim-sesleri.py`, { cwd: R, stdio: 'inherit' }); }
  catch (e) { try { execSync('python3 scripts/bildirim-sesleri.py', { cwd: R, stdio: 'inherit' }); } catch (e2) { console.log('::warning::Bildirim sesleri üretilemedi'); } }
}
// Ayarlar'da önizleme için bildirim seslerinin bir kopyası
if (fs.existsSync(path.join(R, 'sesler'))) {
  fs.mkdirSync(www('bildirim'), { recursive: true });
  for (const f of fs.readdirSync(path.join(R, 'sesler'))) if (f.endsWith('.wav')) fs.copyFileSync(path.join(R, 'sesler', f), www('bildirim/' + f));
}
