import React from 'react'
import { ThemedView } from '../themed-view'

const FormRow = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemedView style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginVertical: 10, width: '100%'}}>
      {children}
    </ThemedView>
  )
}

export default FormRow