
import ThemedScrollView from '@/components/themed-scrollview';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTranslations } from '@/hooks/use-translation';
import { StyleSheet } from 'react-native';

export default function HomeScreen() {
  const { t } = useTranslations();

  return (
    <ThemedScrollView style={styles.container}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">{t('common.welcome')}</ThemedText>
      </ThemedView>
    </ThemedScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
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
});
