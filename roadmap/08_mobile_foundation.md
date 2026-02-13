# Phase 8: Mobile Foundation (Capacitor)

**Goal**: Wrap the Vue 3 application into a native Android app using Capacitor.

## Deliverables

- [ ] Capacitor Project Initialization
- [ ] Android Config & Build
- [ ] Mobile-Specific UI Adaptations
- [ ] Basic Native Plugins (StatusBar, SplashScreen)

## Framework

- **Tool**: Capacitor 5/6.
- **Platform**: Android (APK).

## Tasks

### 8.1 Capacitor Setup

- `npm install @capacitor/core @capacitor/cli @capacitor/android`.
- `npx cap init FileCloud com.filecloud.app`.
- `npx cap add android`.

### 8.2 Configuration (`capacitor.config.ts`)

- **Server URL**: Point to dev machine IP for development (Live Reload).
- **Production**: Point to embedded `dist` folder.
- **Cleartext Traffic**: Enable for local dev.

### 8.3 UI Adaptation

- **Touch Areas**: Increase clickable areas for mobile.
- **Hover States**: Remove `:hover` reliance for critical actions.
- **Viewport**: Ensure `viewport-fit=cover` and handle safe areas (notch).
- **Navigation**: Verify Sidebar/BottomTab behavior on small screens.

### 8.4 Basic Plugins

- **Splash Screen**: Configure launch branding.
- **Status Bar**: Match app theme colors.
- **Keyboard**: Handle keyboard overlap on input fields.
