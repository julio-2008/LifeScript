// LifeScript root layout.
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Aplicativo from '../src/Aplicativo';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0A0A1A' }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Aplicativo>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#0A0A1A' },
              animation: 'fade',
            }}
          />
        </Aplicativo>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
