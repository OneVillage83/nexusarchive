# Mobile Packaging

This project ships as a Capacitor wrapper around the live production site at `https://nexusarchive.lol`.

## Environment

Set these values locally before syncing or building native apps:

```env
NEXT_PUBLIC_SITE_URL=https://nexusarchive.lol
CAPACITOR_SERVER_URL=https://nexusarchive.lol
CAPACITOR_ALLOWED_HOSTS=nexusarchive.lol
CAPACITOR_APP_ID=lol.nexusarchive
CAPACITOR_APP_NAME=NexusArchive
BLOB_READ_WRITE_TOKEN=
```

`BLOB_READ_WRITE_TOKEN` comes from Vercel Blob and is required for production
scanner uploads. Local development can omit it and use filesystem scanner
storage instead.

## Android

Capacitor 7 generates Android projects that compile with Java 21, so use a Java 21 JDK when building release packages.

Local signing stays outside git:

- keystore file: `C:/Users/<you>/.nexusarchive-signing/nexusarchive-release.jks`
- signing properties: `android/keystore.properties`
- template: `android/keystore.properties.example`

Use forward slashes for `storeFile` in `android/keystore.properties` on Windows.

Build the signed release APK:

```bash
npm run mobile:build:android:release
```

The signed APK is written to:

```text
android/app/build/outputs/apk/release/app-release.apk
```

## iPhone

The iOS project is configured with bundle ID `lol.nexusarchive`, but final install still needs a Mac.

On the Mac:

1. Install Xcode and CocoaPods.
2. Pull the repo and set the same environment values locally.
3. Run `npm install`.
4. Run `npm run mobile:sync`.
5. Open `ios/App/App.xcworkspace` in Xcode after `pod install` if CocoaPods creates it, otherwise open `ios/App/App.xcodeproj`.
6. Select your Apple team, connect the iPhone, and press Run.

The iOS app requests camera and photo library access for the scanner flow.
