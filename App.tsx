import React from "react";
import { View, Text, TextInput } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider } from "./src/theme/ThemeContext";
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" translucent={true} backgroundColor="#1877f2" />

      <ThemeProvider>
        <SafeAreaProvider>
          <AppContent />
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const AppContent = () => {
  const insets = useSafeAreaInsets();

  return (
    <NavigationContainer>
      <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: "#1877f2" }}>
        <View style={{ flex: 1, backgroundColor: 'white' }}>
          <AppNavigator />
        </View>
      </View>
    </NavigationContainer>
  );
};
