import { HEADER_HEIGHT } from '@/constants/appLimits'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { StyleSheet } from 'react-native'
import { ThemedText } from '../themed-text'
import { ThemedView } from '../themed-view'

const ProfilePageHeader = () => {
  const { t } = useTranslations()
  const colors = useThemeColors()

  return (
    <ThemedView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderBottomColor: colors.borderColor,
        },
      ]}
    >
      <ThemedText style={[styles.title, { color: colors.primaryColor }]}>
        {t('profile.title')}
      </ThemedText>
    </ThemedView>
  )
}

export default ProfilePageHeader

const styles = StyleSheet.create({
  container: {
    height: HEADER_HEIGHT,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
})
