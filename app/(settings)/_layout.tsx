import { Stack } from 'expo-router'
import React from 'react'

export default function SettingsLayout() {
	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name='manage' options={{ headerShown: false }} />
			<Stack.Screen name='edit-profile' options={{ headerShown: false }} />
			<Stack.Screen name='my-listings' options={{ headerShown: false }} />
			<Stack.Screen name='favorites' options={{ headerShown: false }} />
			<Stack.Screen name='my-complaint' options={{ headerShown: false }} />
			<Stack.Screen name='blocked-users' options={{ headerShown: false }} />
			<Stack.Screen name='my-mahalla' options={{ headerShown: false }} />
			<Stack.Screen name='my-profile' options={{ headerShown: false }} />
			<Stack.Screen name='verification' options={{ headerShown: false }} />
			<Stack.Screen name='settings' options={{ headerShown: false }} />
			<Stack.Screen name='contact' options={{ headerShown: false }} />
			<Stack.Screen name='whats-new' options={{ headerShown: false }} />
			<Stack.Screen name='feedback' options={{ headerShown: false }} />
			<Stack.Screen name='about' options={{ headerShown: false }} />
			<Stack.Screen name='terms' options={{ headerShown: false }} />
		</Stack>
	)
}
