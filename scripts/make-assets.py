# Üç Nur — uygulama ikonu ve açılış ekranı:
# koyu yeşil zemin, altın mihrap kemeri, içinde ışık saçan üç kandil alevi (Kur'an, Hadis, Zikir).
import math, os
from PIL import Image, ImageDraw, ImageFilter

GREEN_TOP, GREEN_BOT = (20, 88, 64), (8, 40, 30)
GOLD, GOLD_LIGHT, GOLD_DARK = (226, 186, 98), (250, 226, 160), (170, 128, 52)

def zemin(S):
    im = Image.new('RGB', (S, S)); d = ImageDraw.Draw(im)
    for y in range(S):
        t = y / S
        d.line([(0, y), (S, y)], fill=tuple(int(GREEN_TOP[i]*(1-t)+GREEN_BOT[i]*t) for i in range(3)))
    return im.convert('RGBA')

def kemer(S, cx, taban, gen, yuk):
    """Sivri (mihrap) kemer: düz yan duvarlar + iki daire yayından sivri tepe."""
    sol, sag, r = cx - gen/2, cx + gen/2, gen * 0.82
    c = sol + r                                   # sol yayın merkezi (sağda)
    a_tepe = math.acos((cx - c) / r)              # yayın tepe noktasındaki açı
    tepe_yuk = r * math.sin(a_tepe)
    omuz = taban - (yuk - tepe_yuk)
    sol_yay = [(c + r*math.cos(a), omuz - r*math.sin(a)) for a in [math.pi - (math.pi - a_tepe) * k / 48 for k in range(49)]]
    sag_yay = [(2*cx - x, y) for (x, y) in reversed(sol_yay)]
    return [(sol, taban)] + sol_yay + sag_yay[1:] + [(sag, taban)]

def alev(cx, ust, alt, gen, n=60):
    """Damla/alev şekli: altta yuvarlak, üstte sivri."""
    h = alt - ust; r = gen / 2; merk = alt - r
    pts = []
    for k in range(n + 1):  # alt yarım daire
        a = math.radians(180 * k / n)
        pts.append((cx + r*math.cos(a), merk + r*math.sin(a)))
    for k in range(1, n):   # sol kenardan tepeye eğri
        t = k / n
        pts.append((cx - r * (1 - t) ** 0.9 * math.cos(t * 0.9), merk - (merk - ust) * t))
    pts.append((cx, ust))
    for k in range(n - 1, 0, -1):
        t = k / n
        pts.append((cx + r * (1 - t) ** 0.9 * math.cos(t * 0.9), merk - (merk - ust) * t))
    return pts

