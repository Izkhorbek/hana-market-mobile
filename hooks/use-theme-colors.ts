import { Colors } from '@/theme/colors'
import { useColorScheme } from '@/hooks/use-color-scheme'

export const useThemeColors = () => {
	const colorScheme = useColorScheme()
	const color = colorScheme === 'dark' ? Colors.dark : Colors.light
	return color
}
