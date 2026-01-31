import { useThemeColors } from '@/hooks/use-theme-colors';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Search } from 'lucide-react-native';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';


const HomeHeader = () => {
  const colors = useThemeColors()
  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.borderColor }]}>
      <ThemedText style={[styles.currentCity, { color: colors.blackIcon }]}>Toshkent</ThemedText>
      <ThemedView style={styles.searchContainer}>
        <TouchableOpacity>
          <Feather name='menu' size={25} color={colors.blackIcon} />
        </TouchableOpacity>
        <TouchableOpacity>
          <Search size={25} color={colors.blackIcon} />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name='notifications-outline' size={25} color={colors.blackIcon} />
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    height: Platform.OS === 'ios' ? 90 : 75,
    display: "flex",
    flexDirection: "row",
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  currentCity: {
    fontSize: 24,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
})

export default HomeHeader