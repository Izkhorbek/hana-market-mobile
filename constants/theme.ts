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
		background: '#fff',
		tint: tintColorLight,
		icon: '#A9ABB0',
		tabIconDefault: '#687076',
		tabIconSelected: tintColorLight,
		mainColor: '#02A348',
		buttonTextColor: '#fff',
		subText: '#939496',
		taBarBg: '#fff',
		tabIconBackground: '#E6F7ED',
		borderColor: '#F3F4F6',
		blackIcon: '#000000',
	},
	dark: {
		text: '#ECEDEE',
		background: '#1e242dff',
		taBarBg: '#1e242dff',
		tint: tintColorDark,
		icon: '#c0c2c7ff',
		tabIconDefault: '#9BA1A6',
		tabIconSelected: tintColorDark,
		mainColor: '#02A348',
		buttonTextColor: '#fff',
		subText: '#939496',
		tabIconBackground: '#1e242dff',
		borderColor: '#2a3139ff',
		blackIcon: '#ffffff',
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
