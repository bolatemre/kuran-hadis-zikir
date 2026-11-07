// Üç Nur — ana ekran ve kilit ekranı araç takımı (namaz vakitleri ve sıradaki vakte geri sayım).
// Vakitleri uygulama hesaplar ve paylaşılan anahtar zincirine (keychain) bırakır; araç takımı yalnızca okur.
import WidgetKit
import SwiftUI
import Security

// MARK: - Veri

struct VakitVerisi: Codable {
    let konum: String
    let gunler: [VakitGunu]
}

struct VakitGunu: Codable {
    let t: String
    let v: [Double] // milisaniye (Unix zamanı): imsak, güneş, öğle, ikindi, akşam, yatsı
    let h: String?  // hicri tarih (uygulamanın Diyanet takviminden)
}

enum Paylasim {
    static let grup = "Z5ZU32M6W4.com.bolatemre.khz.paylasim"

    static func oku() -> VakitVerisi? {
        let sorgu: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: "ucnur",
            kSecAttrAccount as String: "vakitler",
            kSecAttrAccessGroup as String: grup,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var sonuc: AnyObject?
        guard SecItemCopyMatching(sorgu as CFDictionary, &sonuc) == errSecSuccess, let veri = sonuc as? Data else { return nil }
        return try? JSONDecoder().decode(VakitVerisi.self, from: veri)
    }
}

let vakitAdlari = ["İmsak", "Güneş", "Öğle", "İkindi", "Akşam", "Yatsı"]
let vakitIkonlari = ["moon.stars.fill", "sunrise.fill", "sun.max.fill", "sun.haze.fill", "sunset.fill", "moon.fill"]

struct Giris: TimelineEntry {
    let date: Date
    let konum: String
    let vakitler: [Date]   // gösterilen günün altı vakti
    let sonraki: Int       // sıradaki vaktin sırası (vurgulanır)
    let hedef: Date        // sıradaki vaktin saati
    let onceki: Date       // bir önceki vaktin saati (ilerleme çubuğu bundan hedefe dolar)
    let hicri: String
    let veriYok: Bool

    var oncekiSira: Int { sonraki == 0 ? 5 : sonraki - 1 }

    static func bos(_ d: Date) -> Giris {
        Giris(date: d, konum: "Üç Nur", vakitler: [], sonraki: 0, hedef: d, onceki: d, hicri: "", veriYok: true)
    }

    static func ornek() -> Giris {
        let simdi = Date()
        let saatler = [-10.2, -8.7, -3.4, -0.75, 1.7, 3.05].map { simdi.addingTimeInterval($0 * 3600) }
        return Giris(date: simdi, konum: "İstanbul", vakitler: saatler, sonraki: 4, hedef: saatler[4], onceki: saatler[3], hicri: "27 Cemâziyelevvel 1448", veriYok: false)
    }
}

enum Hesap {
    static func giris(_ d: Date, veri: VakitVerisi) -> Giris? {
        let gunler = veri.gunler.filter { $0.v.count == 6 }
        let tarihler: [[Date]] = gunler.map { g in g.v.map { Date(timeIntervalSince1970: $0 / 1000) } }
        let hepsi = tarihler.flatMap { $0 }
        guard let hedef = hepsi.filter({ $0 > d }).min() else { return nil }
        // Sıradaki vakit bugünse bugünün listesi, yatsıdan sonra ise yarının listesi gösterilir
        guard let gi = tarihler.firstIndex(where: { $0.contains(hedef) }) else { return nil }
        let gun = tarihler[gi]
        let sira = gun.firstIndex(of: hedef) ?? 0
        var onceki = hepsi.filter { $0 <= d }.max() ?? hedef.addingTimeInterval(-6 * 3600)
        if onceki >= hedef { onceki = hedef.addingTimeInterval(-3600) }
        return Giris(date: d, konum: veri.konum, vakitler: gun, sonraki: sira, hedef: hedef, onceki: onceki, hicri: gunler[gi].h ?? "", veriYok: false)
    }
}

// MARK: - Zaman çizelgesi

