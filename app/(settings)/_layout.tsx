import { Stack } from 'expo-router'
import React from 'react'

export default function SettingsLayout() {
	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name='manage' options={{ headerShown: false }} />
			<Stack.Screen name='edit-profile' options={{ headerShown: false }} />
		</Stack>
	)
}
