// Üç Nur — uygulamanın hesapladığı vakitleri araç takımının okuyabileceği paylaşılan anahtar zincirine yazar.
import Foundation
import Capacitor
import Security
import WidgetKit

@objc(WidgetVeriPlugin)
public class WidgetVeriPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetVeriPlugin"
    public let jsName = "WidgetVeri"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "kaydet", returnType: CAPPluginReturnPromise)
    ]

    static let grup = "Z5ZU32M6W4.com.bolatemre.khz.paylasim"

    @objc func kaydet(_ call: CAPPluginCall) {
        guard let metin = call.getString("veri"), let veri = metin.data(using: .utf8) else {
            call.reject("veri yok")
            return
        }
        let anahtar: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: "ucnur",
            kSecAttrAccount as String: "vakitler",
            kSecAttrAccessGroup as String: WidgetVeriPlugin.grup,
        ]
        SecItemDelete(anahtar as CFDictionary)
        var ekle = anahtar
        ekle[kSecValueData as String] = veri
        ekle[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
        let durum = SecItemAdd(ekle as CFDictionary, nil)
        WidgetCenter.shared.reloadAllTimelines()
        if durum == errSecSuccess {
            call.resolve()
        } else {
            call.reject("anahtar zinciri hatası: \(durum)")
        }
    }
}
