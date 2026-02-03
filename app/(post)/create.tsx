import CreateCarForm from '@/components/Forms/CreateCarForm'
import CreateThingForm from '@/components/Forms/CreateThingForm'
import CreateWorksForm from '@/components/Forms/CreateWorksForm'
import ThemedScrollView from '@/components/themed-scrollview'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { Briefcase, Car, Package } from 'lucide-react-native'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { StyleSheet, TouchableOpacity } from 'react-native'

type CategoryType = 'things' | 'cars' | 'works'

const CreatePost = () => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('things')
  const colors = useThemeColors()
  const form = useForm({
    defaultValues: {
      category: 'things',
    },
  })
  const { t } = useTranslations()

  const categories = [
    { id: 'things' as CategoryType, icon: Package, labelKey: 'post.things' },
    { id: 'cars' as CategoryType, icon: Car, labelKey: 'post.cars' },
    { id: 'works' as CategoryType, icon: Briefcase, labelKey: 'post.works' },
  ]

  const options = categories.map((category) => ({
    value: category.id,
    label: t(category.labelKey),
  }))

  // In your component
  const categoryOptions = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'furniture', label: 'Furniture' },
    // ... more categories
  ];
  const handleFormSubmit = (data: any) => {
    console.log('Form submitted:', data);
    // Handle form submission
  };

  return (
    <ThemedScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
                  borderColor: isSelected ? colors.tabIconBackground : colors.borderColor,
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

      {selectedCategory === 'cars' && <CreateCarForm />}
      {selectedCategory === 'things' && <CreateThingForm
        categoryOptions={categoryOptions}
      />}
      {selectedCategory === 'works' && <CreateWorksForm />}
    </ThemedScrollView>
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