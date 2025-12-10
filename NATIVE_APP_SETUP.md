# 📱 Native Mobile App Setup Guide

Your app is now configured as a **native mobile application** using Capacitor! This guide will help you build and deploy to iOS and Android.

## ✅ Current Setup Status

**What's Already Configured:**
- ✅ Capacitor initialized with `capacitor.config.ts`
- ✅ All Capacitor dependencies installed (@capacitor/core, @capacitor/cli, @capacitor/ios, @capacitor/android)
- ✅ Native plugins configured (Camera, Push Notifications, Status Bar, Haptics)
- ✅ Hot-reload configured with Lovable sandbox URL for live testing
- ✅ Dependency conflicts resolved (date-fns downgraded to v3.6.0 for compatibility)

**What You Need to Do Next:**
1. Transfer project to your GitHub repository
2. Clone the project locally
3. Run `npm install`
4. Add iOS and/or Android platforms: `npx cap add ios` and/or `npx cap add android`
5. Update native dependencies: `npx cap update ios` or `npx cap update android`
6. Build and sync: `npm run build && npx cap sync`
7. Run on device/emulator: `npx cap run ios` or `npx cap run android`

---

## ✨ Native Features Included

- 📸 **Camera Access** - Take photos directly from the device camera
- 📱 **Photo Gallery** - Select images from the photo library
- 🔔 **Push Notifications** - Receive real-time notifications on mobile
- ⚡ **Haptic Feedback** - Native vibration feedback for better UX
- 🎨 **Status Bar Customization** - Matches your app's theme
- 🚀 **Native Performance** - Full native speed and optimization

## 🚀 Quick Start

### Prerequisites

**For iOS Development:**
- Mac computer with macOS
- Xcode 14 or later (from Mac App Store)
- CocoaPods (`sudo gem install cocoapods`)
- Apple Developer Account (for deployment)

**For Android Development:**
- Android Studio (latest version)
- Java Development Kit (JDK) 17
- Android SDK (installed with Android Studio)

**Both Platforms:**
- Node.js 18+ and npm
- Git

---

## 📦 Step-by-Step Setup

### 1. Transfer to Your GitHub Repository

1. In Lovable, click **"Export to Github"** button (top right)
2. Follow the prompts to connect your GitHub account
3. Clone the repository to your local machine:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
   cd YOUR_REPO
   ```

### 2. Install Dependencies

```bash
npm install
```

**Note:** If you encounter peer dependency warnings with `date-fns` and `react-day-picker`, the project has been configured with `date-fns@3.6.0` for compatibility. This downgrade resolves conflicts while maintaining all required functionality.

### 3. Verify Capacitor Configuration

**Capacitor is already initialized!** You don't need to run `npx cap init` again.

If you try to run it, you'll see this message:
```
[error] Cannot run init for a project using a non-JSON configuration file.
        Delete capacitor.config.ts and try again.
```

This is normal - it means Capacitor is already set up. Your configuration is in `capacitor.config.ts`:
- **App ID**: `app.lovable.41608dd60247465e82aa5a0ff12e17fe`
- **App Name**: `book-passages`
- **Hot-Reload URL**: Pre-configured to load from Lovable sandbox for development

### 4. Add Native Platforms

**For iOS:**
```bash
npx cap add ios
npx cap update ios
```

**For Android:**
```bash
npx cap add android
npx cap update android
```

### 5. Build Your Web Assets

```bash
npm run build
```

### 6. Sync Capacitor

After any code changes or the initial setup:
```bash
npx cap sync
```

This command:
- Copies your built web app to native projects
- Updates native dependencies
- Syncs configuration changes

---

## 🏃 Running Your App

### iOS

**On Simulator:**
```bash
npx cap run ios
```

**On Physical Device:**
1. Open in Xcode: `npx cap open ios`
2. Connect your iPhone via USB
3. Select your device in Xcode (top toolbar)
4. Click the ▶️ Play button or press `Cmd + R`
5. **Important**: Trust the developer certificate on your iPhone (Settings → General → Device Management)

### Android

**On Emulator:**
```bash
npx cap run android
```

**On Physical Device:**
1. Enable Developer Mode on your Android device:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings → Developer Options
   - Enable "USB Debugging"
2. Connect device via USB
3. Run: `npx cap run android`

**Or Open in Android Studio:**
```bash
npx cap open android
```

---

## 🔄 Development Workflow

During development, you can use **hot-reload** to see changes instantly:

### Development Mode (Hot-Reload Enabled)

Your `capacitor.config.ts` is configured with a `server.url` pointing to the Lovable sandbox:
```typescript
server: {
  url: 'https://41608dd6-0247-465e-82aa-5a0ff12e17fe.lovableproject.com?forceHideBadge=true',
  cleartext: true
}
```

**Benefits:**
- Make changes in Lovable and see them instantly on your device
- No need to rebuild and sync for every UI change
- Perfect for rapid prototyping and testing

**⚠️ Important:** Before building for production or app store submission, you must **remove or comment out the `server` section** from `capacitor.config.ts`!

### Testing Native Features

When testing native-specific features (camera, push notifications, etc.):
```bash
# After making changes to native code or plugins
npm run build
npx cap sync

