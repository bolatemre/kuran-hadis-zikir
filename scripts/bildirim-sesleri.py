# Bildirim sesleri: sesler/ezan_kisa.wav (kısa ezan), sesler/nur_zil.wav (yumuşak zil), sesler/sessiz.wav
# iOS ve Android bildirim sesi olarak WAV (16 bit PCM) kullanılır; iOS'ta en fazla 30 saniye olmalı.
# Kısa ezan: "Beautiful adhan" — Adam-synagda (freesound.org, CC0 / kamu malı). İlk "Allâhu Ekber, Allâhu Ekber" kısmı alınır.
import io, math, os, struct, sys, urllib.request, hashlib, time, wave

KOK = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(KOK, 'sesler')
HZ = 22050
EZAN_URL = 'https://raw.githubusercontent.com/CElyousfi/salatApp/ec06bfa69867762d3f403b3c74f00e18d97a1d17/assets/audio/adhan_full.mp3'
EZAN_SHA = '5b291cdc7dbb95b3dd141220222a0dbf1754458adbc5c62036e54da39ede5a7b'
EZAN_SN = 17.0

def yaz(ad, ornekler, normal=True):
    tepe = max(1e-9, max(abs(x) for x in ornekler))
    k = 0.89 / tepe if normal else 1
    with wave.open(os.path.join(OUT, ad), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(HZ)
        w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, x * k)) * 32767)) for x in ornekler))
    print(f'  {ad}: {len(ornekler) / HZ:.1f} sn')

def zil():
    # Üç notalı yumuşak çan sesi (sol - si - re), üst armoniklerle ve sönümlenerek
    n = int(HZ * 2.6); s = [0.0] * n
    for bas, f in ((0.0, 783.99), (0.28, 987.77), (0.56, 1174.66)):
        b = int(bas * HZ)
        for i in range(n - b):
            t = i / HZ
            zarf = min(1, t / 0.008) * math.exp(-t * 2.4)
            s[b + i] += zarf * (math.sin(2 * math.pi * f * t) + 0.35 * math.sin(2 * math.pi * f * 2.01 * t) * math.exp(-t * 3) + 0.12 * math.sin(2 * math.pi * f * 3.02 * t) * math.exp(-t * 5))
    return s

def ezan():
    import miniaudio
    veri = None
    for d in range(4):
        try:
            veri = urllib.request.urlopen(EZAN_URL, timeout=60).read()
            break
        except Exception as e:
            print('  ezan indirilemedi, tekrar:', e); time.sleep(5 * (d + 1))
    if not veri: raise RuntimeError('ezan indirilemedi')
    if hashlib.sha256(veri).hexdigest() != EZAN_SHA: raise RuntimeError('ezan dosyası beklenen dosya değil')
    c = miniaudio.decode(veri, output_format=miniaudio.SampleFormat.FLOAT32, nchannels=1, sample_rate=HZ)
    s = list(c.samples[:int(EZAN_SN * HZ)])
    gir, cik = int(0.03 * HZ), int(1.4 * HZ)
    for i in range(gir): s[i] *= i / gir
    for i in range(cik): s[-1 - i] *= (i / cik) ** 1.5
    return s

os.makedirs(OUT, exist_ok=True)
z = zil()
yaz('nur_zil.wav', z)
yaz('sessiz.wav', [0.0] * int(HZ * 0.4), normal=False)
try:
    yaz('ezan_kisa.wav', ezan())
except Exception as e:
    print('::warning::Kısa ezan hazırlanamadı (' + str(e) + '); yerine zil sesi kullanılacak')
    yaz('ezan_kisa.wav', z)
