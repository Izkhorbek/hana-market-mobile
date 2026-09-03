import { Colors } from '@/theme/colors'
import { useColorScheme } from 'react-native'

export function useColor(
	colorName: keyof typeof Colors.light & keyof typeof Colors.dark,
	props?: { light?: string; dark?: string },
) {
	// RN 0.86 widened the scheme with 'unspecified'; the palettes only have
	// light and dark, so anything that is not dark reads as light.
	const theme = useColorScheme() === 'dark' ? 'dark' : 'light'
	const colorFromProps = props?.[theme]

	if (colorFromProps) {
		return colorFromProps
	} else {
		return Colors[theme][colorName]
	}
}
