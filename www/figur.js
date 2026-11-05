/* Üç Nur — namaz duruşlarının çizimleri (yan görünüş, kıble sağda). Basit ve sade piktogram figürler. */
'use strict';
(function () {
  // Eklem noktaları: b baş merkezi, n boyun, k kalça, d diz, a ayak bileği, p ayak ucu, o omuz, e dirsek, l el
  // "uzak" taraftaki kol ve bacak (u...) biraz daha açık renkte çizilir.
  const P = {
    ayakta: { b: [100, 40], n: [100, 57], k: [100, 108], d: [100, 139], a: [100, 168], p: [116, 169] },
    rukuAlt: { k: [86, 106], d: [92, 138], a: [96, 168], p: [112, 169] },
    oturus: { b: [98, 78], n: [99, 95], k: [92, 152], d: [134, 160], a: [96, 166], p: [84, 168] },
  };
  const POZ = {
    niyet: { ...P.ayakta, o: [100, 62], e: [99, 86], l: [101, 108], ue: [97, 86], ul: [97, 108] },
    kavme: { ...P.ayakta, o: [100, 62], e: [99, 86], l: [101, 108], ue: [97, 86], ul: [97, 108] },
    tekbir: { ...P.ayakta, o: [100, 62], e: [110, 84], l: [113, 46], ue: [106, 85], ul: [108, 47] },
    kiyam: { ...P.ayakta, o: [100, 62], e: [97, 88], l: [114, 98], ue: [95, 88], ul: [110, 101] },
    ruku: { ...P.rukuAlt, n: [133, 104], b: [150, 103], o: [128, 106], e: [112, 121], l: [96, 134], ue: [110, 122], ul: [93, 135] },
    secde: { p: [66, 170], a: [64, 156], d: [104, 164], k: [94, 126], n: [130, 150], b: [146, 157], o: [126, 148], e: [122, 165], l: [143, 168], ue: [118, 165], ul: [138, 168] },
    celse: { ...P.oturus, o: [99, 100], e: [104, 127], l: [126, 148], ue: [101, 127], ul: [121, 150] },
    kade: { ...P.oturus, o: [99, 100], e: [104, 127], l: [126, 148], ue: [101, 127], ul: [121, 150] },
    'selam-sag': { ...P.oturus, o: [99, 100], e: [104, 127], l: [126, 148], ue: [101, 127], ul: [121, 150], bas: 'sag' },
    'selam-sol': { ...P.oturus, o: [99, 100], e: [104, 127], l: [126, 148], ue: [101, 127], ul: [121, 150], bas: 'sol' },
  };
  const cizgi = (a, b, w, renk) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${renk}" stroke-width="${w}" stroke-linecap="round"/>`;
  window.namazFiguru = function (poz) {
    const j = POZ[poz] || POZ.kiyam, R = 'var(--fig, #175c44)', U = 'var(--fig-u, #6f9d89)', A = 'var(--fig-a, #c9a24f)', K = 'var(--kart, #fffdf8)';
    let s = '';
    // seccade ve kıble işareti
    s += `<rect x="30" y="170" width="140" height="7" rx="3.5" fill="${A}" opacity=".55"/>`;
    s += `<g opacity=".7"><path d="M182 24 l8 6 -8 6z" fill="${A}"/><text x="186" y="50" font-size="9" text-anchor="middle" fill="${A}" font-family="sans-serif">kıble</text></g>`;
    // uzak kol ve bacak
    const uzakBacak = poz === 'secde' || poz.startsWith('selam') || poz === 'kade' || poz === 'celse' ? '' : cizgi(j.k, [j.d[0] - 4, j.d[1]], 13, U) + cizgi([j.d[0] - 4, j.d[1]], [j.a[0] - 4, j.a[1]], 12, U);
    s += uzakBacak;
    if (j.ue) s += cizgi(j.o, j.ue, 10, U) + cizgi(j.ue, j.ul, 9, U);
    // gövde, yakın bacak
    s += cizgi(j.n, j.k, 20, R) + cizgi(j.k, j.d, 15, R) + cizgi(j.d, j.a, 13, R) + cizgi(j.a, j.p, 9, R);
    // baş ve takke
    s += `<circle cx="${j.b[0]}" cy="${j.b[1]}" r="13" fill="${R}"/>`;
    s += `<path d="M${j.b[0] - 12} ${j.b[1] - 3} a12 12 0 0 1 24 0z" fill="${A}" transform="rotate(${poz === 'ruku' ? 80 : poz === 'secde' ? 120 : 0} ${j.b[0]} ${j.b[1]})"/>`;
    // yakın kol (gövdenin üstünde görünsün diye açık renk kenarlı)
    s += cizgi(j.o, j.e, 16, K) + cizgi(j.e, j.l, 15, K) + cizgi(j.o, j.e, 11, R) + cizgi(j.e, j.l, 10, R) + `<circle cx="${j.l[0]}" cy="${j.l[1]}" r="5.5" fill="${R}"/>`;
    // selam: başın çevrildiği yön
    if (j.bas) {
      const sag = j.bas === 'sag';
      s += `<path d="M${j.b[0] + (sag ? 18 : -18)} ${j.b[1] - 14} q${sag ? 16 : -16} 2 ${sag ? 20 : -20} 16" fill="none" stroke="${A}" stroke-width="3" stroke-linecap="round"/>`;
      s += `<path d="M${j.b[0] + (sag ? 38 : -38)} ${j.b[1] + 2} l${sag ? -1 : 1} -9 ${sag ? -7 : 7} 6z" fill="${A}"/>`;
      s += `<text x="${j.b[0] + (sag ? 44 : -44)}" y="${j.b[1] + 18}" font-size="12" font-weight="700" text-anchor="middle" fill="${A}" font-family="sans-serif">${sag ? 'sağa' : 'sola'}</text>`;
    }
    if (poz === 'niyet') s += `<text x="66" y="62" font-size="20" text-anchor="middle">🤍</text>`;
    return `<svg class="figur" viewBox="20 14 180 170" role="img" aria-label="${poz}">${s}</svg>`;
  };
  window.NAMAZ_POZLARI = Object.keys(POZ);
})();
