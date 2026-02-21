# Hira-AI Developer Setup Guide

Welcome to the **Hira-AI** project! This guide will help you set up your development environment and get the mobile app running on your local machine.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Overview](#project-overview)
3. [Initial Setup](#initial-setup)
4. [Environment Configuration](#environment-configuration)
5. [Running the App](#running-the-app)
6. [Development Workflow](#development-workflow)
7. [Deploy as PWA (Vercel)](#deploy-as-pwa-vercel)
8. [Troubleshooting](#troubleshooting)
9. [Project Structure](#project-structure)
10. [Additional Resources](#additional-resources)

---

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

1. **Node.js** (v18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **npm** (comes with Node.js)
   - Verify installation: `npm --version`

3. **Git**
   - Download from [git-scm.com](https://git-scm.com/)
   - Verify installation: `git --version`

### For Android Development

4. **Android Studio**
   - Download from [developer.android.com/studio](https://developer.android.com/studio)
   - Install the following components via SDK Manager:
     - Android SDK Platform 34 (or latest)
     - Android SDK Build-Tools
     - Android Emulator
     - Android SDK Platform-Tools

5. **Java Development Kit (JDK)**
   - JDK 17 or higher is recommended
   - Verify installation: `java --version`

6. **Android SDK Environment Variables**
   - Set `ANDROID_HOME` environment variable:
     - **Windows**: `C:\Users\<YourUsername>\AppData\Local\Android\Sdk`
     - **macOS/Linux**: `~/Library/Android/sdk` or `~/Android/Sdk`
   - Add to PATH:
     - `%ANDROID_HOME%\platform-tools`
     - `%ANDROID_HOME%\tools`
     - `%ANDROID_HOME%\tools\bin`

### For iOS Development (macOS only)

7. **Xcode** (latest version)
   - Download from Mac App Store
   - Install Command Line Tools: `xcode-select --install`

8. **CocoaPods**
   - Install: `sudo gem install cocoapods`
   - Verify installation: `pod --version`

---

## Project Overview

**Hira-AI** is a comprehensive health-tracking and AI coaching mobile application built with:

- **Frontend**: React Native + Expo (TypeScript)
- **Backend**: Supabase (PostgreSQL + Auth)
- **State Management**: TanStack Query (React Query)
- **UI**: Custom design system with theme tokens
- **AI Integration**: Anthropic/OpenRouter APIs

### Key Features

- 🏋️ **Workout Tracking**: Templates, programs, exercise search, muscle intensity
- 🍎 **Nutrition Tracking**: Meal logging, calorie/macro tracking, food search
- 😴 **Sleep Tracking**: Duration and quality monitoring
- 🎯 **Habit Tracking**: Routine management with streaks
- 🤖 **AI Coach (Hira)**: Personalized wellness coaching
- 🛒 **Marketplace**: Shop for supplements and templates
- 👥 **Community**: Social feed with posts, likes, and follows

---

## Initial Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd hira-ai-app-reactnative
```

### 2. Install Dependencies

Navigate to the mobile app directory and install packages:

```bash
cd apps/mobile
npm install
```

This will install all required dependencies including:
- Expo SDK
- React Native libraries
- Navigation packages
- Supabase client
- TanStack Query
- And more...

**Note**: The first installation may take several minutes.

---

## Environment Configuration

### 1. Create Environment File

Copy the example environment file and configure it:

```bash
cd apps/mobile
cp .env.example .env
```

### 2. Configure Environment Variables

Edit the `.env` file and add your API keys:

```env
EXPO_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_api_key_here

# For local/mobile development only.
# In production, route AI API calls through a backend service
# so this key is never shipped in the app bundle.
```

**Important**: 
- The `.env` file is gitignored and should never be committed
- For production, API keys should be managed through a secure backend service
- You can obtain an Anthropic API key from [console.anthropic.com](https://console.anthropic.com/)

### 3. Supabase Configuration

The app uses Supabase for backend services. The Supabase configuration is located in:
- `src/lib/supabase.ts`

You may need to update the Supabase URL and anon key if you're setting up your own instance.

### 4. Android SDK Configuration

The Android SDK path is configured in `apps/mobile/android/local.properties`:

```properties
sdk.dir=C:\\Users\\<YourUsername>\\AppData\\Local\\Android\\Sdk
```

This file is auto-generated but verify the path matches your Android SDK installation.

---

## Running the App

### Android

#### Option 1: Using an Emulator

1. **Start Android Emulator**
   - Open Android Studio
   - Go to **Tools > Device Manager**
   - Create a new virtual device (if needed)
   - Start the emulator

2. **Run the App**
   ```bash
   cd apps/mobile
   npm run android
   ```

   This command will:
   - Start the Expo development server
   - Build the Android app using Gradle
   - Install the app on the emulator
   - Launch the app

#### Option 2: Using a Physical Device

1. **Enable Developer Options** on your Android device:
   - Go to **Settings > About Phone**
   - Tap **Build Number** 7 times
   - Go back to **Settings > Developer Options**
   - Enable **USB Debugging**

2. **Connect Device** via USB

3. **Verify Connection**
   ```bash
   adb devices
   ```
   You should see your device listed.

4. **Run the App**
   ```bash
   cd apps/mobile
   npm run android
   ```

### iOS (macOS only)

1. **Install CocoaPods Dependencies**
   ```bash
   cd apps/mobile/ios
   pod install
   cd ..
   ```

2. **Run the App**
   ```bash
   npm run ios
   ```

### Development Server Only

To start just the Expo development server without building:

```bash
npm start
```

Then scan the QR code with:
- **Android**: Expo Go app
- **iOS**: Camera app

---

## Development Workflow

### Project Structure

```
hira-ai-app-reactnative/
├── apps/
│   ├── mobile/              # React Native mobile app
│   │   ├── src/
│   │   │   ├── components/  # Reusable UI components
│   │   │   ├── screens/     # App screens
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   ├── context/     # React Context providers
│   │   │   ├── services/    # Business logic & API services
│   │   │   ├── lib/         # Third-party library configs
│   │   │   ├── types/       # TypeScript type definitions
│   │   │   ├── theme.ts     # Design system tokens
│   │   │   └── App.tsx      # Main app component
│   │   ├── android/         # Android native code
│   │   ├── assets/          # Images, fonts, etc.
│   │   └── package.json
│   └── backend/             # NestJS backend (scaffold)
├── docs/                    # Documentation
├── DESIGN-SYSTEM.md         # Design system documentation
├── PROJECT_SUMMARY.md       # Project overview
├── database-schema.md       # Database schema documentation
└── SETUP.md                 # This file
```

### Key Files

- **`src/App.tsx`**: Main application entry point with navigation
- **`src/theme.ts`**: Design tokens (colors, spacing, typography)
- **`src/lib/supabase.ts`**: Supabase client configuration
- **`src/lib/react-query.ts`**: TanStack Query configuration

### Development Commands

```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios

# Run tests
npm test

# Generate app icons
npm run icon:generate
```

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Follow existing code patterns
- **Components**: Use functional components with hooks
- **Styling**: Use the design system tokens from `theme.ts`
- **State Management**: Use TanStack Query for server state, React Context for global client state

### Design System

The app uses a comprehensive design system defined in `theme.ts`:

```typescript
import { theme } from './theme';

// Colors
theme.colors.primary
theme.colors.background
theme.colors.text

// Spacing
theme.space[1]  // 4px
theme.space[2]  // 8px
theme.space[4]  // 16px

// Typography
theme.fontSizes.sm
theme.fontSizes.md
theme.fontWeights.semibold

// Border Radius
theme.radius.md
theme.radius.lg
```

See `DESIGN-SYSTEM.md` for complete documentation.

---

## Deploy as PWA (Vercel)

You can ship the app as a **web app (PWA)** so users install it via **Add to Home Screen** in Safari (no App Store, no signing).

### Build the web version

From the **apps/mobile** directory:

```bash
cd apps/mobile
npx expo export --platform web
```

This produces the **dist/** folder (full web app).

### Deploy to Vercel

1. Push the repo to GitHub.
2. In [Vercel](https://vercel.com): **Add New Project** → Import the repo.
3. Set **Root Directory** to **`apps/mobile`**.
4. **Build Command**: `npx expo export --platform web`
5. **Output Directory**: `dist`
6. Add any **Environment Variables** (e.g. `EXPO_PUBLIC_*` for Supabase or API keys) in Project Settings.
7. Deploy.

The repo includes **apps/mobile/vercel.json** so all routes serve `index.html` (SPA routing).

### Install on iPhone

1. Open the deployed URL in **Safari**.
2. Tap **Share** → **Add to Home Screen** → **Add**.
3. The app appears as an icon and opens fullscreen (no browser UI when configured).

---

## Troubleshooting

### Common Issues

#### 1. "expo is not recognized as a command"

**Solution**: Install dependencies first
```bash
cd apps/mobile
npm install
```

#### 2. "Android SDK location not found"

**Solution**: Set the `ANDROID_HOME` environment variable
- **Windows**: 
  ```
  setx ANDROID_HOME "C:\Users\<YourUsername>\AppData\Local\Android\Sdk"
  ```
- **macOS/Linux**: Add to `~/.bashrc` or `~/.zshrc`
  ```bash
  export ANDROID_HOME=~/Library/Android/sdk
  export PATH=$PATH:$ANDROID_HOME/platform-tools
  ```

#### 3. "Gradle build failed"

**Solutions**:
- Clean Gradle cache:
  ```bash
  cd apps/mobile/android
  ./gradlew clean
  cd ..
  ```
- Delete build folders:
  ```bash
  rm -rf android/build
  rm -rf android/app/build
  ```
- Rebuild:
  ```bash
  npm run android
  ```

#### 4. "Metro bundler error" or "Unable to resolve module"

**Solution**: Clear Metro cache
```bash
npx expo start --clear
```

#### 5. "react-native-reanimated requires New Architecture"

**Solution**: The project already has New Architecture enabled in `android/gradle.properties`:
```properties
newArchEnabled=true
```

If you encounter issues, verify this setting is present.

#### 6. Port already in use

**Solution**: Kill the process using port 8081
- **Windows**:
  ```bash
  netstat -ano | findstr :8081
  taskkill /PID <PID> /F
  ```
- **macOS/Linux**:
  ```bash
  lsof -ti:8081 | xargs kill -9
  ```

#### 7. "Unable to connect to development server"

**Solutions**:
- Ensure your device and computer are on the same Wi-Fi network
- Check firewall settings
- Try using USB connection instead
- Restart the development server

### Getting Help

If you encounter issues not covered here:

1. Check the [Expo documentation](https://docs.expo.dev/)
2. Check the [React Native documentation](https://reactnative.dev/docs/getting-started)
3. Review `PROJECT_SUMMARY.md` for project-specific details
4. Check existing GitHub issues or create a new one

---

## Project Structure

### Database Schema

The app uses Supabase (PostgreSQL) with the following main tables:

- **Authentication**: `auth.users` (Supabase Auth)
- **AI**: `ai_conversations`, `ai_messages`, `ai_memory_snapshots`
- **Workouts**: `workout_programs`, `workout_templates`, `workout_sessions`, `exercises`
- **Nutrition**: `foods`, `meals`, `meal_items`, `nutrition_daily_summary`
- **Profile**: `profiles`, `user_health_profile`, `body_weight_logs`
- **Habits**: `user_habits`, `habit_completions`
- **Community**: `community_posts`, `community_feed_items`, `community_follows`
- **Shop**: `shop_products`, `shop_variants`, `shop_cart_items`
- **Gamification**: `user_xp`, `user_streaks`

See `database-schema.md` for complete schema documentation.

### Navigation Flow

The app uses a custom state-based navigation system in `App.tsx`:

1. **Auth Flow**: Sign In → Sign Up → Onboarding
2. **Main App**: Bottom tab navigation
   - **Buy**: Shop and marketplace
   - **Today**: Workout tracker (main hub)
   - **Hira**: AI chat coach
   - **Connect**: Community feed
   - **Profile**: User profile and settings

### Data Fetching

The app uses **TanStack Query** for all server state:

```typescript
// Example: Fetching workout templates
import { useWorkoutTemplates } from './hooks/useWorkoutTemplates';

const { data, isLoading, error } = useWorkoutTemplates();
```

Key hooks:
- `useWorkoutTemplates()` - Fetch user's workout templates
- `useNutrition()` - Nutrition data and logging
- `useCommunityFeed()` - Community posts
- `useShopProducts()` - Shop products
- `useHabits()` - User habits

---

## Additional Resources

### Documentation

- **Project Summary**: `PROJECT_SUMMARY.md` - Comprehensive project overview
- **Design System**: `DESIGN-SYSTEM.md` - UI/UX guidelines and components
- **Database Schema**: `database-schema.md` - Complete database documentation

### External Links

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [React Navigation](https://reactnavigation.org/)

### Tech Stack

- **React Native**: 0.81.5
- **Expo**: ~54.0.33
- **React**: 19.1.0
- **TypeScript**: ~5.9.2
- **Supabase**: ^2.93.2
- **TanStack Query**: ^5.90.20
- **React Navigation**: ^7.1.28

---

## Quick Start Checklist

- [ ] Install Node.js (v18+)
- [ ] Install Android Studio + SDK
- [ ] Set `ANDROID_HOME` environment variable
- [ ] Clone the repository
- [ ] Run `npm install` in `apps/mobile`
- [ ] Copy `.env.example` to `.env` and configure
- [ ] Start Android emulator or connect device
- [ ] Run `npm run android`
- [ ] Wait for build to complete (first build takes 5-10 minutes)
- [ ] App should launch automatically

---

## Welcome to the Team! 🎉

You're now ready to start developing on Hira-AI! If you have any questions or run into issues, don't hesitate to reach out to the team.

Happy coding! 💪
