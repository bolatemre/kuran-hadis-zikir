#!/usr/bin/env bash
# Kuran Hadis Zikir: Google Play için imzalı AAB ve telefona kurulabilen APK üretir. Çıktı: dist/
set -euo pipefail
BUILD_NUMBER="${BUILD_NUMBER:-1}"
TMP="${RUNNER_TEMP:-/tmp}"

echo "::group::Paketler"
test -f www/index.html || { echo "www/index.html bulunamadı"; exit 1; }
# İnternet takılırsa (ör. sharp indirmesi zaman aşımı) 3 kez dene
for i in 1 2 3; do npm install --no-audit --no-fund && break; [ "$i" = 3 ] && { echo "::error::npm install 3 kez başarısız"; exit 1; }; echo "npm install tekrar deneniyor ($i)"; rm -rf node_modules/sharp; sleep 20; done
node scripts/hazirla.js
# Şifreli imza anahtarları repodaki secrets/ klasöründe; şifre GitHub Secret KEY_PASS'ta
for f in asc-key dist-key android-upload; do test -s secrets/$f.enc || { echo "::error::secrets/$f.enc yok"; exit 1; }; done
python3 -m pip install --quiet pillow 2>/dev/null || python3 -m pip install --quiet --user pillow || python3 -m pip install --quiet --break-system-packages pillow
python3 scripts/make-assets.py
echo "::endgroup::"

echo "::group::Android projesi"
rm -rf android
npx cap add android
npx cap copy android
npx @capacitor/assets generate --android --iconBackgroundColor "#0f3d2e" --splashBackgroundColor "#0f3d2e"
# Google Play: en az Android 7.0 (SDK 24), hedef API 36 (Android 16) şartı
sed -i -E "s/minSdkVersion = [0-9]+/minSdkVersion = 24/; s/compileSdkVersion = [0-9]+/compileSdkVersion = 36/; s/targetSdkVersion = [0-9]+/targetSdkVersion = 36/" android/variables.gradle
grep -nE "minSdkVersion|compileSdkVersion|targetSdkVersion" android/variables.gradle
echo "android.suppressUnsupportedCompileSdk=36" >> android/gradle.properties
SDKM=$(ls -d "${ANDROID_HOME:-$ANDROID_SDK_ROOT}"/cmdline-tools/*/bin/sdkmanager 2>/dev/null | head -1 || true)
if [ ! -d "${ANDROID_HOME:-$ANDROID_SDK_ROOT}/platforms/android-36" ] && [ -n "$SDKM" ]; then yes | "$SDKM" "platforms;android-36" >/dev/null || true; fi
ls "${ANDROID_HOME:-$ANDROID_SDK_ROOT}/platforms" | tail -3
G=android/app/build.gradle
sed -i -E "s/versionCode [0-9]+/versionCode ${BUILD_NUMBER}/; s/versionName \"[^\"]*\"/versionName \"1.0.${BUILD_NUMBER}\"/" "$G"
perl -0pi -e 's/<activity(\s)/<activity android:screenOrientation="portrait"$1/' android/app/src/main/AndroidManifest.xml
# AdMob (ödüllü reklam) uygulama kimliği
source scripts/ads.env
perl -0pi -e "s#(<application[^>]*>)#\$1\n        <meta-data android:name=\"com.google.android.gms.ads.APPLICATION_ID\" android:value=\"$ADMOB_ANDROID_APP_ID\"/>#" android/app/src/main/AndroidManifest.xml
grep -n "APPLICATION_ID" android/app/src/main/AndroidManifest.xml
# Ezan bildirimleri tam vaktinde gelsin (Android 12+): tam zamanlı alarm izni
perl -0pi -e 's#(<manifest[^>]*>)#$1\n    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM"/>\n    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>\n    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>\n    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>#' android/app/src/main/AndroidManifest.xml
grep -E "versionCode|versionName" "$G"
echo "::endgroup::"

echo "::group::AAB ve APK derle"
cd android
chmod +x gradlew
./gradlew --no-daemon bundleRelease assembleRelease
echo "::endgroup::"

echo "::group::İmzala"
node ../scripts/android-key.js
source "$TMP/android.env"
AAB=app/build/outputs/bundle/release/app-release.aab
jarsigner -sigalg SHA256withRSA -digestalg SHA-256 -keystore "$KS" -storepass "$KS_PASS" -keypass "$KS_PASS" "$AAB" "$KS_ALIAS"
jarsigner -verify "$AAB" | tail -1
mkdir -p ../dist
cp "$AAB" "../dist/kuran-hadis-zikir-${BUILD_NUMBER}.aab"
# Telefona doğrudan kurulabilen APK (aynı anahtarla imzalı)
BT=$(ls -d "${ANDROID_HOME:-$ANDROID_SDK_ROOT}"/build-tools/* | sort -V | tail -1)
APK_IN=app/build/outputs/apk/release/app-release-unsigned.apk
"$BT/zipalign" -p -f 4 "$APK_IN" "$TMP/aligned.apk"
"$BT/apksigner" sign --ks "$KS" --ks-pass "pass:$KS_PASS" --key-pass "pass:$KS_PASS" --ks-key-alias "$KS_ALIAS" --out "../dist/kuran-hadis-zikir-${BUILD_NUMBER}.apk" "$TMP/aligned.apk"
"$BT/apksigner" verify "../dist/kuran-hadis-zikir-${BUILD_NUMBER}.apk" && echo "APK imzası doğrulandı"
rm -f "$KS" "$TMP/android.env"
echo "::endgroup::"
echo "✅ Hazır: dist/kuran-hadis-zikir-${BUILD_NUMBER}.aab ve .apk"
