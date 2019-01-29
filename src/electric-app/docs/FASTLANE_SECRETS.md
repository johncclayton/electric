Passphrases
===========
Fastlane is expecting to use the macOS keychain for pwd management.
The build_ionic lane uses the 'electric' user. That user can be setup/added, like so:

    fastlane fastlane-credentials add --user electric

It'll prompt for a password (go see 1password for the keystore passphrase).
See the 'build_ionic' lane for where its used.