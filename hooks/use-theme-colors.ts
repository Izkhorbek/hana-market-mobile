import { Colors } from '@/theme/colors'
import { useColorScheme } from 'react-native'

export const useThemeColors = () => {
	const colorScheme = useColorScheme()
	const color = colorScheme === 'dark' ? Colors.dark : Colors.light
	return color
}
