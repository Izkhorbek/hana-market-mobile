import * as NavigationBar from 'expo-navigation-bar'
import { useEffect } from 'react'
import { useColorScheme } from 'react-native'

export function useThemeNavigationBar() {
  const colorScheme = useColorScheme() // yoki sizning custom theme hook'ingiz

  useEffect(() => {
    if (colorScheme === 'dark') {
      NavigationBar.setButtonStyleAsync('light') // oq ikonkalar (to'q fon)
    } else {
      NavigationBar.setButtonStyleAsync('dark')  // qora ikonkalar (och fon)
    }
  }, [colorScheme])
}
