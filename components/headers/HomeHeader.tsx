import { Colors } from '@/constants/theme';
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Search } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';


const HomeHeader = () => {
  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.currentCity}>Toshkent</ThemedText>
      <ThemedView style={styles.searchContainer}>
        <TouchableOpacity>
          <Feather name='menu' size={25} color={Colors.light.blackIcon} />
        </TouchableOpacity>
        <TouchableOpacity>
          <Search size={25} color={Colors.light.blackIcon} />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name='notifications-outline' size={25} color={Colors.light.blackIcon} />
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 90,
    display: "flex",
    flexDirection: "row",
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 5,
    paddingHorizontal: 14,
    // borderBottomWidth: 1,
    // borderBottomColor: Colors.light.borderColor,
    backgroundColor: Colors.light.background,
  },
  currentCity: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.light.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    backgroundColor: Colors.light.background, 
  },
})

export default HomeHeader