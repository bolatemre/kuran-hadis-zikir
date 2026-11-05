# Uygulama ikonu ve açılış ekranı: koyu yeşil zemin üzerinde altın sekiz köşeli yıldız (Rub'ül-hizb) ve tesbih halkası.
import math, os
from PIL import Image, ImageDraw, ImageFilter

GREEN_TOP, GREEN_BOT = (22, 92, 68), (10, 46, 34)
GOLD, GOLD_DARK = (232, 196, 110), (176, 136, 58)

def bg(S):
    im = Image.new('RGB', (S, S)); d = ImageDraw.Draw(im)
    for y in range(S):
        t = y / S
        d.line([(0, y), (S, y)], fill=tuple(int(GREEN_TOP[i]*(1-t)+GREEN_BOT[i]*t) for i in range(3)))
    glow = Image.new('RGBA', (S, S), (0, 0, 0, 0)); r = S*.36
    ImageDraw.Draw(glow).ellipse([S/2-r, S*.47-r, S/2+r, S*.47+r], fill=(255, 230, 160, 60))
    im = im.convert('RGBA'); im.alpha_composite(glow.filter(ImageFilter.GaussianBlur(S*.08)))
    return im

def star(d, cx, cy, R, fill, outline=None, w=0):
    # iki kare üst üste: sekiz köşeli yıldız
    for rot in (0, 45):
        pts = [(cx + R*math.cos(math.radians(rot+45+90*k)), cy + R*math.sin(math.radians(rot+45+90*k))) for k in range(4)]
        d.polygon(pts, fill=fill, outline=outline, width=w)

def emblem(S, scale=1.0):
    im = bg(S); lay = Image.new('RGBA', (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    cx, cy, R = S/2, S*.47, S*.30*scale
    # gölge
    sh = Image.new('RGBA', (S, S), (0, 0, 0, 0)); star(ImageDraw.Draw(sh), cx+S*.01, cy+S*.018, R, (0, 0, 0, 110))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(S*.015)))
    star(d, cx, cy, R, GOLD)
    star(d, cx, cy, R*.86, GOLD_DARK)
    star(d, cx, cy, R*.80, (16, 70, 52))
    r2 = R*.42
    d.ellipse([cx-r2, cy-r2, cx+r2, cy+r2], outline=GOLD, width=max(2, int(S*.012)))
    # tesbih taneleri
    n = 33; rb = R*.62
    for k in range(n):
        a = math.radians(-90 + 360*k/n); bx, by = cx + rb*math.cos(a), cy + rb*math.sin(a); br = S*.011*scale
        d.ellipse([bx-br, by-br, bx+br, by+br], fill=GOLD)
    br = S*.028*scale; d.ellipse([cx-br, cy-br, cx+br, cy+br], fill=GOLD)
    im.alpha_composite(lay)
    return im.convert('RGB')

os.makedirs('assets', exist_ok=True)
ic = emblem(1024)
ic.save('assets/icon-only.png')
# Android uyarlanabilir ikon: tüm resim arka planda, amblem görünen alana (orta %66) sığar
emblem(1024, .72).save('assets/icon-background.png')
Image.new('RGBA', (1024, 1024), (0, 0, 0, 0)).save('assets/icon-foreground.png')
sp = emblem(1366, .55).resize((2732, 2732), Image.LANCZOS)
sp.save('assets/splash.png'); sp.save('assets/splash-dark.png')
print('ikon ve açılış ekranı hazır')
