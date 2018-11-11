Android
=======

- Had to 'ionic cordova platform remove android' and then 'ionic cordova platform remove android@7' to get a v7 there.
- For some reason gradlew not there. Had to do a 'gradle wrapper' from within the platforms/android folder.
    - Can also do this using Android Studio. Just open it up to the android@7 project and it'll run graddle wrapper.
    - This might not be a problem with android@7... I didn't check

- Found that I had to run a 'release/prod' build in order for fastlane (or gradle?) to sign the APK
