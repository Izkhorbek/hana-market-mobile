/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native'

const tintColorLight = '#02A348'
const tintColorDark = '#fff'

export const Colors = {
	light: {
		text: '#11181C',
		secondaryColor: '#fff',
		subText: '#939496',

		background: '#fff',
		tabBarBg: '#fff',

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
		borderColor: '#F3F4F6',

		
	},
	dark: {
		text: '#ECEDEE',
		subText: '#939496',

		background: '#1D1D24',
		tabBarBg: '#1D1D24',

		// tab icons related colors
		tabIconBackground: '#343441',
		tabIconDefault: '#5D5D74',
		tabIconSelected: '#A4A4B6',

		// main colors
		primaryColor: '#02A348',
		secondaryColor: '#fff',

		// icons related colors
		icon: '#c0c2c7ff',
		blackIcon: '#ffffff',

		tint: '#fff',
		borderColor: '#49495B',

		status: {
			sold: '#FF4400',
			reserved: '#02A348',
		},
	},
}

export const Fonts = Platform.select({
	ios: {
		/** iOS `UIFontDescriptorSystemDesignDefault` */
		sans: 'system-ui',
		/** iOS `UIFontDescriptorSystemDesignSerif` */
		serif: 'ui-serif',
		/** iOS `UIFontDescriptorSystemDesignRounded` */
		rounded: 'ui-rounded',
		/** iOS `UIFontDescriptorSystemDesignMonospaced` */
		mono: 'ui-monospace',
	},
	default: {
		sans: 'normal',
		serif: 'serif',
		rounded: 'normal',
		mono: 'monospace',
	},
	web: {
		sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
		serif: "Georgia, 'Times New Roman', serif",
		rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
		mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
	},
})