struct Saglayici: TimelineProvider {
    func placeholder(in context: Context) -> Giris { Giris.ornek() }

    func getSnapshot(in context: Context, completion: @escaping (Giris) -> Void) {
        let simdi = Date()
        if let veri = Paylasim.oku(), let g = Hesap.giris(simdi, veri: veri) { completion(g) } else { completion(Giris.ornek()) }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Giris>) -> Void) {
        let simdi = Date()
        guard let veri = Paylasim.oku() else {
            completion(Timeline(entries: [Giris.bos(simdi)], policy: .after(simdi.addingTimeInterval(1800))))
            return
        }
        // Şimdi + sıradaki vakitlerin her biri: vakit girince vurgulanan satır ve geri sayım kendiliğinden değişir
        let sonrakiler = veri.gunler.flatMap { $0.v }
            .map { Date(timeIntervalSince1970: $0 / 1000) }
            .filter { $0 > simdi }
            .sorted()
        var anlar: [Date] = [simdi]
        anlar.append(contentsOf: sonrakiler.prefix(12))
        let girisler = anlar.compactMap { Hesap.giris($0, veri: veri) }
        if girisler.isEmpty {
            completion(Timeline(entries: [Giris.bos(simdi)], policy: .after(simdi.addingTimeInterval(1800))))
        } else {
            completion(Timeline(entries: girisler, policy: .atEnd))
        }
    }
}

// MARK: - Görünüm

let yesilKoyu = Color(red: 0.039, green: 0.169, blue: 0.125)   // #0a2b20
let yesilOrta = Color(red: 0.059, green: 0.239, blue: 0.180)   // #0f3d2e
let yesilAcik = Color(red: 0.114, green: 0.420, blue: 0.314)   // #1d6b50
let altin = Color(red: 0.910, green: 0.769, blue: 0.431)       // #e8c46e
let acikAltin = Color(red: 0.941, green: 0.831, blue: 0.541)   // #f0d48a
let hicriRenk = Color(red: 0.914, green: 0.851, blue: 0.659)   // #e9d9a8

func saatYaz(_ d: Date) -> String {
    let f = DateFormatter()
    f.locale = Locale(identifier: "tr_TR")
    f.dateFormat = "HH:mm"
    return f.string(from: d)
}

func tarihYaz(_ d: Date) -> String {
    let f = DateFormatter()
    f.locale = Locale(identifier: "tr_TR")
    f.dateFormat = "d MMMM EEEE"
    return f.string(from: d)
}

extension View {
    @ViewBuilder
    func arkaPlan<V: View>(_ zemin: V, bosluk: Bool = true) -> some View {
        if #available(iOS 17.0, *) {
            self.containerBackground(for: .widget) { zemin }
        } else {
            if bosluk {
                self.padding(15).background(zemin)
            } else {
                self.background(zemin)
            }
        }
    }
}

struct Zemin: View {
    var body: some View {
        ZStack {
            LinearGradient(colors: [yesilAcik, yesilOrta, yesilKoyu], startPoint: .topLeading, endPoint: .bottomTrailing)
            RadialGradient(colors: [altin.opacity(0.18), .clear], center: .topTrailing, startRadius: 0, endRadius: 150)
            ContainerRelativeShape().stroke(altin.opacity(0.25), lineWidth: 2)
        }
    }
}

struct GeriSayim: View {
    let g: Giris
    let boyut: CGFloat
    var body: some View {
        Text(timerInterval: g.date...max(g.date, g.hedef), countsDown: true)
            .font(.system(size: boyut, weight: .heavy, design: .rounded))
            .monospacedDigit()
            .foregroundColor(.white)
            .minimumScaleFactor(0.6)
            .lineLimit(1)
    }
}

/// Önceki vakitten sıradakine kendiliğinden dolan çubuk
struct Ilerleme: View {
    let g: Giris
    var renk: Color = altin
    var body: some View {
        ProgressView(timerInterval: g.onceki...max(g.onceki.addingTimeInterval(60), g.hedef), countsDown: false, label: { EmptyView() }, currentValueLabel: { EmptyView() })
            .progressViewStyle(.linear)
            .tint(renk)
    }
}

