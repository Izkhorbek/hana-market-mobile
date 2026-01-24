import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useChangeTheme } from '@/hooks/user-change-theme';
import { StyleSheet, TouchableOpacity } from 'react-native';


export default function ThemeToggleExample() {
  const { setTheme, toggleTheme } = useChangeTheme();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Theme Settings
      </ThemedText>

      <TouchableOpacity
        style={styles.button}
        onPress={toggleTheme}
        activeOpacity={0.7}
      >
        <ThemedText type="defaultSemiBold">Toggle Theme</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => setTheme('light')}
        activeOpacity={0.7}
      >
        <ThemedText type="defaultSemiBold">Light Theme</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => setTheme('dark')}
        activeOpacity={0.7}
      >
        <ThemedText type="defaultSemiBold">Dark Theme</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => setTheme('system')}
        activeOpacity={0.7}
      >
        <ThemedText type="defaultSemiBold">System Theme</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#0a7ea4',
    alignItems: 'center',
  },
});