# Or combine them
npm run build && npx cap sync && npx cap run ios
```

---

## 📸 Native Features Usage

### Camera Access

The camera is automatically integrated into image upload components:
- When running as a native app, you'll see "Camera" and "Gallery" buttons
- First time users will be prompted for camera permissions
- Photos are automatically optimized (max 1200x1200px, 90% quality)

### Push Notifications

Push notifications are automatically initialized when the app starts:
- Users will be prompted for notification permissions on first launch
- Tokens are saved to the database for sending notifications
- Notifications show as native OS notifications
- Tapping a notification navigates to the relevant screen

To send push notifications, you'll need to:
1. Set up Firebase Cloud Messaging (FCM) for Android
2. Set up Apple Push Notification Service (APNs) for iOS

### Haptic Feedback

Use haptic feedback in your code:
```typescript
import { useNativeFeatures } from '@/hooks/useNativeFeatures';

const { hapticFeedback, hapticNotification } = useNativeFeatures();

// Light tap feedback
await hapticFeedback(ImpactStyle.Light);

// Success notification
await hapticNotification(NotificationType.Success);
```

---

## 🎨 Customization

### App Icon & Splash Screen

1. **Generate icons**: Use [https://www.appicon.co/](https://www.appicon.co/)
2. **For iOS**: Replace images in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
3. **For Android**: Replace images in `android/app/src/main/res/mipmap-*/`

### App Configuration

Edit `capacitor.config.ts`:
```typescript
const config: CapacitorConfig = {
  appId: 'your.app.id',
  appName: 'Your App Name',
  // ... other config
};
```

### Platform-Specific Settings

**iOS** - Edit `ios/App/App/Info.plist`:
- Camera usage description
- Photo library usage description
- Notification permissions

**Android** - Edit `android/app/src/main/AndroidManifest.xml`:
- Permissions
- Activity settings

---

## 🚀 Deployment

### ⚠️ Pre-Production Checklist

Before building for production or app store submission:

1. **Remove Hot-Reload Configuration** - Edit `capacitor.config.ts` and remove or comment out the `server` section:
   ```typescript
   // server: {
   //   url: 'https://41608dd6-0247-465e-82aa-5a0ff12e17fe.lovableproject.com?forceHideBadge=true',
   //   cleartext: true
   // },
   ```

2. **Build Production Assets**:
   ```bash
   npm run build
   npx cap sync
   ```

3. **Test on Device** - Ensure app loads correctly without the server URL

### iOS App Store

1. **Prepare**:
   - Join Apple Developer Program ($99/year)
   - Create App ID in Apple Developer Console
   - Create app in App Store Connect

2. **Build**:
   - Open project: `npx cap open ios`
   - Select "Any iOS Device" as target
   - Product → Archive
   - Upload to App Store Connect

3. **Submit for Review**

### Google Play Store

1. **Prepare**:
   - Create Google Play Developer Account ($25 one-time)
   - Create app in Google Play Console

2. **Build**:
   - Open project: `npx cap open android`
   - Build → Generate Signed Bundle / APK
   - Choose "Android App Bundle"
   - Create/use keystore for signing

3. **Upload**:
   - Upload AAB to Google Play Console
   - Complete store listing
   - Submit for review

---

## 🔧 Troubleshooting

### Dependency Conflicts

**date-fns and react-day-picker peer dependency warnings**

If you see warnings like:
```
npm WARN ERESOLVE overriding peer dependency
npm WARN While resolving: react-day-picker@8.10.1
npm WARN Found: date-fns@4.1.0
```

**Solution:** The project uses `date-fns@3.6.0` for compatibility with `react-day-picker@8.10.1`. This is already configured in the project. If you need to reinstall:
```bash
npm install date-fns@3.6.0 --save-exact
```

### Capacitor Initialization Error

**"Cannot run init for a project using a non-JSON configuration file"**

This is **not an error** - it means Capacitor is already initialized! The `capacitor.config.ts` file already exists. You can skip the `npx cap init` step and proceed directly to adding platforms.

### iOS Build Issues

**"Command PhaseScriptExecution failed"**
```bash
cd ios/App
pod deintegrate
pod install
```

**"Developer certificate not trusted"**
- On iPhone: Settings → General → Device Management → Trust certificate

### Android Build Issues

**"SDK location not found"**
- Create `local.properties` in `android/` folder:
  ```
  sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
  ```

**Gradle issues**
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

### General Issues

**App not updating after changes**
```bash
npm run build
npx cap copy
npx cap sync
```

**Clear cache and rebuild**
```bash
rm -rf node_modules
rm -rf ios/App/Pods
rm -rf android/.gradle
npm install
npx cap sync
```

**App shows old content or won't load**
- If using hot-reload (server.url configured), ensure the Lovable sandbox URL is accessible
- For production builds, remove the `server` section from `capacitor.config.ts`
- Clear app data on device and reinstall

---

## 📚 Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android Design Guidelines](https://developer.android.com/design)
- [Capacitor Camera Plugin](https://capacitorjs.com/docs/apis/camera)
- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)

---

## 🆘 Need Help?

- Check [Capacitor Community Forum](https://forum.ionicframework.com/c/capacitor)
- Review [Capacitor GitHub Issues](https://github.com/ionic-team/capacitor/issues)
- Join [Lovable Discord Community](https://discord.gg/lovable)

---

## 🎉 Next Steps

1. ✅ Test on physical devices
2. ✅ Set up push notification backend
3. ✅ Design custom app icon and splash screen
4. ✅ Test all camera and gallery features
5. ✅ Optimize performance for mobile
6. ✅ Submit to App Stores

**Happy Building! 🚀**
