
import ProductsList from '@/components/Lists/ProductsList';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useTranslations } from '@/hooks/use-translation';
import Feather from '@expo/vector-icons/Feather';
import { Link } from 'expo-router';
import { StyleSheet, TouchableOpacity } from 'react-native';

export default function HomeScreen() {
  const { t } = useTranslations();
  return (
    <ThemedView style={styles.container}>
      <ProductsList />
      <ThemedView style={styles.buttonContainer}>
        <Link href="/(post)/create">
          <TouchableOpacity style={styles.createButton} activeOpacity={0.7}>
            <Feather name="plus" size={32} color="white" />
            <ThemedText style={styles.createButtonText}>{t('home.create')}</ThemedText>
          </TouchableOpacity>
        </Link>
      </ThemedView>
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
    width: 'auto',
    height: 60,
    backgroundColor: Colors.light.mainColor,
    borderRadius: 30,
    gap: 8,
    paddingHorizontal: 16,
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
