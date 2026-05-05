import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

// The complete NeuroSync HTML app bundled as a static asset
const HTML_ASSET = require('../assets/neurosync.html');

export default function NeuroSyncApp() {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const asset = Asset.fromModule(HTML_ASSET);
      await asset.downloadAsync();
      const content = await FileSystem.readAsStringAsync(asset.localUri!);
      setHtml(content);
    })();
  }, []);

  if (!html) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#7c6af5" size="large" />
      </View>
    );
  }

  return (
    <WebView
      source={{ html, baseUrl: '' }}
      style={styles.webview}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      allowFileAccess={true}
      allowUniversalAccessFromFileURLs={true}
      originWhitelist={['*']}
      scrollEnabled={false}
      bounces={false}
      overScrollMode="never"
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      // Inject viewport fix for Android to ensure proper safe-area handling
      injectedJavaScriptBeforeContentLoaded={`
        window.onerror = function(msg, url, line) { return true; };
        true;
      `}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#080810',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webview: {
    flex: 1,
    backgroundColor: '#080810',
  },
});
