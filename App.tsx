import React from "react";
import { View, Text, TextInput } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider, useTheme } from "./src/theme/ThemeContext";
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';
import { AppNavigator } from "./src/navigation/AppNavigator";

// Globally disable OS-level font scaling for accessibility settings
interface TextWithDefaultProps extends React.FC<any> {
  defaultProps?: any;
}

(Text as unknown as TextWithDefaultProps).defaultProps = (Text as unknown as TextWithDefaultProps).defaultProps || {};
(Text as unknown as TextWithDefaultProps).defaultProps.maxFontSizeMultiplier = 1;

(TextInput as unknown as TextWithDefaultProps).defaultProps = (TextInput as unknown as TextWithDefaultProps).defaultProps || {};
(TextInput as unknown as TextWithDefaultProps).defaultProps.maxFontSizeMultiplier = 1;

export default function App() {
  return (
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
