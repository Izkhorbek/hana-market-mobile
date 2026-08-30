import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Text } from '@/components/ui/text'
import { View } from '@/components/ui/view'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { Check } from 'lucide-react-native'
import React from 'react'
import { StyleSheet, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface LanguageSelectorProps {
  isVisible: boolean;
  onClose: () => void;
}

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

const languages: LanguageOption[] = [
  { code: 'uz', name: 'Uzbek', nativeName: 'O\'zbekcha' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
]

export function LanguageSelector({ isVisible, onClose }: LanguageSelectorProps) {
  const colors = useThemeColors()
  const { locale, changeLng, t } = useTranslations()
  const insets = useSafeAreaInsets()
  const handleLanguageSelect = (languageCode: string) => {
    changeLng(languageCode)
    onClose()
  }

  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={onClose}
      snapPoints={[0.4]}
      style={{ backgroundColor: colors.background }}
      enableBackdropDismiss={true}
    // title={t('profile.select_language')}
    >
      <View style={[styles.container]}>
        {languages.map((language) => {
          const isSelected = locale === language.code

          return (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageItem,
                {
                  backgroundColor: 'transparent',
                  borderColor: isSelected ? colors.primaryColor : colors.muted,
                },
              ]}
              onPress={() => handleLanguageSelect(language.code)}
              activeOpacity={0.7}
            >
              <View style={styles.languageInfo}>
                <Text variant="body" style={[styles.languageName, { color: colors.text }]}>
                  {language.name}
                </Text>
                <Text variant="caption" style={[styles.nativeName, { color: colors.muted }]}>
                  {language.nativeName}
                </Text>
              </View>

              {isSelected && (
                <Check size={20} color={colors.primaryColor} strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          )
        })}
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  nativeName: {
    fontSize: 13,
  },
})
