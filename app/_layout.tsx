import { useColorScheme } from '@/hooks/use-color-scheme';
import { useModeToggle } from '@/hooks/useModeToggle';
import { ThemeProvider } from '@/theme/theme-provider';
import { Stack } from 'expo-router';
import { Sun } from 'lucide-react-native';
import React from 'react';
import { StatusBar, View } from 'react-native';
import 'react-native-reanimated';
import YaMap from 'react-native-yamap';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { toggleMode } = useModeToggle()

  React.useEffect(() => {
    try {
      YaMap.init('24ebf5ac-ba8e-47a7-b146-603f38894d2d');
    } catch (e) {
      console.warn('YaMap init failed. Typically this means you are running via Expo Go or need to rebuild the dev client.', e);
    }
  }, []);

  return (
    <ThemeProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(post)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={{
        position: 'absolute', padding: 5, bottom: '50%', right: 0, transform: [{ translateX: 0 }, { translateY: '-50%' }],
      }}>
        <Sun onPress={toggleMode} size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
      </View>
    </ThemeProvider>
  );
}
