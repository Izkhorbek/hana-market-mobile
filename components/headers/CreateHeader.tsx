import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useRouter } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import React from 'react'
import { Platform, StyleSheet, TouchableOpacity } from 'react-native'
import { ThemedText } from '../themed-text'
import { ThemedView } from '../themed-view'
import { HEADER_HEIGHT } from '@/constants/appLimits'

const CreateHeader = () => {
  const colors = useThemeColors()
  const { t } = useTranslations()
  const router = useRouter()

  const handleBack = () => {
    router.back()
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.borderColor }]}>
      <TouchableOpacity 
        style={[styles.backButton, { borderColor: colors.borderColor }]} 
        onPress={handleBack}
      >
        <ArrowLeft size={20} color={colors.blackIcon} />
      </TouchableOpacity>
      <ThemedText style={[styles.title, { color: colors.text }]}>
        {t('post.create_ad')}
      </ThemedText>
      <ThemedView style={styles.placeholder} />
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    height: HEADER_HEIGHT,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 5,
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    // borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '600',
    marginBottom: 8,
  },
  placeholder: {
    width: 40,
  },
})

export default CreateHeader