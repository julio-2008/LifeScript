import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SupabaseProvider } from './SupabaseProvider';
import { initializeBackgroundTasks } from './BackgroundTasks';

export default function Aplicativo({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize background tasks in the background (non-blocking)
    initializeBackgroundTasks().catch((error) => {
      console.error('Background tasks init error:', error);
    });
  }, []);

  return (
    <SupabaseProvider>
      <View style={styles.container}>
        {children}
      </View>
    </SupabaseProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

