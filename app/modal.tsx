import LanguageSwitcher from '@/components/language-switcher';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTranslations } from '@/hooks/use-translation';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

export default function ModalScreen() {
  const { t } = useTranslations();

  return (
    <ScrollView style={styles.scrollView}>
      <ThemedView style={styles.container}>
        <ThemedText type="title">{t('modal.title')}</ThemedText>
        <ThemedText style={styles.description}>
          {t('modal.description')}
        </ThemedText>

        <LanguageSwitcher />

        <Link href="/" dismissTo style={styles.link}>
          <ThemedText type="link">Go to home screen</ThemedText>
        </Link>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  description: {
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
  },
  link: {
    marginTop: 24,
    paddingVertical: 15,
  },
});
