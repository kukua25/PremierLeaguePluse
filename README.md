# ⚽ Premier League Pulse

A React Native mobile app for Premier League news with TikTok-style swipeable cards.

## Features
- 📰 Real-time Premier League news from The Guardian Open Platform
- 🔐 Email authentication with verification
- 📱 Beautiful swipeable news cards
- 👤 User profiles with favorite team selection

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- A Firebase account
- A free Guardian Open Platform API key

### Installation

1. **Clone the repository**
```bash
   git clone https://github.com/yourusername/premier-league-pulse.git
   cd premier-league-pulse
```

2. **Install dependencies**
```bash
   npm install
```

3. **Set up Firebase**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project
   - Enable Email/Password authentication
   - Get your Firebase config

4. **Configure Firebase credentials**
```bash
   cp src/config/firebase.example.js src/config/firebase.js
```
   
   Then open `src/config/firebase.js` and add your Firebase credentials.

5. **Set up the Guardian API key**
   - Register for a free key at [open-platform.theguardian.com/access](https://open-platform.theguardian.com/access/)
```bash
   cp src/config/guardian.example.js src/config/guardian.js
```
   Then open `src/config/guardian.js` and add your key.

6. **Run the app**
```bash
   npx expo start
```

7. **Open on your device**
   - Scan the QR code with Expo Go app (Android/iOS)
   - Or press `i` for iOS simulator / `a` for Android emulator

## Tech Stack
- React Native
- Expo
- Firebase Authentication
- React Navigation
- The Guardian Open Platform API

## Project Structure
```
premier-league-pulse/
├── src/
│   ├── screens/
│   │   ├── NewsFeedScreen.js
│   │   ├── ProfileScreen.js
│   │   ├── SettingsScreen.js
│   │   └── LoginScreen.js
│   ├── context/
│   │   └── AuthContext.js
│   └── config/
│       ├── firebase.js (not tracked in git)
│       └── guardian.js (not tracked in git)
├── App.js
└── package.json
```

## Security Note
Never commit `src/config/firebase.js` or `src/config/guardian.js` to version control. They contain sensitive API keys.

## License
MIT