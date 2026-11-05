# Elif-Bâ harfleri, harekeler, namaz duaları ve kabir sualleri için yapay ses (Arapça) üretir: www/ses/*.mp3
# Kur'an âyetleri bu yolla üretilmez; onlar uygulamada hafızların kıraatinden (everyayah.com) dinletilir.
# Derleme sırasında çalışır (build-ios.sh / build-android.sh). Hata olursa uygulama telefonun kendi sesine düşer.
import asyncio, json, os, subprocess, sys
import edge_tts

KOK = os.path.join(os.path.dirname(__file__), '..')
OUT = os.path.join(KOK, 'www', 'ses')
SES = 'ar-SA-HamedNeural'

async def uret(ad, metin, sem):
    yol = os.path.join(OUT, ad + '.mp3')
    if os.path.exists(yol) and os.path.getsize(yol) > 1000:
        return ad
    hiz = '-25%' if ad.startswith(('dua_', 'kabir', 'z_')) else '-35%'
    async with sem:
        for deneme in range(4):
            try:
                await edge_tts.Communicate(metin, SES, rate=hiz).save(yol)
                if os.path.getsize(yol) > 1000:
                    return ad
            except Exception as e:
                print('  tekrar:', ad, e)
            await asyncio.sleep(2 * (deneme + 1))
    if os.path.exists(yol): os.remove(yol)
    return None

async def main():
    os.makedirs(OUT, exist_ok=True)
    liste = json.loads(subprocess.check_output(['node', os.path.join(KOK, 'scripts', 'ses-listesi.js')]))
    sem = asyncio.Semaphore(6)
    sonuc = await asyncio.gather(*[uret(a, m, sem) for a, m in liste])
    tamam = [a for a in sonuc if a]
    json.dump(tamam, open(os.path.join(OUT, 'liste.json'), 'w'))
    print(f'ses: {len(tamam)}/{len(liste)} dosya hazır')
    if len(tamam) < len(liste) * 0.8:
        sys.exit(1)

asyncio.run(main())
