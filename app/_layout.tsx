import { useColorScheme } from '@/hooks/use-color-scheme'
import { useModeToggle } from '@/hooks/useModeToggle'
import { useAuthStore } from '@/modules/Auth/auth-store'
import { ThemeProvider } from '@/theme/theme-provider'
import { Stack, useRootNavigationState } from 'expo-router'
import { Sun } from 'lucide-react-native'
import React from 'react'
import { ActivityIndicator, StatusBar, View } from 'react-native'
import 'react-native-reanimated'

export default function RootLayout() {
	const colorScheme = useColorScheme()
	const { toggleMode } = useModeToggle()
	const isHydrated = useAuthStore((s) => s.isHydrated)
	const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
	const rootNavigationState = useRootNavigationState()

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
		<ThemeProvider>
			<Stack screenOptions={{ headerShown: false }}>
				{isAuthenticated ? (
					<>
						<Stack.Screen name='(tabs)' />
						<Stack.Screen name='(post)' />
						<Stack.Screen name='(settings)' />
						<Stack.Screen name='search' />
						<Stack.Screen name='categories' />
						<Stack.Screen name='product/[id]' />
						<Stack.Screen name='chat/[id]' />
						<Stack.Screen name='(auth)' />
					</>
				) : (
					<>
						<Stack.Screen name='(auth)' />
						<Stack.Screen name='(tabs)' />
						<Stack.Screen name='(post)' />
						<Stack.Screen name='(settings)' />
						<Stack.Screen name='search' />
						<Stack.Screen name='categories' />
						<Stack.Screen name='product/[id]' />
						<Stack.Screen name='chat/[id]' />
					</>
				)}
				<Stack.Screen name='index' />
			</Stack>
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
	)
}
