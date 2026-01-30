
import ProductsList from '@/components/Lists/ProductsList';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useThemeColors } from '@/hooks/use-theme-colors';
import Feather from '@expo/vector-icons/Feather';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';

export default function HomeScreen() {
  const colors = useThemeColors()
  const colorScheme = useColorScheme();
  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <ProductsList />
      <ThemedView style={styles.buttonContainer}>
        <Link href="/(post)/create" asChild>
          <TouchableOpacity style={styles.createButton} activeOpacity={0.7}>
            <Feather name="plus" size={32} color="white" />
          </TouchableOpacity>
        </Link>
      </ThemedView>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    position: 'relative',
    backgroundColor: Colors.light.background,
    overflowY: 'scroll',
  },
  titleContainer: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  createButton: {
    width: 60,
    height: 60,
    backgroundColor: Colors.light.primaryColor,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '500',
  },
});
