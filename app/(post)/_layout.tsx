import { Stack } from 'expo-router'
import React from 'react'

const PostLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="create" options={{ headerShown: false }} />
    </Stack>
  )
}

export default PostLayout