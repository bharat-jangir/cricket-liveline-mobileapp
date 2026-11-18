import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider, useTheme } from "./src/theme/ThemeContext";
import { MAX_FONT_SCALE } from "./src/theme";
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';
import { AppNavigator } from "./src/navigation/AppNavigator";

// Release builds: no console noise (and no payload leakage into device logs)
if (!__DEV__) {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error('Unhandled UI error', error);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#f8fafc' }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 8 }}>Something went wrong</Text>
        <Text style={{ color: '#475569', textAlign: 'center', marginBottom: 20 }}>The app hit an unexpected error. Please try again.</Text>
        <TouchableOpacity onPress={() => this.setState({ failed: false })} style={{ backgroundColor: '#1877f2', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 }}>
          <Text style={{ color: 'white', fontWeight: '600' }}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

// Honour the OS font-size setting everywhere, capped at MAX_FONT_SCALE so layouts stay intact
interface TextWithDefaultProps extends React.FC<any> {
  defaultProps?: any;
}

(Text as unknown as TextWithDefaultProps).defaultProps = (Text as unknown as TextWithDefaultProps).defaultProps || {};
(Text as unknown as TextWithDefaultProps).defaultProps.maxFontSizeMultiplier = MAX_FONT_SCALE;

(TextInput as unknown as TextWithDefaultProps).defaultProps = (TextInput as unknown as TextWithDefaultProps).defaultProps || {};
(TextInput as unknown as TextWithDefaultProps).defaultProps.maxFontSizeMultiplier = MAX_FONT_SCALE;

export default function App() {
  return (
    <ErrorBoundary>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ThemeProvider>
            <SafeAreaProvider>
              <AppContent />
            </SafeAreaProvider>
          </ThemeProvider>
        </GestureHandlerRootView>
      </PersistGate>
    </Provider>
    </ErrorBoundary>
  );
}

const AppContent = () => {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  // Light mode: blue primary to match the header bar
  // Dark mode: dark background so the status bar blends with the dark UI
  const statusBarBg = isDark ? theme.background : theme.primary;

  return (
    <NavigationContainer>
      <StatusBar
        style={isDark ? "light" : "light"}
        translucent={true}
        backgroundColor={statusBarBg}
      />
      <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: statusBarBg }}>
        <View style={{ flex: 1, backgroundColor: isDark ? theme.background : theme.surface }}>
          <AppNavigator />
        </View>
      </View>
    </NavigationContainer>
  );
};
