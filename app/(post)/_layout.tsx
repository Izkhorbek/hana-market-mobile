import CreateHeader from '@/components/headers/CreateHeader';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import React from 'react';
import { StatusBar } from 'react-native';

const PostLayout = () => {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="create" options={{ headerShown: true, header: () => <CreateHeader /> }} />
        <Stack.Screen name="edit" options={{ headerShown: false }} />
      </Stack>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
    </ThemeProvider>
  )
}

export default PostLayout