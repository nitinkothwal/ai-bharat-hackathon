# Bharat CareLink - ASHA Mobile App

An AI-powered mobile application for ASHA (Accredited Social Health Activist) workers to identify and refer high-risk patients to Primary Health Centres (PHCs).

## 🚀 Overview

The ASHA Mobile App is built using **Expo** and **React Native**. It features a modern UI with Glassmorphism aesthetics and integrates AI-driven risk scoring to prioritize maternal and child health referrals.

### Key Features
- **Smart Patient Registration**: Quickly register patients with clinical details.
- **AI Triage**: Real-time risk assessment (LOW/MEDIUM/HIGH) for clinical conditions.
- **Offline-First**: Local storage and background syncing for rural connectivity.
- **Premium UI**: Modern, professional healthcare interface using React Native Paper.

---

## 🛠 Prerequisites

Before running the app, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo Go](https://expo.dev/go) app on your mobile device (to test on physical hardware)

---

## 📦 Installation

1. Navigate to the `asha` directory:
   ```bash
   cd asha
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

---

## 🏃‍♂️ Running the App

Start the development server:
```bash
npm run dev
```

### To view the app:
- **Mobile (Physical Device)**: Scan the QR code displayed in your terminal using the **Expo Go** app (Android) or the Camera app (iOS).
- **Android Emulator**: Press `a` in the terminal.
- **iOS Simulator**: Press `i` in the terminal (Requires macOS and Xcode).
- **Web**: Press `w` in the terminal.

---

## ⚙️ Environment Configuration

Create a `.env` file in the `asha` root directory to configure the API endpoint:

```env
EXPO_PUBLIC_API_URL=http://your-server-ip:3000/api/v1
```


---

## 🧪 Testing

### Automated Tests
This project uses **Jest** for unit testing.
```bash
npm test
```

### Manual Testing Flow
1. **Login**: Use the health worker credentials.
2. **Dashboard**: View the summary of registered patients.
3. **Register Patient**: Add a new patient via the "Add Patient" FAB.
4. **Create Referral**: Select a patient and clinical category (e.g., Pregnancy) and run the "Analyze Clinical Risk" tool.
5. **Offline Mode**: Disable internet, create a record, and verify it persists locally until connectivity is restored.

---

## 📂 Project Structure

- `app/`: Expo Router file-based navigation (Routes).
- `src/components/`: Reusable UI components (e.g., GlassCard).
- `src/services/`: API (axios) and Offline sync logic.
- `src/theme/`: Custom MD3 theme configuration.
- `src/types/`: TypeScript interfaces/types for data consistency.
- `assets/`: Images, fonts, and static resources.
