import { Stack } from 'expo-router';
import React from 'react';

export default function NeighborhoodLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="manage" />
    </Stack>
  );
}
