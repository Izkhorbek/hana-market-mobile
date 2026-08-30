import { useColor } from '@/hooks/useColor'
import { useResponsive } from '@/hooks/useResponsive'
import React, { useMemo } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native'

export type FilterTabType = 'all' | 'selling' | 'buying' | 'unread';

interface FilterTabsProps {
  activeTab: FilterTabType;
  onTabChange: (tab: FilterTabType) => void;
  tabs: { key: FilterTabType; label: string }[];
}

const FilterTabs = ({ activeTab, onTabChange, tabs }: FilterTabsProps) => {
  const primaryColor = useColor('primary')
  const textColor = useColor('text')
  const activeColor = useColor('border')
  const mutedColor = useColor('muted')
  const { ms, fs } = useResponsive()

  const responsiveStyles = useMemo(() => ({
    container: {
      paddingHorizontal: ms(16),
      paddingVertical: ms(12),
      gap: ms(8),
    },
    tab: {
      paddingVertical: ms(8),
      paddingHorizontal: ms(20),
      borderRadius: ms(20),
      marginRight: ms(8),
    },
    tabText: {
      fontSize: fs(14),
    },
  }), [ms, fs])

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, responsiveStyles.container]}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              responsiveStyles.tab,
              {
                backgroundColor: isActive ? primaryColor : mutedColor,
              },
            ]}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                responsiveStyles.tabText,
                {
                  color: isActive ? activeColor : textColor,
                  fontWeight: isActive ? '600' : '500',
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

export default FilterTabs

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
  },
})
