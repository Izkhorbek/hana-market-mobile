import { useColor } from '@/hooks/useColor';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

export type FilterTabType = 'all' | 'selling' | 'buying' | 'unread';

interface FilterTabsProps {
  activeTab: FilterTabType;
  onTabChange: (tab: FilterTabType) => void;
  tabs: Array<{ key: FilterTabType; label: string }>;
}

const FilterTabs = ({ activeTab, onTabChange, tabs }: FilterTabsProps) => {
  const primaryColor = useColor('primary');
  const textColor = useColor('text');
  const activeColor = useColor('border');
  const mutedColor = useColor('muted');

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
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
                {
                  color: isActive ? activeColor : textColor,
                  fontWeight: isActive ? '600' : '500',
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

export default FilterTabs;

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
});