def amblem(S, olcek=1.0):
    im = zemin(S)
    cx = S / 2
    gen, yuk = S * .60 * olcek, S * .70 * olcek
    taban = S / 2 + yuk * .47
    k = kemer(S, cx, taban, gen, yuk)
    # kemerin içi: biraz daha koyu, içten ışıyan
    ic = Image.new('RGBA', (S, S), (0, 0, 0, 0)); ImageDraw.Draw(ic).polygon(k, fill=(6, 32, 24, 255))
    im.alpha_composite(ic)
    # kemer içi ışık hâlesi
    hale = Image.new('RGBA', (S, S), (0, 0, 0, 0)); hd = ImageDraw.Draw(hale)
    hy = taban - yuk * .40; hr = gen * .55
    hd.ellipse([cx - hr, hy - hr, cx + hr, hy + hr], fill=(255, 200, 110, 95))
    hale = hale.filter(ImageFilter.GaussianBlur(S * .07))
    maske = Image.new('L', (S, S), 0); ImageDraw.Draw(maske).polygon(k, fill=255)
    bos = Image.new('RGBA', (S, S), (0, 0, 0, 0)); bos.paste(hale, (0, 0), maske); im.alpha_composite(bos)
    # altın kemer çizgisi (iki kat)
    cz = Image.new('RGBA', (S, S), (0, 0, 0, 0)); cd = ImageDraw.Draw(cz)
    w = max(3, int(S * .022 * olcek))
    cd.line(k + [k[0]], fill=GOLD, width=w, joint='curve')
    k2 = kemer(S, cx, taban - S*.035*olcek, gen - S*.07*olcek, yuk - S*.07*olcek)
    cd.line(k2[1:-1], fill=GOLD_DARK, width=max(2, w // 2), joint='curve')
    # taban çizgisi
    cd.line([(cx - gen/2 - w, taban), (cx + gen/2 + w, taban)], fill=GOLD, width=w)
    im.alpha_composite(cz)
    # üç alev: ortadaki büyük
    for dx, boy, gn in [(-gen*.28, .19, .08), (0, .25, .10), (gen*.28, .19, .08)]:
        fx = cx + dx; alt = taban - yuk * .24; ust = alt - S * boy * olcek; fg = S * gn * olcek
        p = Image.new('RGBA', (S, S), (0, 0, 0, 0)); pd = ImageDraw.Draw(p)
        pd.polygon(alev(fx, ust - fg*.3, alt + fg*.15, fg*1.9), fill=(255, 200, 90, 150))
        im.alpha_composite(p.filter(ImageFilter.GaussianBlur(S * .03 * olcek)))
        a = Image.new('RGBA', (S, S), (0, 0, 0, 0)); ad = ImageDraw.Draw(a)
        ad.polygon(alev(fx, ust, alt, fg), fill=GOLD)
        ad.polygon(alev(fx, ust + (alt-ust)*.30, alt - fg*.12, fg*.55), fill=GOLD_LIGHT)
        ad.polygon(alev(fx, ust + (alt-ust)*.58, alt - fg*.22, fg*.25), fill=(255, 250, 230))
        im.alpha_composite(a)
        # kandil kasesi
        kd = ImageDraw.Draw(im)
        kw = fg * .78; ky = alt + fg * .08
        kd.pieslice([fx - kw, ky - kw*.55, fx + kw, ky + kw*.55], 0, 180, fill=GOLD_DARK)
        kd.rectangle([fx - kw*.25, ky + kw*.5, fx + kw*.25, ky + kw*.62], fill=GOLD_DARK)
    return im.convert('RGB')

os.makedirs('assets', exist_ok=True)
KAYNAK = 'store/ikon.png'   # hazır ikon (1024x1024) varsa onu kullan, yoksa yukarıdaki amblemi çiz
if os.path.exists(KAYNAK):
    ic = Image.open(KAYNAK).convert('RGB').resize((1024, 1024), Image.LANCZOS)
    ic.save('assets/icon-only.png')
    # Android uyarlanabilir ikon: ikon görünen alana (orta %66) sığar, zemin ikonun kenar rengi
    kenar = ic.crop((0, 380, 24, 760)).resize((1, 1), Image.LANCZOS).getpixel((0, 0))   # ikonun sol kenar rengi
    bg = Image.new('RGB', (1024, 1024), kenar)
    ic_kucuk = ic.resize((720, 720), Image.LANCZOS)
    m = Image.new('L', (720, 720), 0); ImageDraw.Draw(m).rounded_rectangle([24, 24, 695, 695], radius=120, fill=255)
    bg.paste(ic_kucuk, (152, 152), m.filter(ImageFilter.GaussianBlur(20))); bg.save('assets/icon-background.png')
    Image.new('RGBA', (1024, 1024), (0, 0, 0, 0)).save('assets/icon-foreground.png')
    # Açılış ekranı: koyu zemin ortasında yuvarlak köşeli ikon
    S = 2732; sp = zemin(S).convert('RGB'); k = 900
    i2 = ic.resize((k, k), Image.LANCZOS); m2 = Image.new('L', (k, k), 0); ImageDraw.Draw(m2).rounded_rectangle([0, 0, k-1, k-1], radius=int(k*.225), fill=255)
    sp.paste(i2, ((S-k)//2, (S-k)//2), m2); sp.save('assets/splash.png'); sp.save('assets/splash-dark.png')
else:
    amblem(1024).save('assets/icon-only.png')
    # Android uyarlanabilir ikon: amblem görünen alana (orta %66) sığar
    amblem(1024, .74).save('assets/icon-background.png')
    Image.new('RGBA', (1024, 1024), (0, 0, 0, 0)).save('assets/icon-foreground.png')
    sp = amblem(1366, .55).resize((2732, 2732), Image.LANCZOS)
    sp.save('assets/splash.png'); sp.save('assets/splash-dark.png')
print('ikon ve açılış ekranı hazır' + (' (store/ikon.png)' if os.path.exists(KAYNAK) else ' (çizilen amblem)'))
