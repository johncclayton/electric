ionic cordova build --prod --release android
"%JAVA_HOME%\bin\jarsigner" -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore electric-release.keystore platforms\android\build\outputs\apk\android-release-unsigned.apk electric-charger
DEL platforms\android\build\outputs\apk\android-release-signed.apk
"%ANDROID_HOME%\build-tools\26.0.0\zipalign" -v 4 platforms\android\build\outputs\apk\android-release-unsigned.apk platforms\android\build\outputs\apk\android-release-signed.apk