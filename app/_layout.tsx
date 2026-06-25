import { queryClient } from '@/api/queryClient'
import { useThemeNavigationBar } from '@/components/AnroidNavbarButtonsColorChange'
import { AuthGuard } from '@/components/providers/AuthGuard'
import { ChatBootstrap } from '@/components/providers/ChatBootstrap'
import { GlobalErrorBoundary } from '@/components/providers/GlobalErrorBoundary'
import { NetworkProvider } from '@/components/providers/NetworkProvider'
import { NotificationBootstrap } from '@/components/providers/NotificationBootstrap'
import '@/constants/localization'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { ThemeProvider } from '@/theme/theme-provider'
import { installGlobalErrorHandlers } from '@/utils/globalErrorHandlers'
import { initSentry, sentryWrap } from '@/utils/sentry'
import { QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import React from 'react'
import { Platform, StatusBar } from 'react-native'
import 'react-native-reanimated'
import { Edges,  SafeAreaProvider, SafeAreaView, initialWindowMetrics } from 'react-native-safe-area-context'

// Initialize Sentry FIRST so it can capture even errors thrown by our other
// init steps below. No-op if no DSN is configured.
initSentry()

// Install global JS error / unhandled rejection reporters as early as possible.
installGlobalErrorHandlers()

function RootLayout() {
	const colorScheme = useColorScheme()
	const colors = useThemeColors()
	
	useThemeNavigationBar()

	const edgesList: Edges = Platform.OS === 'ios' ? ['top', 'bottom', 'left', 'right'] : ['top', 'bottom', 'left', 'right'] 
	

	// ✅ Root layout only renders structure - no auth logic
	return (
		<GlobalErrorBoundary>
			<QueryClientProvider client={queryClient}>
				<SafeAreaProvider initialMetrics={initialWindowMetrics}>
					<ThemeProvider>
						<NetworkProvider>
							<SafeAreaView style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? colors.background : colors.background }} edges={edgesList}>
								<AuthGuard />
								<ChatBootstrap />
							<NotificationBootstrap />
								<Stack screenOptions={{ headerShown: false }}>
									<Stack.Screen name='index' />
									<Stack.Screen name='(tabs)' />
									<Stack.Screen name='(post)' />
									<Stack.Screen name='(settings)' />
									<Stack.Screen name='(auth)' />
									<Stack.Screen name='search' />
									<Stack.Screen name='categories' />
									<Stack.Screen name='product/[id]' />
									<Stack.Screen name='product/location' />
									<Stack.Screen name='chat/[id]' />
								</Stack>
							</SafeAreaView>
						</NetworkProvider>
						<StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
					</ThemeProvider>
				</SafeAreaProvider>
			</QueryClientProvider>
		</GlobalErrorBoundary>
	)
}
// Wrap the root with Sentry's HOC so it can intercept render errors at the
// top of the tree and attach navigation breadcrumbs. No-op when Sentry is
// disabled (no DSN configured).
export default sentryWrap(RootLayout)