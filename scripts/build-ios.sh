#!/usr/bin/env bash
# Kuran Hadis Zikir: iOS derleme ve TestFlight yükleme. Workflow sadece bu betiği çalıştırır;
# derleme adımlarında değişiklik gerekirse yalnızca bu dosya güncellenir.
set -euo pipefail
TEAM_ID=Z5ZU32M6W4
ASC_KEY_ID=G272Z79794
ASC_ISSUER_ID=ab9b64ae-e251-4e02-b25f-e51f11fccc2d
BUNDLE_ID=com.bolatemre.khz
BUILD_NUMBER="${BUILD_NUMBER:-1}"
TMP="${RUNNER_TEMP:-/tmp}"
REPO="$(pwd)"
# App Store sürüm numarası (1.1, 1.2 …): onaylanan her sürümden sonra surum.txt içindeki sayı büyütülür
SURUM="$(tr -d ' \n\r' < surum.txt 2>/dev/null || true)"; SURUM="${SURUM:-1.1}"
echo "Sürüm: $SURUM ($BUILD_NUMBER)"

echo "::group::Xcode 26 seç (App Store iOS 26 SDK istiyor)"
XC=$(ls -d /Applications/Xcode_26*.app 2>/dev/null | sort -V | tail -1 || true)
if [ -z "$XC" ]; then
  echo "Bu sunucuda Xcode 26 yok. Kurulu olanlar:"; ls -d /Applications/Xcode*.app || true
  echo "::error::Xcode 26 bulunamadı. Workflow'da 'runs-on: macos-15' yerine 'runs-on: macos-26' yaz."
  exit 1
fi
sudo xcode-select -s "$XC/Contents/Developer"
xcodebuild -version
xcrun --sdk iphoneos --show-sdk-version
echo "::endgroup::"

test -f www/index.html || { echo "www/index.html bulunamadı"; exit 1; }

echo "::group::Paketler"
# İnternet takılırsa (ör. sharp indirmesi zaman aşımı) 3 kez dene
for i in 1 2 3; do npm install --no-audit --no-fund && break; [ "$i" = 3 ] && { echo "::error::npm install 3 kez başarısız"; exit 1; }; echo "npm install tekrar deneniyor ($i)"; rm -rf node_modules/sharp; sleep 20; done
node scripts/hazirla.js
# Şifreli imza anahtarları repodaki secrets/ klasöründe; şifre GitHub Secret KEY_PASS'ta
for f in asc-key dist-key android-upload; do test -s secrets/$f.enc || { echo "::error::secrets/$f.enc yok"; exit 1; }; done
python3 -m pip install --quiet --break-system-packages pillow 2>/dev/null || python3 -m pip install --quiet --user pillow
echo "::endgroup::"

echo "::group::İkon ve açılış görselleri"
python3 scripts/make-assets.py
echo "::endgroup::"

