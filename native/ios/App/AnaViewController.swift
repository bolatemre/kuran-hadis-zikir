// Üç Nur — uygulamaya özel yerel eklentileri (araç takımı verisi) Capacitor'a tanıtır.
import UIKit
import Capacitor

class AnaViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(WidgetVeriPlugin())
    }
}
