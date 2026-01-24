import ThemedScrollView from '@/components/themed-scrollview'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { useTranslations } from '@/hooks/use-translation'
import React from 'react'
import { StyleSheet } from 'react-native'

const AuthPage = () => {
  const { t, changeLng } = useTranslations()
  return (
    <ThemedScrollView style={styles.container}>
      <ThemedView>
        <ThemedText type='title'>{t('common.welcome')}</ThemedText>
        <ThemedText type='title' onPress={() => changeLng('uz')} style={{ color: 'red' }}>uz</ThemedText>
        <ThemedText type='title' onPress={() => changeLng('ru')} style={{ color: 'green' }}>ru</ThemedText>
        <ThemedText type='title' onPress={() => changeLng('en')} style={{ color: 'blue' }}>en</ThemedText>
      </ThemedView>
      <ThemedView style={styles.content}>
        <ThemedText type='title'>auth</ThemedText>
      </ThemedView>
    </ThemedScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 32,
    backgroundColor: '#0a7ea4',
    gap: 16,
    overflow: 'hidden',
  },
  header: {
    height: 100,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: 32,
    gap: 16,
    overflow: 'hidden',
  },
});

export default AuthPage 