echo "::group::iOS projesi (Swift Package Manager)"
rm -rf ios
npx cap add ios --packagemanager SPM || echo "(pod install uyarısı yok sayıldı)"
test -d ios/App/App.xcodeproj || { echo "Xcode projesi oluşmadı"; exit 1; }
npx cap sync ios || npx cap copy ios
# Eklentiler gerçekten uygulamaya girdi mi? (bildirim, titreşim, reklam) — yoksa derlemeyi durdur
echo "--- CapApp-SPM/Package.swift ---"; cat ios/App/CapApp-SPM/Package.swift || true
echo "--- packageClassList ---"; grep -A6 packageClassList ios/App/App/capacitor.config.json || true
grep -q "LocalNotificationsPlugin" ios/App/App/capacitor.config.json || { echo "::error::Bildirim eklentisi packageClassList'te yok"; exit 1; }
npx @capacitor/assets generate --ios --iconBackgroundColor "#0f3d2e" --splashBackgroundColor "#0f3d2e"
# Bildirim sesleri (kısa ezan, zil, sessiz): uygulama paketine kopyalanır, aşağıda Xcode hedefine eklenir
if ls sesler/*.wav >/dev/null 2>&1; then cp sesler/*.wav ios/App/App/; else echo "::warning::Bildirim sesleri bulunamadı; bildirimler varsayılan sesle çalar"; fi
echo "::endgroup::"

echo "::group::Info.plist"
P=ios/App/App/Info.plist
/usr/libexec/PlistBuddy -c "Delete :UISupportedInterfaceOrientations" "$P" || true
/usr/libexec/PlistBuddy -c "Add :UISupportedInterfaceOrientations array" "$P"
/usr/libexec/PlistBuddy -c "Add :UISupportedInterfaceOrientations:0 string UIInterfaceOrientationPortrait" "$P"
/usr/libexec/PlistBuddy -c "Add :ITSAppUsesNonExemptEncryption bool false" "$P" || /usr/libexec/PlistBuddy -c "Set :ITSAppUsesNonExemptEncryption false" "$P"
# AdMob (ödüllü reklam): uygulama kimliği ve iOS izin metni
source scripts/ads.env
/usr/libexec/PlistBuddy -c "Add :GADApplicationIdentifier string $ADMOB_IOS_APP_ID" "$P" || /usr/libexec/PlistBuddy -c "Set :GADApplicationIdentifier $ADMOB_IOS_APP_ID" "$P"
# Kişiselleştirilmemiş reklam: takip izni (ATT) istenmez
/usr/libexec/PlistBuddy -c "Add :NSLocationWhenInUseUsageDescription string Namaz vakitlerini ve kıble yönünü bulunduğunuz yere göre hesaplamak için kullanılır. Konumunuz cihazdan çıkmaz." "$P" || true
/usr/libexec/PlistBuddy -c "Add :NSMotionUsageDescription string Kıble pusulası için cihazın yön sensörü kullanılır." "$P" || true
/usr/libexec/PlistBuddy -c "Delete :SKAdNetworkItems" "$P" || true
/usr/libexec/PlistBuddy -c "Add :SKAdNetworkItems array" "$P"
/usr/libexec/PlistBuddy -c "Add :SKAdNetworkItems:0 dict" "$P"
/usr/libexec/PlistBuddy -c "Add :SKAdNetworkItems:0:SKAdNetworkIdentifier string cstr6suwn9.skadnetwork" "$P"
echo "::endgroup::"

echo "::group::App Store Connect anahtarı"
mkdir -p "$TMP/keys"
KEYFILE="$TMP/keys/AuthKey_${ASC_KEY_ID}.p8"
node scripts/decrypt-key.js > "$KEYFILE"
KC="$TMP/build.keychain-db";KCPASS="kc$RANDOM$RANDOM"
cleanup(){ rm -rf "$TMP/keys" "$TMP/dist-key.pem" "$TMP/dist.p12"; security delete-keychain "$KC" 2>/dev/null || true; }
trap cleanup EXIT
echo "::endgroup::"

echo "::group::App Store sayfası (metinler, ekran görüntüleri, kategori, yaş derecesi)"
# store-texts.json ve store/ios-6.9-1290x2796 içindeki görseller App Store Connect'e yazılır; hata derlemeyi durdurmaz
ASC_KEY_FILE="$KEYFILE" ASC_KEY_ID="$ASC_KEY_ID" ASC_ISSUER_ID="$ASC_ISSUER_ID" BUNDLE_ID="$BUNDLE_ID" node "$REPO/scripts/asc-listing.js" || true
echo "::endgroup::"

echo "::group::İmzalama (tek, kalıcı dağıtım sertifikası)"
# Her derlemede yeni sertifika üretmek Apple'ın sertifika sınırını dolduruyordu.
# Artık repodaki sabit anahtarla tek sertifika ve tek App Store profili tekrar tekrar kullanılıyor.
node scripts/signing.js
source "$TMP/signing.env"
security create-keychain -p "$KCPASS" "$KC"
security set-keychain-settings -lut 21600 "$KC"
security unlock-keychain -p "$KCPASS" "$KC"
security import "$P12" -k "$KC" -P "$P12_PASS" -A -T /usr/bin/codesign -T /usr/bin/security
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$KCPASS" "$KC" >/dev/null
security list-keychains -d user -s "$KC" $(security list-keychains -d user | tr -d '"')
security find-identity -v -p codesigning "$KC"
echo "::endgroup::"

AUTH=(-authenticationKeyPath "$KEYFILE" -authenticationKeyID "$ASC_KEY_ID" -authenticationKeyIssuerID "$ASC_ISSUER_ID")

echo "::group::Projeye imza ayarları (sadece uygulama hedefine)"
cd ios/App
# İmza ayarı komut satırından verilince Capacitor paketlerine de uygulanıyor ve bozuyordu;
# bu yüzden ayarları doğrudan projedeki "App" hedefine yazıyoruz.
gem list -i xcodeproj >/dev/null 2>&1 || gem install xcodeproj --user-install --no-document
TEAM_ID="$TEAM_ID" BUNDLE_ID="$BUNDLE_ID" PROFILE_NAME="$PROFILE_NAME" ruby -e '
  begin; require "xcodeproj"; rescue LoadError; Gem.paths=nil; require "xcodeproj"; end
  p=Xcodeproj::Project.open("App.xcodeproj")
  t=p.targets.find{|x| x.name=="App"} or abort("App hedefi yok")
  t.build_configurations.each do |c|
    s=c.build_settings
    s["CODE_SIGN_STYLE"]="Manual"; s["DEVELOPMENT_TEAM"]=ENV["TEAM_ID"]
    s["CODE_SIGN_IDENTITY"]="Apple Distribution"; s["CODE_SIGN_IDENTITY[sdk=iphoneos*]"]="Apple Distribution"
    s["PROVISIONING_PROFILE_SPECIFIER"]=ENV["PROFILE_NAME"]; s["PRODUCT_BUNDLE_IDENTIFIER"]=ENV["BUNDLE_ID"]
    s["TARGETED_DEVICE_FAMILY"]="1"  # sadece iPhone (iPad ekran görüntüsü gerekmez)
  end
  # Bildirim sesleri uygulama paketine (Copy Bundle Resources)
  begin
    g=p.main_group.children.find{|x| x.display_name=="App"} or raise("App grubu yok")
    Dir.glob("App/*.wav").sort.each do |f|
      ad=File.basename(f)
      next if g.files.any?{|x| x.path==ad}
      t.resources_build_phase.add_file_reference(g.new_reference(ad)); puts "Ses eklendi: #{ad}"
    end
  rescue => e
    puts "::warning::Bildirim sesleri Xcode projesine eklenemedi: #{e}"
  end
  p.save; puts "İmza ayarları yazıldı"'
echo "::endgroup::"

echo "::group::Ana ekran araç takımı (widget)"
# Namaz vakitleri + geri sayım araç takımı. Hata olursa proje hiç değiştirilmez, uygulama araç takımsız derlenir.
if [ "${WIDGET:-1}" = 1 ] && [ -n "${WIDGET_PROFILE_NAME:-}" ]; then
  rm -rf UcNurWidget && cp -R "$REPO/native/ios/UcNurWidget" UcNurWidget
  cp "$REPO"/native/ios/App/*.swift App/
  TEAM_ID="$TEAM_ID" WIDGET_PROFILE_NAME="$WIDGET_PROFILE_NAME" ruby -e '# encoding: utf-8
  begin; require "xcodeproj"; rescue LoadError; Gem.paths=nil; require "xcodeproj"; end
  begin
    p=Xcodeproj::Project.open("App.xcodeproj")
    app=p.targets.find{|x| x.name=="App"} or raise("App hedefi yok")
    raise("UcNurWidget hedefi zaten var") if p.targets.any?{|x| x.name=="UcNurWidget"}
    g=p.main_group.children.find{|x| x.display_name=="App"} or raise("App grubu yok")
    # 1) Uygulama tarafı: veriyi paylaşılan anahtar zincirine yazan eklenti + eklentiyi tanıtan ekran
    %w[WidgetVeriPlugin.swift AnaViewController.swift].each do |ad|
      ref=g.files.find{|x| x.path==ad} || g.new_reference(ad)
      app.source_build_phase.add_file_reference(ref, true)
    end
    # 2) Uygulamanın yetkileri: paylaşılan anahtar zinciri grubu
    ent=nil; app.build_configurations.each{|c| ent ||= c.build_settings["CODE_SIGN_ENTITLEMENTS"]}
    ent ||= "App/App.entitlements"
    h=File.exist?(ent) ? Xcodeproj::Plist.read_from_path(ent) : {}
    gr=h["keychain-access-groups"] || []
    ["$(AppIdentifierPrefix)com.bolatemre.khz","$(AppIdentifierPrefix)com.bolatemre.khz.paylasim"].each{|x| gr << x unless gr.include?(x)}
    h["keychain-access-groups"]=gr
    app.build_configurations.each{|c| c.build_settings["CODE_SIGN_ENTITLEMENTS"]=ent}
    # 3) Araç takımı hedefi
    wt=p.new_target(:app_extension, "UcNurWidget", :ios, "16.0", nil, :swift)
    wg=p.main_group.new_group("UcNurWidget", "UcNurWidget")
    wt.source_build_phase.add_file_reference(wg.new_reference("UcNurWidget.swift"), true)
    wg.new_reference("Info.plist"); wg.new_reference("UcNurWidget.entitlements")
    # Swift, WidgetKit ve SwiftUI çerçevelerini kendisi bağlar; SDK sürümüne sabitlenmiş çerçeve yolları bırakılmaz
    wt.frameworks_build_phase.files.to_a.each{|f| r=f.file_ref; wt.frameworks_build_phase.remove_build_file(f); r.remove_from_project if r}
    wt.build_configurations.each do |c|
      s=c.build_settings
      s["PRODUCT_NAME"]="$(TARGET_NAME)"; s["PRODUCT_BUNDLE_IDENTIFIER"]="com.bolatemre.khz.widget"
      s["INFOPLIST_FILE"]="UcNurWidget/Info.plist"; s["GENERATE_INFOPLIST_FILE"]="NO"
      s["CODE_SIGN_ENTITLEMENTS"]="UcNurWidget/UcNurWidget.entitlements"
      s["SWIFT_VERSION"]="5.0"; s["IPHONEOS_DEPLOYMENT_TARGET"]="16.0"; s["TARGETED_DEVICE_FAMILY"]="1"
      s["SKIP_INSTALL"]="YES"; s["APPLICATION_EXTENSION_API_ONLY"]="YES"
      s["LD_RUNPATH_SEARCH_PATHS"]=["$(inherited)","@executable_path/Frameworks","@executable_path/../../Frameworks"]
      s["MARKETING_VERSION"]="1.0"; s["CURRENT_PROJECT_VERSION"]="1"
      s["CODE_SIGN_STYLE"]="Manual"; s["DEVELOPMENT_TEAM"]=ENV["TEAM_ID"]
      s["CODE_SIGN_IDENTITY"]="Apple Distribution"; s["CODE_SIGN_IDENTITY[sdk=iphoneos*]"]="Apple Distribution"
      s["PROVISIONING_PROFILE_SPECIFIER"]=ENV["WIDGET_PROFILE_NAME"]
    end
    # 4) Araç takımını uygulamanın içine göm (PlugIns) ve önce onu derle
    ph=app.new_copy_files_build_phase("Embed Foundation Extensions")
    ph.symbol_dst_subfolder_spec=:plug_ins
    bf=ph.add_file_reference(wt.product_reference, true)
    bf.settings={"ATTRIBUTES"=>["RemoveHeadersOnCopy"]}
    app.add_dependency(wt)
    # 5) Ana ekran sınıfı: CAPBridgeViewController yerine eklentiyi tanıtan AnaViewController
    sb="App/Base.lproj/Main.storyboard"
    eski=File.read(sb)
    yeni=eski.sub(/customClass="CAPBridgeViewController"\s+customModule="Capacitor"/, %q(customClass="AnaViewController" customModule="App" customModuleProvider="target"))
    raise("Main.storyboard içinde CAPBridgeViewController bulunamadı") if yeni==eski
    Xcodeproj::Plist.write_to_path(h, ent)
    p.save
    File.write(sb, yeni)
    puts "Araç takımı projeye eklendi (#{ent})"
  rescue => e
    puts "::warning::Araç takımı eklenemedi, uygulama araç takımsız derlenecek: #{e}"
    puts e.backtrace.first(3)
  end'
  grep -n "customClass" App/Base.lproj/Main.storyboard || true
else
  echo "Araç takımı atlandı"
fi
echo "::endgroup::"

echo "::group::Arşivle"
xcodebuild -project App.xcodeproj -scheme App -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$TMP/App.xcarchive" archive \
  OTHER_CODE_SIGN_FLAGS="--keychain $KC" \
  MARKETING_VERSION="$SURUM" CURRENT_PROJECT_VERSION="$BUILD_NUMBER"
echo "::endgroup::"

echo "::group::TestFlight'a yükle"
cat > "$TMP/export.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>method</key><string>app-store-connect</string>
  <key>destination</key><string>upload</string>
  <key>teamID</key><string>${TEAM_ID}</string>
  <key>signingStyle</key><string>manual</string>
  <key>signingCertificate</key><string>Apple Distribution</string>
  <key>provisioningProfiles</key><dict><key>${BUNDLE_ID}</key><string>${PROFILE_NAME}</string><key>${BUNDLE_ID}.widget</key><string>${WIDGET_PROFILE_NAME:-}</string></dict>
</dict></plist>
PLIST
xcodebuild -exportArchive -archivePath "$TMP/App.xcarchive" \
  -exportOptionsPlist "$TMP/export.plist" -exportPath "$TMP/export" "${AUTH[@]}"
echo "::endgroup::"
echo "✅ TestFlight'a gönderildi (build $BUILD_NUMBER)"
