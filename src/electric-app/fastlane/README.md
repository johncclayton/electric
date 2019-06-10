fastlane documentation
================
# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```
xcode-select --install
```

Install _fastlane_ using
```
[sudo] gem install fastlane -NV
```
or alternatively using `brew cask install fastlane`

# Available Actions
## iOS
### ios dev
```
fastlane ios dev
```
Just build the thing
### ios frames
```
fastlane ios frames
```

### ios screenshots
```
fastlane ios screenshots
```

### ios alpha
```
fastlane ios alpha
```

### ios prod
```
fastlane ios prod
```


----

## Android
### android internal
```
fastlane android internal
```
Deploy a new internal version
### android alpha
```
fastlane android alpha
```
Deploy a new alpha version
### android beta
```
fastlane android beta
```
Deploy a new beta version
### android prod
```
fastlane android prod
```
Deploy a new version to the Google Play

----

This README.md is auto-generated and will be re-generated every time [fastlane](https://fastlane.tools) is run.
More information about fastlane can be found on [fastlane.tools](https://fastlane.tools).
The documentation of fastlane can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
