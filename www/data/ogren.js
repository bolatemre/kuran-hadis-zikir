// Üç Nur — öğrenme içerikleri: namaz kılınışı, namaz duaları, sûre okunuşları, Elif-Bâ, kabir sualleri, ölümü hatırlama.
// Hanefî mezhebine ve Diyanet ilmihaline göre hazırlanmıştır. Yayından önce bir hocaya kontrol ettirilmesi tavsiye edilir.
// ses: { a: [[sûre, âyet], ...] } -> Kur'an kıraati (everyayah.com) ; { t: 'dosya' } -> uygulamayla gelen yapay ses (scripts/ses-uret.py)

window.DUALAR = [
  { id: 'subhaneke', ad: 'Sübhâneke', yer: 'Her namazın ilk rekâtında, iftitah tekbirinden sonra',
    ar: 'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ وَتَبَارَكَ اسْمُكَ وَتَعَالَى جَدُّكَ وَجَلَّ ثَنَاؤُكَ وَلَا إِلَهَ غَيْرُكَ',
    ok: 'Sübhâneke’llâhümme ve bi-hamdik. Ve tebârake’smük. Ve teâlâ ceddük. (Ve celle senâük.) Ve lâ ilâhe ğayrük.',
    anlam: 'Allah’ım! Seni eksik sıfatlardan tenzih eder, seni överim. Senin adın mübarektir. Şanın yücedir. (Senin övgün yücedir.) Senden başka ilah yoktur.' },
  { id: 'euzu', ad: 'Eûzü - Besmele', yer: 'Kıraate başlarken',
    ar: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ',
    ok: 'Eûzü billâhi mine’ş-şeytâni’r-racîm. Bismillâhi’r-rahmâni’r-rahîm.',
    anlam: 'Kovulmuş şeytanın şerrinden Allah’a sığınırım. Rahmân ve Rahîm olan Allah’ın adıyla.' },
  { id: 'tahiyyat', ad: 'Ettehiyyâtü', yer: 'Her oturuşta',
    ar: 'التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللَّهِ الصَّالِحِينَ أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    ok: 'Ettehiyyâtü lillâhi ve’s-salevâtü ve’t-tayyibât. Esselâmü aleyke eyyühe’n-nebiyyü ve rahmetullâhi ve berakâtüh. Esselâmü aleynâ ve alâ ibâdillâhi’s-sâlihîn. Eşhedü en lâ ilâhe illallâh. Ve eşhedü enne Muhammeden abdühû ve rasûlüh.',
    anlam: 'Dil ile, beden ile ve mal ile yapılan bütün ibadetler Allah’adır. Ey Peygamber! Allah’ın selamı, rahmeti ve bereketleri senin üzerine olsun. Selam bizim üzerimize ve Allah’ın salih kulları üzerine olsun. Şahitlik ederim ki Allah’tan başka ilah yoktur. Yine şahitlik ederim ki Muhammed O’nun kulu ve elçisidir.' },
  { id: 'salli', ad: 'Allâhümme Salli', yer: 'Son oturuşta, Ettehiyyâtü’den sonra',
    ar: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ',
    ok: 'Allâhümme salli alâ Muhammedin ve alâ âli Muhammed. Kemâ salleyte alâ İbrâhîme ve alâ âli İbrâhîm. İnneke hamîdün mecîd.',
    anlam: 'Allah’ım! İbrahim’e ve İbrahim’in ailesine rahmet ettiğin gibi Muhammed’e ve Muhammed’in ailesine de rahmet eyle. Şüphesiz sen övülmeye layıksın, şanı yücesin.' },
  { id: 'barik', ad: 'Allâhümme Bârik', yer: 'Son oturuşta, Allâhümme Salli’den sonra',
    ar: 'اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ',
    ok: 'Allâhümme bârik alâ Muhammedin ve alâ âli Muhammed. Kemâ bârekte alâ İbrâhîme ve alâ âli İbrâhîm. İnneke hamîdün mecîd.',
    anlam: 'Allah’ım! İbrahim’e ve İbrahim’in ailesine bereket verdiğin gibi Muhammed’e ve Muhammed’in ailesine de bereket ver. Şüphesiz sen övülmeye layıksın, şanı yücesin.' },
  { id: 'rabbena-atina', ad: 'Rabbenâ Âtinâ', yer: 'Son oturuşta (Bakara, 201)', ses: { a: [[2, 201]] },
    ar: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    ok: 'Rabbenâ âtinâ fi’d-dünyâ haseneten ve fi’l-âhireti haseneten ve kınâ azâbe’n-nâr.',
    anlam: 'Rabbimiz! Bize dünyada da iyilik ver, ahirette de iyilik ver. Bizi cehennem azabından koru.' },
  { id: 'rabbenagfirli', ad: 'Rabbenağfirlî', yer: 'Son oturuşta (İbrâhîm, 41)', ses: { a: [[14, 41]] },
    ar: 'رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ',
    ok: 'Rabbenağfirlî ve li-vâlideyye ve li’l-mü’minîne yevme yekûmü’l-hısâb.',
    anlam: 'Rabbimiz! Hesap gününde beni, anamı, babamı ve bütün müminleri bağışla.' },
  { id: 'kunut1', ad: 'Kunut Duası 1', yer: 'Vitir namazının 3. rekâtında',
    ar: 'اللَّهُمَّ إِنَّا نَسْتَعِينُكَ وَنَسْتَغْفِرُكَ وَنَسْتَهْدِيكَ وَنُؤْمِنُ بِكَ وَنَتُوبُ إِلَيْكَ وَنَتَوَكَّلُ عَلَيْكَ وَنُثْنِي عَلَيْكَ الْخَيْرَ كُلَّهُ نَشْكُرُكَ وَلَا نَكْفُرُكَ وَنَخْلَعُ وَنَتْرُكُ مَنْ يَفْجُرُكَ',
    ok: 'Allâhümme innâ nesteînüke ve nestağfirüke ve nestehdîk. Ve nü’minü bike ve netûbü ileyk. Ve netevekkelü aleyke ve nüsnî aleyke’l-hayra küllehû neşkürük. Ve lâ nekfürüke ve nahleu ve netrükü men yefcürük.',
    anlam: 'Allah’ım! Senden yardım ister, bağışlanma diler, hidayet isteriz. Sana inanır, sana tövbe eder, sana güveniriz. Bütün hayırlarla seni överiz. Sana şükrederiz, nimetlerini inkâr etmeyiz. Sana isyan edeni bırakır, ondan uzaklaşırız.' },
  { id: 'kunut2', ad: 'Kunut Duası 2', yer: 'Vitir namazının 3. rekâtında, Kunut 1’den sonra',
    ar: 'اللَّهُمَّ إِيَّاكَ نَعْبُدُ وَلَكَ نُصَلِّي وَنَسْجُدُ وَإِلَيْكَ نَسْعَى وَنَحْفِدُ نَرْجُو رَحْمَتَكَ وَنَخْشَى عَذَابَكَ إِنَّ عَذَابَكَ بِالْكُفَّارِ مُلْحِقٌ',
    ok: 'Allâhümme iyyâke na’büdü ve leke nusallî ve nescüdü ve ileyke nes’â ve nahfid. Nercû rahmeteke ve nahşâ azâbek. İnne azâbeke bi’l-küffâri mülhık.',
    anlam: 'Allah’ım! Yalnız sana kulluk ederiz; yalnız senin için namaz kılar ve secde ederiz. Sana koşar, sana yaklaşmaya çalışırız. Rahmetini umar, azabından korkarız. Şüphesiz senin azabın inkârcılara ulaşır.' },
  { id: 'ayetelkursi', ad: 'Âyete’l-Kürsî', yer: 'Namazlardan sonra okunması tavsiye edilir (Bakara, 255)', ses: { a: [[2, 255]] },
    ar: 'اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ وَلَا يَئُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    ok: 'Allâhü lâ ilâhe illâ hüve’l-hayyü’l-kayyûm. Lâ te’huzühû sinetün ve lâ nevm. Lehû mâ fi’s-semâvâti ve mâ fi’l-ard. Men ze’llezî yeşfeu indehû illâ bi-iznih. Ya’lemü mâ beyne eydîhim ve mâ halfehüm. Ve lâ yuhîtûne bi-şey’in min ilmihî illâ bimâ şâe. Vesia kürsiyyühü’s-semâvâti ve’l-ard. Ve lâ yeûdühû hıfzuhumâ ve hüve’l-aliyyü’l-azîm.',
    anlam: 'Allah, kendisinden başka ilah olmayandır. Diridir, her şeyi ayakta tutandır. Onu ne uyuklama tutar ne de uyku. Göklerde ve yerde ne varsa O’nundur. İzni olmadan O’nun katında kim şefaat edebilir? O, kulların önlerindekini ve arkalarındakini bilir. Onlar O’nun ilminden, kendisinin dilediği kadarından başka hiçbir şeyi kavrayamazlar. O’nun kürsüsü gökleri ve yeri kaplamıştır. Onları koruyup gözetmek O’na ağır gelmez. O, çok yücedir, çok büyüktür.' },
];

