import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import React, { useState } from 'react'
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface FilterItem {
  key: string
  labelKey: string
}

const FILTERS: FilterItem[] = [
  { key: 'all', labelKey: 'home.filters.all' },
  { key: 'cars', labelKey: 'home.filters.cars' },
  { key: 'real_estate', labelKey: 'home.filters.real_estate' },
  { key: 'jobs', labelKey: 'home.filters.jobs' },
  { key: 'electronics', labelKey: 'home.filters.electronics' },
  { key: 'furniture', labelKey: 'home.filters.furniture' },
]

interface FilterButtonsProps {
  selectedFilter?: string
  onFilterChange?: (filterKey: string) => void
}

const FilterButtons: React.FC<FilterButtonsProps> = ({
  selectedFilter: controlledFilter,
  onFilterChange,
}) => {
  const colors = useThemeColors()
  const { t } = useTranslations()
  const [internalFilter, setInternalFilter] = useState('all')

  const activeFilter = controlledFilter ?? internalFilter

  const handlePress = (key: string) => {
    if (onFilterChange) {
      onFilterChange(key)
    } else {
      setInternalFilter(key)
    }
  }

  const renderItem = ({ item }: { item: FilterItem }) => {
    const isActive = activeFilter === item.key

    return (
      <TouchableOpacity
        style={[
          styles.chip,
          {
            backgroundColor: isActive ? colors.primaryColor : colors.borderColor,
          },
        ]}
        onPress={() => handlePress(item.key)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.chipText,
            {
              color: isActive ? '#fff' : colors.text,
              fontWeight: isActive ? '600' : '400',
            },
          ]}
        >
          {t(item.labelKey)}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={FILTERS}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    height: 48,
    flexGrow: 0,
    flexShrink: 0,
    marginVertical: 5,
  },
  listContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  chipText: {
    fontSize: 14,
  },
})

export default FilterButtons
