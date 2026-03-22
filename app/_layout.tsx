import { queryClient } from '@/api/queryClient'
import { useThemeNavigationBar } from '@/components/AnroidNavbarButtonsColorChange'
import { NetworkProvider } from '@/components/providers/NetworkProvider'
import '@/constants/localization'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { useModeToggle } from '@/hooks/useModeToggle'
import { useAuthStore } from '@/modules/Auth/auth-store'
import { ThemeProvider } from '@/theme/theme-provider'
import { QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { Sun } from 'lucide-react-native'
import React from 'react'
import { ActivityIndicator, StatusBar, View } from 'react-native'
import 'react-native-reanimated'

export default function RootLayout() {
	const colorScheme = useColorScheme()
	const { toggleMode } = useModeToggle()
	const isHydrated = useAuthStore((s) => s.isHydrated)
	useThemeNavigationBar()
	// Wait for Zustand to rehydrate from AsyncStorage
	if (!isHydrated) {
		return (
			<ThemeProvider>
				<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
					<ActivityIndicator size="large" />
				</View>
			</ThemeProvider>
		)
	}



	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider>
				<NetworkProvider>
					<Stack screenOptions={{ headerShown: false }}>
						<Stack.Screen name='index' />
						<Stack.Screen name='(tabs)' />
						<Stack.Screen name='(post)' />
						<Stack.Screen name='(settings)' />
						<Stack.Screen name='(auth)' />
						<Stack.Screen name='search' />
						<Stack.Screen name='categories' />
						<Stack.Screen name='product/[id]' />
						<Stack.Screen name='chat/[id]' />
					</Stack>
				</NetworkProvider>
				<StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
				<View
					style={{
						position: 'absolute',
						padding: 5,
						bottom: '50%',
						right: 0,
						transform: [{ translateX: 0 }, { translateY: '-50%' }],
					}}
				>
					<Sun onPress={toggleMode} size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
				</View>
			</ThemeProvider>
		</QueryClientProvider>
	)
}