// Namazda okunan kısa zikirler (adımlarda gösterilir)
window.ZIKIR_KISA = {
  tekbir: { ar: 'اللَّهُ أَكْبَرُ', ok: 'Allâhü ekber', anlam: 'Allah en büyüktür.' },
  ruku: { ar: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ', ok: 'Sübhâne rabbiye’l-azîm (3 defa)', anlam: 'Yüce Rabbimi bütün eksikliklerden tenzih ederim.' },
  kavme: { ar: 'سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ رَبَّنَا لَكَ الْحَمْدُ', ok: 'Semiallâhü limen hamideh. Rabbenâ leke’l-hamd.', anlam: 'Allah kendisine hamdedeni işitir. Rabbimiz! Hamd sana mahsustur.' },
  secde: { ar: 'سُبْحَانَ رَبِّيَ الْأَعْلَى', ok: 'Sübhâne rabbiye’l-a’lâ (3 defa)', anlam: 'En yüce olan Rabbimi bütün eksikliklerden tenzih ederim.' },
  selam: { ar: 'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ', ok: 'Esselâmü aleyküm ve rahmetullâh', anlam: 'Allah’ın selamı ve rahmeti üzerinize olsun.' },
};

// Namazda okunan kısa sûrelerin Türkçe okunuşları (Arapça metin ve meal uygulamadaki Kur'an verisinden gelir)
window.SURE_OKUNUS = {
  1: ['Bismillâhi’r-rahmâni’r-rahîm.', 'Elhamdü lillâhi rabbi’l-âlemîn.', 'Er-rahmâni’r-rahîm.', 'Mâliki yevmi’d-dîn.', 'İyyâke na’büdü ve iyyâke neste’în.', 'İhdine’s-sırâta’l-müstakîm.', 'Sırâta’llezîne en’amte aleyhim ğayri’l-mağdûbi aleyhim ve le’d-dâllîn.'],
  103: ['Ve’l-asr.', 'İnne’l-insâne lefî husr.', 'İlle’llezîne âmenû ve amilü’s-sâlihâti ve tevâsav bi’l-hakkı ve tevâsav bi’s-sabr.'],
  105: ['Elem tera keyfe fe’ale rabbüke bi-ashâbi’l-fîl.', 'Elem yec’al keydehüm fî tadlîl.', 'Ve ersele aleyhim tayran ebâbîl.', 'Termîhim bi-hıcâratin min siccîl.', 'Fe-ce’alehüm ke-asfin me’kûl.'],
  106: ['Li-îlâfi kureyş.', 'Îlâfihim rıhlete’ş-şitâi ve’s-sayf.', 'Felya’büdû rabbe hâze’l-beyt.', 'Ellezî et’amehüm min cû’in ve âmenehüm min havf.'],
  107: ['Era’eyte’llezî yükezzibü bi’d-dîn.', 'Fe-zâlike’llezî yedu’u’l-yetîm.', 'Ve lâ yehuddu alâ taâmi’l-miskîn.', 'Fe-veylün li’l-musallîn.', 'Ellezîne hüm an salâtihim sâhûn.', 'Ellezîne hüm yürâûn.', 'Ve yemneûne’l-mâûn.'],
  108: ['İnnâ a’taynâke’l-kevser.', 'Fe-salli li-rabbike ve’nhar.', 'İnne şânieke hüve’l-ebter.'],
  109: ['Kul yâ eyyühe’l-kâfirûn.', 'Lâ a’büdü mâ ta’büdûn.', 'Ve lâ entüm âbidûne mâ a’büd.', 'Ve lâ ene âbidün mâ abedtüm.', 'Ve lâ entüm âbidûne mâ a’büd.', 'Leküm dînüküm ve liye dîn.'],
  110: ['İzâ câe nasrullâhi ve’l-feth.', 'Ve raeyte’n-nâse yedhulûne fî dînillâhi efvâcâ.', 'Fe-sebbih bi-hamdi rabbike ve’stağfirh. İnnehû kâne tevvâbâ.'],
  111: ['Tebbet yedâ ebî lehebin ve tebb.', 'Mâ ağnâ anhü mâlühû ve mâ keseb.', 'Se-yaslâ nâran zâte leheb.', 'Ve’mraetühû, hammâlete’l-hatab.', 'Fî cîdihâ hablün min mesed.'],
  112: ['Kul hüvallâhü ehad.', 'Allâhü’s-samed.', 'Lem yelid ve lem yûled.', 'Ve lem yekün lehû küfüven ehad.'],
  113: ['Kul eûzü bi-rabbi’l-felak.', 'Min şerri mâ halak.', 'Ve min şerri ğâsikın izâ vekab.', 'Ve min şerri’n-neffâsâti fi’l-ukad.', 'Ve min şerri hâsidin izâ hased.'],
  114: ['Kul eûzü bi-rabbi’n-nâs.', 'Meliki’n-nâs.', 'İlâhi’n-nâs.', 'Min şerri’l-vesvâsi’l-hannâs.', 'Ellezî yüvesvisü fî sudûri’n-nâs.', 'Mine’l-cinneti ve’n-nâs.'],
};
window.NAMAZ_SURELERI = [1, 112, 113, 114, 108, 103, 105, 106, 107, 109, 110, 111];

// Namaz kılınışı (iki rekâtlı bir namaz; örnek: sabah namazının sünneti). poz: SVG çizimi
window.NAMAZ_ADIMLARI = [
  { poz: 'niyet', baslik: 'Niyet', metin: 'Abdestli olarak kıbleye dönülür. Ayakların arası dört parmak kadar açık bırakılır, gözler secde yerine bakar. Kalpten niyet edilir; dil ile de söylenebilir: “Niyet ettim Allah rızası için bugünkü sabah namazının sünnetini kılmaya.”' },
  { poz: 'tekbir', baslik: 'İftitah tekbiri', metin: 'Erkekler ellerini kulak hizasına kaldırır, başparmaklar kulak yumuşaklarına değer. Kadınlar ellerini omuz hizasına kaldırır. Avuç içleri kıbleye bakar ve “Allâhü ekber” denir.', zikir: 'tekbir' },
  { poz: 'kiyam', baslik: 'Kıyam ve kıraat', metin: 'Eller bağlanır: erkekler sağ elini sol elinin üzerine koyup göbeğin altında, kadınlar göğüslerinin üzerinde bağlar. Sırasıyla Sübhâneke, Eûzü-Besmele, Fâtiha ve kısa bir sûre (zamm-ı sûre; örneğin İhlâs) okunur.', dualar: ['subhaneke', 'euzu'], sureler: [1, 112] },
  { poz: 'ruku', baslik: 'Rükû', metin: '“Allâhü ekber” diyerek eğilinir. Eller dizleri kavrar; sırt ve baş düz bir çizgi olur. Üç defa “Sübhâne rabbiye’l-azîm” denir.', zikir: 'ruku' },
  { poz: 'kavme', baslik: 'Kavme (rükûdan doğrulma)', metin: '“Semiallâhü limen hamideh” diyerek doğrulunur. Tam doğrulunca “Rabbenâ leke’l-hamd” denir. Eller yanlara salınır.', zikir: 'kavme' },
  { poz: 'secde', baslik: 'Birinci secde', metin: '“Allâhü ekber” diyerek secdeye varılır: önce dizler, sonra eller, sonra burun ve alın yere konur. Ayak parmakları kıbleye döner. Üç defa “Sübhâne rabbiye’l-a’lâ” denir.', zikir: 'secde' },
  { poz: 'celse', baslik: 'Celse (iki secde arası oturuş)', metin: '“Allâhü ekber” diyerek doğrulup diz üstü oturulur. Bir “Sübhânallah” diyecek kadar beklenir.', zikir: 'tekbir' },
  { poz: 'secde', baslik: 'İkinci secde', metin: '“Allâhü ekber” diyerek tekrar secdeye gidilir ve üç defa “Sübhâne rabbiye’l-a’lâ” denir. Böylece birinci rekât tamamlanır.', zikir: 'secde' },
  { poz: 'kiyam', baslik: 'İkinci rekât', metin: '“Allâhü ekber” diyerek ayağa kalkılır ve eller bağlanır. İkinci rekâtta Sübhâneke ve Eûzü okunmaz: Besmele, Fâtiha ve bir sûre okunur. Sonra rükû, kavme ve iki secde birinci rekâttaki gibi yapılır.', sureler: [1, 108] },
  { poz: 'kade', baslik: 'Son oturuş (ka’de-i ahîre)', metin: 'İkinci secdeden sonra oturulur. Erkekler sol ayağını yatırıp üzerine oturur, sağ ayağını dikip parmaklarını kıbleye çevirir. Kadınlar ayaklarını sağ taraftan çıkarıp oturur. Eller uylukların üzerindedir. Ettehiyyâtü, Allâhümme Salli, Allâhümme Bârik ve Rabbenâ duaları okunur.', dualar: ['tahiyyat', 'salli', 'barik', 'rabbena-atina', 'rabbenagfirli'] },
  { poz: 'selam-sag', baslik: 'Sağa selam', metin: 'Baş sağa çevrilir, göz sağ omuza bakar ve “Esselâmü aleyküm ve rahmetullâh” denir.', zikir: 'selam' },
  { poz: 'selam-sol', baslik: 'Sola selam', metin: 'Baş sola çevrilir ve aynı selam verilir. Namaz tamamlanmıştır. Ardından tesbihat yapılır, eller açılarak dua edilir.', zikir: 'selam' },
];
window.NAMAZ_EK = [
  'İkinci rekâttan sonra oturulur (ilk oturuş) ve yalnız Ettehiyyâtü okunup “Allâhü ekber” diyerek üçüncü rekâta kalkılır.',
  'Farz namazların üçüncü ve dördüncü rekâtlarında yalnız Fâtiha okunur; zamm-ı sûre okunmaz.',
  'Sünnet namazlarda ve vitirde her rekâtta Fâtiha ile birlikte bir sûre okunur.',
  'İkindi ve yatsının ilk sünnetlerinde ilk oturuşta Ettehiyyâtü’den sonra Salli ve Bârik de okunur; üçüncü rekâta kalkınca Sübhâneke okunur.',
  'Vitir namazının üçüncü rekâtında Fâtiha ve sûreden sonra eller kulak hizasına kaldırılıp “Allâhü ekber” denir, eller tekrar bağlanır ve Kunut duaları okunur.',
  'Son oturuşta Ettehiyyâtü, Salli, Bârik ve Rabbenâ duaları okunup selam verilir.',
];
window.REKATLAR = [
  ['Sabah', [['Sünnet', 2], ['Farz', 2]]],
  ['Öğle', [['İlk sünnet', 4], ['Farz', 4], ['Son sünnet', 2]]],
  ['İkindi', [['Sünnet', 4], ['Farz', 4]]],
  ['Akşam', [['Farz', 3], ['Sünnet', 2]]],
  ['Yatsı', [['İlk sünnet', 4], ['Farz', 4], ['Son sünnet', 2], ['Vitir (vacip)', 3]]],
  ['Cuma', [['İlk sünnet', 4], ['Farz (cemaatle)', 2], ['Son sünnet', 4]]],
];
window.ABDEST = [
  ['Niyet ve Besmele', 'Niyet edilir, “Bismillâhirrahmânirrahîm” denir. Eller bileklere kadar üç defa yıkanır.'],
  ['Ağız', 'Sağ avuçla ağza üç defa su alınıp çalkalanır.'],
  ['Burun', 'Sağ avuçla buruna üç defa su çekilir, sol elle temizlenir.'],
  ['Yüz', 'Yüz, alnın saç bitiminden çene altına ve iki kulak yumuşağına kadar üç defa yıkanır.'],
  ['Kollar', 'Önce sağ, sonra sol kol dirseklerle birlikte üç defa yıkanır.'],
  ['Baş', 'Islak sağ elin içiyle başın en az dörtte biri mesh edilir.'],
  ['Kulaklar ve boyun', 'Islak parmaklarla kulakların içi ve arkası, sonra el arkalarıyla boyun mesh edilir.'],
  ['Ayaklar', 'Önce sağ, sonra sol ayak topuklarla birlikte, parmak aralarından başlayarak üç defa yıkanır.'],
];

// Elif-Bâ: [harf, Türkçe adı, nasıl okunur, Arapça adı (ses için), üstün, esre, ötre okunuşu]
window.ELIFBA = [
  ['ا', 'Elif', 'Sesli harfleri taşır', 'أَلِفْ', 'e', 'i', 'ü'],
  ['ب', 'Be', 'b', 'بَاءْ', 'be', 'bi', 'bü'],
  ['ت', 'Te', 't', 'تَاءْ', 'te', 'ti', 'tü'],
  ['ث', 'Se', 'Peltek s: dil ucu ön dişlerin arasında', 'ثَاءْ', 'se', 'si', 'sü'],
  ['ج', 'Cim', 'c', 'جِيمْ', 'ce', 'ci', 'cü'],
  ['ح', 'Ha', 'Boğazın ortasından, hırıltısız h', 'حَاءْ', 'ha', 'hı', 'hu'],
  ['خ', 'Hı', 'Gırtlağın üstünden, hırıltılı h', 'خَاءْ', 'ha', 'hı', 'hu'],
  ['د', 'Dal', 'd', 'دَالْ', 'de', 'di', 'dü'],
  ['ذ', 'Zel', 'Peltek z: dil ucu ön dişlerin arasında', 'ذَالْ', 'ze', 'zi', 'zü'],
  ['ر', 'Ra', 'r', 'رَاءْ', 'ra', 'ri', 'ru'],
  ['ز', 'Ze', 'z', 'زَايْ', 'ze', 'zi', 'zü'],
  ['س', 'Sin', 'İnce s', 'سِينْ', 'se', 'si', 'sü'],
  ['ش', 'Şın', 'ş', 'شِينْ', 'şe', 'şi', 'şü'],
  ['ص', 'Sad', 'Kalın s', 'صَادْ', 'sa', 'sı', 'su'],
  ['ض', 'Dad', 'Kalın d: dilin yanı azı dişlere dayanır', 'ضَادْ', 'da', 'dı', 'du'],
  ['ط', 'Tı', 'Kalın t', 'طَاءْ', 'ta', 'tı', 'tu'],
  ['ظ', 'Zı', 'Kalın peltek z', 'ظَاءْ', 'za', 'zı', 'zu'],
  ['ع', 'Ayn', 'Boğazın ortasından, sıkıştırılmış ses', 'عَيْنْ', 'a', 'ı', 'u'],
  ['غ', 'Ğayn', 'Gırtlağın üstünden ğ', 'غَيْنْ', 'ğa', 'ğı', 'ğu'],
  ['ف', 'Fe', 'f', 'فَاءْ', 'fe', 'fi', 'fü'],
  ['ق', 'Kaf', 'Kalın k: dilin kökünden', 'قَافْ', 'ka', 'kı', 'ku'],
  ['ك', 'Kef', 'İnce k', 'كَافْ', 'ke', 'ki', 'kü'],
  ['ل', 'Lam', 'l', 'لَامْ', 'le', 'li', 'lü'],
  ['م', 'Mim', 'm', 'مِيمْ', 'me', 'mi', 'mü'],
  ['ن', 'Nun', 'n', 'نُونْ', 'ne', 'ni', 'nü'],
  ['و', 'Vav', 'v', 'وَاوْ', 've', 'vi', 'vü'],
  ['ه', 'He', 'Hafif h', 'هَاءْ', 'he', 'hi', 'hü'],
  ['ي', 'Ye', 'y', 'يَاءْ', 'ye', 'yi', 'yü'],
];
// Harflerin başta, ortada ve sonda yazılışı (birleşmeyen harflerde ortadaki boş kalır)
window.ELIFBA_SEKIL = {
  'ا': ['ا', 'ـا', 'ـا'], 'ب': ['بـ', 'ـبـ', 'ـب'], 'ت': ['تـ', 'ـتـ', 'ـت'], 'ث': ['ثـ', 'ـثـ', 'ـث'], 'ج': ['جـ', 'ـجـ', 'ـج'],
  'ح': ['حـ', 'ـحـ', 'ـح'], 'خ': ['خـ', 'ـخـ', 'ـخ'], 'د': ['د', 'ـد', 'ـد'], 'ذ': ['ذ', 'ـذ', 'ـذ'], 'ر': ['ر', 'ـر', 'ـر'],
  'ز': ['ز', 'ـز', 'ـز'], 'س': ['سـ', 'ـسـ', 'ـس'], 'ش': ['شـ', 'ـشـ', 'ـش'], 'ص': ['صـ', 'ـصـ', 'ـص'], 'ض': ['ضـ', 'ـضـ', 'ـض'],
  'ط': ['طـ', 'ـطـ', 'ـط'], 'ظ': ['ظـ', 'ـظـ', 'ـظ'], 'ع': ['عـ', 'ـعـ', 'ـع'], 'غ': ['غـ', 'ـغـ', 'ـغ'], 'ف': ['فـ', 'ـفـ', 'ـف'],
  'ق': ['قـ', 'ـقـ', 'ـق'], 'ك': ['كـ', 'ـكـ', 'ـك'], 'ل': ['لـ', 'ـلـ', 'ـل'], 'م': ['مـ', 'ـمـ', 'ـم'], 'ن': ['نـ', 'ـنـ', 'ـن'],
  'و': ['و', 'ـو', 'ـو'], 'ه': ['هـ', 'ـهـ', 'ـه'], 'ي': ['يـ', 'ـيـ', 'ـي'],
};
// Harekeler: Arapça harfe eklenen işaret (U+064E üstün, U+0650 esre, U+064F ötre)
window.HAREKELER = [['Üstün', 'َ', 'Harfin üstüne konur; “e” ya da kalın harflerde “a” okutur.'], ['Esre', 'ِ', 'Harfin altına konur; “i” ya da kalın harflerde “ı” okutur.'], ['Ötre', 'ُ', 'Harfin üstüne konur; “ü” ya da kalın harflerde “u” okutur.']];
// Sonraki dersler: [başlık, açıklama, [[Arapça, okunuş], ...]]
window.ELIFBA_DERSLER = [
  ['Cezm (sükûn)', 'Harfin üstündeki küçük daire (ـْ) o harfi harekesiz okutur; önceki harfe bağlanır.',
    [['أَبْ', 'eb'], ['إِبْ', 'ib'], ['أُبْ', 'üb'], ['مِنْ', 'min'], ['لَمْ', 'lem'], ['قُلْ', 'kul'], ['قَدْ', 'kad'], ['هَلْ', 'hel']]],
  ['Şedde', 'Harfin üstündeki şedde (ـّ) o harfi iki kere okutur: biri önceki harfe bağlanır, biri kendi harekesiyle okunur.',
    [['رَبَّ', 'rabbe'], ['إِنَّ', 'inne'], ['ثُمَّ', 'sümme'], ['حَقَّ', 'hakka'], ['أُمِّ', 'ümmi'], ['كُلُّ', 'küllü']]],
  ['Tenvin', 'Çift hareke kelimenin sonuna “n” sesi ekler: iki üstün “en”, iki esre “in”, iki ötre “ün”.',
    [['بًا', 'ben'], ['بٍ', 'bin'], ['بٌ', 'bün'], ['أَحَدٌ', 'ehadün'], ['كِتَابًا', 'kitâben'], ['نُورٍ', 'nûrin']]],
  ['Med (uzatma)', 'Üstünden sonra elif, esreden sonra ye, ötreden sonra vav gelirse ses bir elif miktarı uzatılır.',
    [['بَا', 'bâ'], ['بِي', 'bî'], ['بُو', 'bû'], ['قَالَ', 'kâle'], ['قِيلَ', 'kîle'], ['يَقُولُ', 'yekûlü']]],
  ['Kelimeler', 'Şimdi öğrendiklerinle kelimeleri oku, sonra dinleyip kontrol et.',
    [['اللَّهُ', 'Allâhu'], ['رَبِّ', 'rabbi'], ['كِتَابٌ', 'kitâbün'], ['نُورٌ', 'nûrun'], ['قَلَمٌ', 'kalemün'], ['رَحْمَةٌ', 'rahmetün'], ['صَلَاةٌ', 'salâtün'], ['مُحَمَّدٌ', 'Muhammedün']]],
];

// Kabir sualleri
window.KABIR = [
  { s: 'مَنْ رَبُّكَ؟', so: 'Men rabbük?', st: 'Rabbin kim?', c: 'رَبِّيَ اللَّهُ', co: 'Rabbiyallâh.', ct: 'Rabbim Allah’tır.' },
  { s: 'مَا دِينُكَ؟', so: 'Mâ dînük?', st: 'Dinin ne?', c: 'دِينِيَ الْإِسْلَامُ', co: 'Dîniye’l-İslâm.', ct: 'Dinim İslâm’dır.' },
  { s: 'مَنْ نَبِيُّكَ؟', so: 'Men nebiyyük?', st: 'Peygamberin kim?', c: 'نَبِيِّي مُحَمَّدٌ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ', co: 'Nebiyyî Muhammedün sallallâhü aleyhi ve sellem.', ct: 'Peygamberim Hz. Muhammed’dir (s.a.v.).' },
  { s: 'مَا كِتَابُكَ؟', so: 'Mâ kitâbük?', st: 'Kitabın ne?', c: 'كِتَابِيَ الْقُرْآنُ', co: 'Kitâbiye’l-Kur’ân.', ct: 'Kitabım Kur’an’dır.', ek: true },
  { s: 'أَيْنَ قِبْلَتُكَ؟', so: 'Eyne kıbletük?', st: 'Kıblen neresi?', c: 'قِبْلَتِيَ الْكَعْبَةُ', co: 'Kıbletiye’l-Ka’be.', ct: 'Kıblem Kâbe’dir.', ek: true },
];
// Ölümü hatırlatan sözler (ana sayfada her gün biri)
window.OLUM_HATIRLA = [
  ['Her nefis ölümü tadacaktır. Yaptıklarınızın karşılığı kıyamet günü size eksiksiz verilecektir.', 'Âl-i İmrân, 185'],
  ['O, hanginizin daha güzel amel yapacağını sınamak için ölümü ve hayatı yaratandır.', 'Mülk, 2'],
  ['Lezzetleri yok eden ölümü çokça hatırlayın.', 'Tirmizî, Zühd'],
  ['Akıllı kişi, nefsini hesaba çeken ve ölümden sonrası için çalışandır.', 'Tirmizî, Kıyâmet'],
  ['Dünyada bir garip ya da bir yolcu gibi ol.', 'Buhârî, Rikâk'],
  ['Her ümmetin bir eceli vardır. Ecelleri geldiğinde ne bir an geri kalabilirler ne de öne geçebilirler.', 'A’râf, 34'],
  ['“Rabbimiz Allah’tır” deyip sonra dosdoğru olanlara melekler iner: “Korkmayın, üzülmeyin, size vaat edilen cennetle sevinin.”', 'Fussilet, 30'],
];
// Perşembe akşamı birlikte okunan sûreler
window.CUMA_SURELERI = [[36, 'Yâsîn'], [67, 'Mülk (Tebâreke)'], [78, 'Nebe (Amme)'], [62, 'Cuma']];

// Uygulamayla gelen yapay seslerin listesi: [dosya adı, Arapça metin]. scripts/ses-uret.py bu listeyi kullanır.
window.sesListesi = function () {
  const l = [];
  ELIFBA.forEach((h, i) => {
    const b = i === 0 ? ['أَ', 'إِ', 'أُ'] : ['َ', 'ِ', 'ُ'].map(x => h[0] + x);
    l.push(['h' + i, h[3]], ['h' + i + 'e', b[0]], ['h' + i + 'i', b[1]], ['h' + i + 'u', b[2]]);
  });
  ELIFBA_DERSLER.forEach((d, i) => d[2].forEach((x, j) => l.push(['d' + i + '_' + j, x[0]])));
  DUALAR.filter(d => !d.ses).forEach(d => l.push(['dua_' + d.id, d.ar]));
  Object.entries(ZIKIR_KISA).forEach(([k, z]) => l.push(['z_' + k, z.ar]));
  KABIR.forEach((k, i) => l.push(['kabir' + i, k.s + ' ' + k.c]));
  return l;
};
