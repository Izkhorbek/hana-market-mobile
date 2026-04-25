import CreateCarForm from '@/components/Forms/CreateCarForm'
import CreateThingForm from '@/components/Forms/CreateThingForm'
import CreateWorksForm from '@/components/Forms/CreateWorksForm'
import ThemedScrollView from '@/components/themed-scrollview'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useLocalSearchParams } from 'expo-router'
import { Briefcase, Car, Package } from 'lucide-react-native'
import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type CategoryType = 'things' | 'cars' | 'works'

const VALID_TYPES: CategoryType[] = ['things', 'cars', 'works']

const CreatePost = () => {
  const { type } = useLocalSearchParams<{ type?: string }>()
  const initialType: CategoryType =
    type && VALID_TYPES.includes(type as CategoryType) ? (type as CategoryType) : 'things'
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>(initialType)
  const colors = useThemeColors()
  const { t } = useTranslations()
  const insets = useSafeAreaInsets()

  const categories = [
    { id: 'things' as CategoryType, icon: Package, labelKey: 'post.things' },
    { id: 'cars' as CategoryType, icon: Car, labelKey: 'post.cars' },
    { id: 'works' as CategoryType, icon: Briefcase, labelKey: 'post.works' },
  ]

  return (
    <KeyboardAvoidingView
      style={[{ flex: 1, paddingBottom: insets.bottom + 10 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ThemedScrollView style={styles.container}>
        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
          {t('post.select_type')}
        </ThemedText>

        <ThemedView style={styles.categoriesContainer}>
          {categories.map((category) => {
            const isSelected = selectedCategory === category.id
            const IconComponent = category.icon

            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: isSelected ? colors.tabIconBackground : colors.background,
                    borderColor: isSelected ? colors.tabIconSelected : colors.borderColor,
                  },
                ]}
                onPress={() => setSelectedCategory(category.id)}
                activeOpacity={0.7}
              >
                <IconComponent
                  size={40}
                  color={isSelected ? colors.tabIconSelected : colors.icon}
                  strokeWidth={1.5}
                />
                <ThemedText
                  style={[
                    styles.categoryLabel,
                    { color: isSelected ? colors.tabIconSelected : colors.text }
                  ]}
                >
                  {t(category.labelKey)}
                </ThemedText>
              </TouchableOpacity>
            )
          })}
        </ThemedView>

        {selectedCategory === 'things' && <CreateThingForm />}
        {selectedCategory === 'cars' && <CreateCarForm />}
        {selectedCategory === 'works' && <CreateWorksForm />}
      </ThemedScrollView>
    </KeyboardAvoidingView >
  )

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  categoryCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
})

export default CreatePost