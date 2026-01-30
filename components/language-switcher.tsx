
import { languageResources } from '@/constants/localization';
import { useTranslations } from '@/hooks/use-translation';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const languages: Record<string, string> = {
  en: '🇺🇸 English',
  ru: '🇷🇺 Русский',
  uz: '🇺🇿 O\'zbekcha',
};

export default function LanguageSwitcher() {
  const { locale, changeLng } = useTranslations();

  return (
    <View style={styles.container}> 
      <View style={styles.languageList}>
        {Object.keys(languageResources).map((lang: string) => (
          <TouchableOpacity
            key={lang}
            style={[
              styles.languageButton,
              locale === lang && styles.languageButtonActive,
            ]}
            onPress={() => changeLng(lang)}
          >
            <Text
              style={[
                styles.languageText,
                locale === lang && styles.languageTextActive,
              ]}
            >
              {languages[lang]}
            </Text>
            {locale === lang && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  languageList: {
    gap: 8,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageButtonActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
  },
  languageText: {
    fontSize: 16,
    color: '#666',
  },
  languageTextActive: {
    color: '#2196F3',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 20,
    color: '#2196F3',
    fontWeight: 'bold',
  },
});
