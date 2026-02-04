const lightColors = {
	// Base colors
	foreground: '#000000',

	// Card colors
	card: '#F2F2F7',
	cardForeground: '#000000',

	profileCard: '#ffffffff',

	// Popover colors
	popover: '#F2F2F7',
	popoverForeground: '#000000',

	// Primary colors
	primary: '#18181b',
	primaryForeground: '#FFFFFF',

	// Secondary colors
	secondary: '#F2F2F7',
	secondaryForeground: '#18181b',

	// Muted colors
	muted: '#78788033',
	mutedForeground: '#71717a',

	// Accent colors
	accent: '#F2F2F7',
	accentForeground: '#18181b',

	// Destructive colors
	destructive: '#ef4444',
	destructiveForeground: '#FFFFFF',

	// Border and input
	border: '#C6C6C8',
	input: '#e4e4e7',
	ring: '#a1a1aa',

	// Text colors
	textMuted: '#71717a',

	// Legacy support for existing components

	// Default buttons, links, Send button, selected tabs
	blue: '#007AFF',

	// Success states, FaceTime buttons, completed tasks
	green: '#34C759',

	// Delete buttons, error states, critical alerts
	red: '#FF3B30',

	// VoiceOver highlights, warning states
	orange: '#FF9500',

	// Notes app accent, Reminders highlights
	yellow: '#FFCC00',

	// Pink accent color for various UI elements
	pink: '#FF2D92',

	// Purple accent for creative apps and features
	purple: '#AF52DE',

	// Teal accent for communication features
	teal: '#5AC8FA',

	// Indigo accent for system features
	indigo: '#5856D6',

	// mine colors
	text: '#11181C',
	secondaryColor: '#fff',
	subText: '#939496',

	background: '#fff',
	profileBackground:"#f7f9fa",
	taBarBg: '#fff',

	// tab icons related colors
	tabIconBackground: '#E6F7ED',
	tabIconDefault: '#687076',
	tabIconSelected: '#02A348',

	// main colors
	primaryColor: '#02A348',

	// icons related colors
	icon: '#A9ABB0',
	blackIcon: '#000000',

	tint: '#02A348',
	borderColor: '#eeeeeeff',
}

const darkColors = {
	// Base colors
	foreground: '#FFFFFF',

	// Card colors
	card: '#1C1C1E',
	cardForeground: '#FFFFFF',

	profileCard: '#33333dff',

	// Popover colors
	popover: '#18181b',
	popoverForeground: '#FFFFFF',

	// Primary colors
	primary: '#e4e4e7',
	primaryForeground: '#18181b',

	// Secondary colors
	secondary: '#1C1C1E',
	secondaryForeground: '#FFFFFF',

	// Muted colors
	muted: '#78788033',
	mutedForeground: '#a1a1aa',

	// Accent colors
	accent: '#1C1C1E',
	accentForeground: '#FFFFFF',

	// Destructive colors
	destructive: '#dc2626',
	destructiveForeground: '#FFFFFF',

	// Border and input - using alpha values for better blending
	border: '#38383A',
	input: 'rgba(255, 255, 255, 0.15)',
	ring: '#71717a',

	// Text colors
	textMuted: '#a1a1aa',

	// Default buttons, links, Send button, selected tabs
	blue: '#0A84FF',

	// Success states, FaceTime buttons, completed tasks
	green: '#30D158',

	// Delete buttons, error states, critical alerts
	red: '#FF453A',

	// VoiceOver highlights, warning states
	orange: '#FF9F0A',

	// Notes app accent, Reminders highlights
	yellow: '#FFD60A',

	// Pink accent color for various UI elements
	pink: '#FF375F',

	// Purple accent for creative apps and features
	purple: '#BF5AF2',

	// Teal accent for communication features
	teal: '#64D2FF',

	// Indigo accent for system features
	indigo: '#5E5CE6',

	text: '#ECEDEE',
	subText: '#939496',

	background: '#1D1D24',
	profileBackground:"#1D1D24",
	taBarBg: '#1D1D24',

	// tab icons related colors
	tabIconBackground: '#343441',
	tabIconDefault: '#5D5D74',
	tabIconSelected: '#A4A4B6',

	// main colors
	primaryColor: '#02A348',
	secondaryColor: '#fff',

	// icons related colors
	icon: '#99A1AF',
	blackIcon: '#ffffff',

	tint: '#fff',
	borderColor: '#49495B',
}

export const Colors = {
	light: lightColors,
	dark: darkColors,
}

// Export individual color schemes for easier access
export { darkColors, lightColors }

// Utility type for color keys
export type ColorKeys = keyof typeof lightColors
