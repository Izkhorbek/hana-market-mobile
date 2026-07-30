import CreateServiceForm from '@/components/Forms/CreateServiceForm'
import KeyboardAvoidWrapper from '@/components/shared/KeyboardAvoidWrapper'
import ThemedScrollView from '@/components/themed-scrollview'
import React from 'react'
import { StyleSheet } from 'react-native'

const CreateService = () => {
  return (
    <KeyboardAvoidWrapper style={styles.keyboardContainer}>
      <ThemedScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <CreateServiceForm />
      </ThemedScrollView>
    </KeyboardAvoidWrapper>
  )
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
})

export default CreateService
