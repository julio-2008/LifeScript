// Bottom tabs layout for the main app.
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { StyleSheet, View, Text, SafeAreaView } from 'react-native';
import { colors } from '../../src/theme';
import { LogoMinimal } from '../../src/components/LogoBrand';

export default function TabsLayout() {
  return (
    <>
      <SafeAreaView style={{ backgroundColor: '#0A0A1A', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 }}>
          <LogoMinimal size={24} variant="light" />
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, letterSpacing: 0.5 }}>LifeScript</Text>
        </View>
      </SafeAreaView>
      <Tabs
        screenOptions={{
          headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDim,
        tabBarStyle: {
          position: 'absolute',
          left: 16, right: 16, bottom: 22,
          borderRadius: 36,
          backgroundColor: 'rgba(18,18,38,0.85)',
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
          height: 62,
          paddingTop: 8,
          shadowColor: colors.primary,
          shadowOpacity: 0.3,
          shadowOffset: { width: 0, height: 8 },
          shadowRadius: 20,
          elevation: 12,
        },
        tabBarBackground: () => (
          <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFill, { borderRadius: 36, overflow: 'hidden' }]} />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'planet' : 'planet-outline'} color={color} testID="tab-home" />
          ),
        }}
      />
      <Tabs.Screen
        name="badges"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'trophy' : 'trophy-outline'} color={color} testID="tab-badges" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'person-circle' : 'person-circle-outline'} color={color} testID="tab-profile" />
          ),
        }}
      />
      </Tabs>
    </>
  );
}
function TabIcon({ name, color, testID }: { name: any; color: string; testID: string }) {
  return (
    <View testID={testID} style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={name} size={26} color={color} />
    </View>
  );
}
