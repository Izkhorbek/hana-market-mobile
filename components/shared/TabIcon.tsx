import { Colors } from '@/constants/theme'
import { LucideIcon } from 'lucide-react-native'
import React from 'react'
import { StyleSheet } from 'react-native'
import { ThemedText } from '../themed-text'
import { ThemedView } from '../themed-view'


const TabIcon = ({ Icon, focused, title, color }: { Icon: LucideIcon, focused: boolean, title: string, color: string }) => {

  return (
    <ThemedView style={[styles.container, focused && { ...styles.focused, backgroundColor: Colors.light.tabIconBackground }]}>
      <Icon size={24} color={color} />
      <ThemedText style={[styles.text, focused && { ...styles.focusedText, color: color }]}>{title}</ThemedText>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center', 
    width: 64,
    height: 60,
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '400',
  },
  focused: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  focusedText: {
    color: Colors.light.icon,
    fontWeight: '600',
  }
})

export default TabIcon