struct Etiket: View {
    let g: Giris
    var ek: String = "vaktine"
    var boyut: CGFloat = 12
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: vakitIkonlari[g.sonraki])
            Text("\(vakitAdlari[g.sonraki]) \(ek)")
        }
        .font(.system(size: boyut, weight: .semibold))
        .foregroundColor(altin)
        .lineLimit(1)
    }
}

struct KonumYazisi: View {
    let g: Giris
    let boyut: CGFloat
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "mappin.circle.fill").foregroundColor(altin)
            Text(g.konum).foregroundColor(.white)
        }
        .font(.system(size: boyut, weight: .bold))
        .lineLimit(1)
    }
}

struct VeriYokGorunum: View {
    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: "moon.stars.fill").font(.title2).foregroundColor(altin)
            Text("Üç Nur").font(.headline).foregroundColor(altin)
            Text("Vakitler için uygulamayı bir kez açın").font(.caption).foregroundColor(.white).multilineTextAlignment(.center)
        }
    }
}

struct KucukGorunum: View {
    let g: Giris
    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            KonumYazisi(g: g, boyut: 12)
            Text(g.hicri).font(.system(size: 10)).foregroundColor(hicriRenk).lineLimit(1).minimumScaleFactor(0.8)
            Spacer(minLength: 0)
            Etiket(g: g)
            GeriSayim(g: g, boyut: 28)
            Ilerleme(g: g)
            Text("\(vakitAdlari[g.sonraki]) \(saatYaz(g.hedef))").font(.system(size: 11)).foregroundColor(.white.opacity(0.8))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

struct VakitSatiri: View {
    let sira: Int
    let saat: Date
    let vurgulu: Bool
    let gecti: Bool
    let boyut: CGFloat
    let dikey: CGFloat
    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: vakitIkonlari[sira]).font(.system(size: boyut * 0.72)).frame(width: boyut + 2)
            Text(vakitAdlari[sira]).font(.system(size: boyut, weight: vurgulu ? .bold : .medium))
            Spacer(minLength: 4)
            Text(saatYaz(saat)).font(.system(size: boyut, weight: vurgulu ? .bold : .regular)).monospacedDigit()
        }
        .lineLimit(1)
        .padding(.horizontal, 8)
        .padding(.vertical, dikey)
        .background(RoundedRectangle(cornerRadius: 9, style: .continuous).fill(Color.white.opacity(vurgulu ? 0.15 : 0)))
        .foregroundColor(vurgulu ? acikAltin : .white)
        .opacity(gecti ? 0.5 : 1)
    }
}

struct VakitListesi: View {
    let g: Giris
    let boyut: CGFloat
    let dikey: CGFloat
    let aralik: CGFloat
    var body: some View {
        VStack(spacing: aralik) {
            ForEach(0..<6, id: \.self) { i in
                VakitSatiri(sira: i, saat: g.vakitler[i], vurgulu: i == g.sonraki, gecti: i < g.sonraki, boyut: boyut, dikey: dikey)
            }
        }
    }
}

struct OrtaGorunum: View {
    let g: Giris
    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                KonumYazisi(g: g, boyut: 14)
                Text(tarihYaz(g.vakitler.first ?? g.date)).font(.system(size: 10.5)).foregroundColor(hicriRenk.opacity(0.9)).lineLimit(1)
                Text(g.hicri).font(.system(size: 10.5)).foregroundColor(hicriRenk.opacity(0.9)).lineLimit(1).minimumScaleFactor(0.8)
                Spacer(minLength: 0)
                Etiket(g: g)
                GeriSayim(g: g, boyut: 27)
                Ilerleme(g: g)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            VakitListesi(g: g, boyut: 12.5, dikey: 2.5, aralik: 1)
                .frame(maxWidth: .infinity)
        }
    }
}

