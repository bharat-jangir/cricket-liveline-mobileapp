# Cricket Pulse Mobile App

A React Native mobile application built with Expo for cricket enthusiasts. Features live scores, match details, news, and rankings with a beautiful blue and white theme supporting both light and dark modes.

## Features

- 📱 **Cross-platform**: iOS and Android compatible
- 🎨 **Responsive Design**: Adaptive font scaling and layouts
- 🌙 **Dark Mode**: Automatic theme switching
- 🏏 **Live Scores**: Real-time cricket updates
- 📰 **News**: Latest cricket news and updates
- 📊 **Rankings**: Team and player rankings
- 🔧 **Modular Architecture**: Clean, maintainable code structure

## Tech Stack

- **React Native** with **Expo**
- **TypeScript** for type safety
- **React Navigation** for navigation
- **Responsive scaling** for different screen sizes
- **Theme system** with light/dark mode support

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── ui/             # Basic UI components (Button, Card, Text)
├── screens/            # Screen components
├── navigation/         # Navigation configuration
├── theme/              # Theme system and styling
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── services/           # API and data services
```

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Install Expo CLI** (if not already installed):
   ```bash
   npm install -g @expo/cli
   ```

## Running the App

1. **Start the development server**:
   ```bash
   npm start
   ```

2. **Run on specific platforms**:
   ```bash
   npm run android    # Android
   npm run ios        # iOS
   npm run web        # Web browser
   ```

3. **Using Expo Go**:
   - Install Expo Go app on your device
   - Scan the QR code from the terminal

## Theme System

The app uses a comprehensive theme system with:

- **Responsive scaling**: Adapts to different screen sizes
- **Color schemes**: Blue and white theme with dark mode
- **Typography**: Consistent font sizing and weights
- **Spacing**: Standardized spacing system
- **Components**: Theme-aware UI components

## Development

- **Hot Reload**: Changes reflect immediately during development
- **TypeScript**: Full type checking and IntelliSense
- **Modular**: Easy to extend and maintain
- **Responsive**: Works on all screen sizes

## Building for Production

```bash
# Build for Android
expo build:android

# Build for iOS
expo build:ios
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.