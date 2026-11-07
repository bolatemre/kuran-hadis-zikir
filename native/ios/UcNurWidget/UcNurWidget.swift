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

struct Giris: TimelineEntry {
    let date: Date
    let konum: String
    let vakitler: [Date]   // gösterilen günün altı vakti
    let sonraki: Int       // sıradaki vaktin sırası (vurgulanır)
    let hedef: Date        // sıradaki vaktin saati
    let veriYok: Bool

    static func bos(_ d: Date) -> Giris {
        Giris(date: d, konum: "Üç Nur", vakitler: [], sonraki: 0, hedef: d, veriYok: true)
    }

    static func ornek() -> Giris {
        let simdi = Date()
        let saatler = [-9.0, -7.5, -3.0, 0.5, 3.0, 4.4].map { simdi.addingTimeInterval($0 * 3600) }
        return Giris(date: simdi, konum: "İstanbul", vakitler: saatler, sonraki: 3, hedef: saatler[3], veriYok: false)
    }
}

enum Hesap {
    static func giris(_ d: Date, veri: VakitVerisi) -> Giris? {
        let gunler: [[Date]] = veri.gunler.map { g in g.v.map { Date(timeIntervalSince1970: $0 / 1000) } }.filter { $0.count == 6 }
        let gelecek = gunler.flatMap { $0 }.filter { $0 > d }
        guard let hedef = gelecek.min() else { return nil }
        // Sıradaki vakit bugünse bugünün listesi, yatsıdan sonra ise yarının listesi gösterilir
        guard let gun = gunler.first(where: { $0.contains(hedef) }) else { return nil }
        let sira = gun.firstIndex(of: hedef) ?? 0
        return Giris(date: d, konum: veri.konum, vakitler: gun, sonraki: sira, hedef: hedef, veriYok: false)
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

let yesilKoyu = Color(red: 0.059, green: 0.239, blue: 0.180)   // #0f3d2e
let yesilAcik = Color(red: 0.090, green: 0.361, blue: 0.267)   // #175c44
let altin = Color(red: 0.910, green: 0.769, blue: 0.431)       // #e8c46e

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
    func arkaPlan<V: View>(_ zemin: V) -> some View {
        if #available(iOS 17.0, *) {
            self.containerBackground(for: .widget) { zemin }
        } else {
            self.background(zemin)
        }
    }
}

struct Zemin: View {
    var body: some View {
        LinearGradient(colors: [yesilAcik, yesilKoyu], startPoint: .topLeading, endPoint: .bottomTrailing)
    }
}

struct GeriSayim: View {
    let g: Giris
    let boyut: CGFloat
    var body: some View {
        Text(timerInterval: g.date...max(g.date, g.hedef), countsDown: true)
            .font(.system(size: boyut, weight: .bold, design: .rounded))
            .monospacedDigit()
            .foregroundColor(.white)
            .minimumScaleFactor(0.6)
            .lineLimit(1)
    }
}

struct VeriYokGorunum: View {
    var body: some View {
        VStack(spacing: 6) {
            Text("Üç Nur").font(.headline).foregroundColor(altin)
            Text("Vakitler için uygulamayı bir kez açın").font(.caption).foregroundColor(.white).multilineTextAlignment(.center)
        }
        .padding()
    }
}

struct KucukGorunum: View {
    let g: Giris
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(g.konum).font(.caption).bold().foregroundColor(.white.opacity(0.85)).lineLimit(1)
            Spacer(minLength: 0)
            Text("\(vakitAdlari[g.sonraki]) vaktine").font(.caption).foregroundColor(altin)
            GeriSayim(g: g, boyut: 30)
            Text(saatYaz(g.hedef)).font(.footnote).foregroundColor(.white.opacity(0.85))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

struct VakitSatiri: View {
    let ad: String
    let saat: Date
    let vurgulu: Bool
    let boyut: CGFloat
    var body: some View {
        HStack {
            Text(ad).font(.system(size: boyut, weight: vurgulu ? .bold : .medium))
            Spacer(minLength: 4)
            Text(saatYaz(saat)).font(.system(size: boyut, weight: vurgulu ? .bold : .regular)).monospacedDigit()
        }
        .foregroundColor(vurgulu ? altin : .white)
    }
}

struct OrtaGorunum: View {
    let g: Giris
    var body: some View {
        HStack(spacing: 14) {
            VStack(alignment: .leading, spacing: 3) {
                Text(g.konum).font(.subheadline).bold().foregroundColor(.white).lineLimit(1)
                Text(tarihYaz(g.vakitler.first ?? g.date)).font(.caption2).foregroundColor(.white.opacity(0.75)).lineLimit(1)
                Spacer(minLength: 0)
                Text("\(vakitAdlari[g.sonraki]) vaktine").font(.caption).foregroundColor(altin)
                GeriSayim(g: g, boyut: 28)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            VStack(spacing: 2) {
                ForEach(0..<6, id: \.self) { i in
                    VakitSatiri(ad: vakitAdlari[i], saat: g.vakitler[i], vurgulu: i == g.sonraki, boyut: 13)
                }
            }
            .frame(maxWidth: .infinity)
        }
    }
}

struct BuyukGorunum: View {
    let g: Giris
    var body: some View {
        VStack(spacing: 10) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(g.konum).font(.title3).bold().foregroundColor(.white).lineLimit(1)
                    Text(tarihYaz(g.vakitler.first ?? g.date)).font(.footnote).foregroundColor(.white.opacity(0.75))
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 2) {
                    Text("\(vakitAdlari[g.sonraki]) vaktine").font(.caption).foregroundColor(altin)
                    GeriSayim(g: g, boyut: 30)
                }
            }
            Divider().background(Color.white.opacity(0.3))
            VStack(spacing: 6) {
                ForEach(0..<6, id: \.self) { i in
                    VakitSatiri(ad: vakitAdlari[i], saat: g.vakitler[i], vurgulu: i == g.sonraki, boyut: 19)
                }
            }
            Spacer(minLength: 0)
        }
    }
}

struct KilitDikdortgen: View {
    let g: Giris
    var body: some View {
        VStack(alignment: .leading, spacing: 1) {
            Text("\(vakitAdlari[g.sonraki]) \(saatYaz(g.hedef))").font(.headline).lineLimit(1)
            Text(timerInterval: g.date...max(g.date, g.hedef), countsDown: true)
                .font(.system(size: 20, weight: .semibold, design: .rounded))
                .monospacedDigit()
            Text(g.konum).font(.caption2).lineLimit(1)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct VakitGorunum: View {
    @Environment(\.widgetFamily) var aile
    let g: Giris

    var body: some View {
        if g.veriYok || g.vakitler.count != 6 {
            if aile == .accessoryRectangular || aile == .accessoryInline {
                Text("Üç Nur'u açın").arkaPlan(Color.clear)
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
                KilitDikdortgen(g: g).arkaPlan(Color.clear)
            case .accessoryInline:
                Text("\(vakitAdlari[g.sonraki]) \(saatYaz(g.hedef))").arkaPlan(Color.clear)
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
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge, .accessoryRectangular, .accessoryInline])
    }
}

@main
struct UcNurWidgetBundle: WidgetBundle {
    var body: some Widget {
        VakitWidget()
    }
}