struct BuyukGorunum: View {
    let g: Giris
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 2) {
                    KonumYazisi(g: g, boyut: 18)
                    Text(g.hicri.isEmpty ? tarihYaz(g.vakitler.first ?? g.date) : "\(tarihYaz(g.vakitler.first ?? g.date)) · \(g.hicri)")
                        .font(.system(size: 11.5)).foregroundColor(hicriRenk).lineLimit(1).minimumScaleFactor(0.75)
                }
                Spacer(minLength: 6)
                ZStack {
                    Circle().fill(altin.opacity(0.18)).frame(width: 30, height: 30)
                    Image(systemName: "moon.stars.fill").font(.system(size: 13)).foregroundColor(altin)
                }
            }
            VStack(alignment: .leading, spacing: 4) {
                Etiket(g: g, ek: "vaktine kalan")
                HStack(alignment: .firstTextBaseline) {
                    GeriSayim(g: g, boyut: 38)
                    Spacer(minLength: 6)
                    Text(saatYaz(g.hedef)).font(.system(size: 14, weight: .medium)).foregroundColor(.white.opacity(0.85))
                }
                Ilerleme(g: g)
                HStack {
                    Text("\(vakitAdlari[g.oncekiSira]) \(saatYaz(g.onceki))")
                    Spacer()
                    Text("\(vakitAdlari[g.sonraki]) \(saatYaz(g.hedef))")
                }
                .font(.system(size: 10)).foregroundColor(.white.opacity(0.6))
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 9)
            .background(RoundedRectangle(cornerRadius: 16, style: .continuous).fill(Color.white.opacity(0.08)))
            VakitListesi(g: g, boyut: 15, dikey: 3.5, aralik: 1)
            Spacer(minLength: 0)
        }
    }
}

struct KilitDikdortgen: View {
    let g: Giris
    var body: some View {
        VStack(alignment: .leading, spacing: 1) {
            HStack(spacing: 4) {
                Image(systemName: vakitIkonlari[g.sonraki])
                Text("\(vakitAdlari[g.sonraki]) \(saatYaz(g.hedef))")
            }
            .font(.headline).lineLimit(1)
            Text(timerInterval: g.date...max(g.date, g.hedef), countsDown: true)
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .monospacedDigit()
            Ilerleme(g: g, renk: .white)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct KilitYuvarlak: View {
    let g: Giris
    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            VStack(spacing: 1) {
                Image(systemName: vakitIkonlari[g.sonraki]).font(.system(size: 14))
                Text(saatYaz(g.hedef)).font(.system(size: 13, weight: .bold, design: .rounded)).minimumScaleFactor(0.7)
            }
        }
    }
}

struct VakitGorunum: View {
    @Environment(\.widgetFamily) var aile
    let g: Giris

    var body: some View {
        if g.veriYok || g.vakitler.count != 6 {
            if aile == .accessoryRectangular || aile == .accessoryInline || aile == .accessoryCircular {
                Text("Üç Nur'u açın").arkaPlan(Color.clear, bosluk: false)
            } else {
                VeriYokGorunum().arkaPlan(Zemin())
            }
        } else {
            switch aile {
            case .systemSmall:
                KucukGorunum(g: g).arkaPlan(Zemin())
            case .systemMedium:
                OrtaGorunum(g: g).arkaPlan(Zemin())
            case .accessoryRectangular:
                KilitDikdortgen(g: g).arkaPlan(Color.clear, bosluk: false)
            case .accessoryCircular:
                KilitYuvarlak(g: g).arkaPlan(Color.clear, bosluk: false)
            case .accessoryInline:
                Text("\(Image(systemName: vakitIkonlari[g.sonraki])) \(vakitAdlari[g.sonraki]) \(saatYaz(g.hedef))").arkaPlan(Color.clear, bosluk: false)
            default:
                BuyukGorunum(g: g).arkaPlan(Zemin())
            }
        }
    }
}

// MARK: - Araç takımı

struct VakitWidget: Widget {
    let kind = "VakitWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Saglayici()) { g in
            VakitGorunum(g: g)
        }
        .configurationDisplayName("Namaz Vakitleri")
        .description("Sıradaki vakte kalan süre ve günün vakitleri")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryRectangular, .accessoryCircular, .accessoryInline])
    }
}

@main
struct UcNurWidgetBundle: WidgetBundle {
    var body: some Widget {
        VakitWidget()
    }
}
