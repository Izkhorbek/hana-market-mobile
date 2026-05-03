import ThemedScrollView from '@/components/themed-scrollview';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Logo } from '@/constants/images';
import { Colors } from '@/constants/theme';
import { useTranslations } from '@/hooks/use-translation';
import { Link, useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';

const WelcomePage = () => {
  const router = useRouter();
  const { t } = useTranslations();

  return (
    <ThemedScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      withSafeBottom
    >
      {/* Logo Section */}
      <ThemedView style={styles.logoSection}>
        <Image source={Logo} style={styles.logo} />
        {/* Text Section */}
        <ThemedView style={styles.textSection}>
          <ThemedText type="title" style={styles.title}>
            {t('auth.welcome_page.title')}
          </ThemedText>
          <ThemedText type="default" style={styles.subtitle}>
            {t('auth.welcome_page.description')}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Button Section */}
      <ThemedView style={styles.buttonSection}>
        <TouchableOpacity
          style={styles.getStartedButton}
          activeOpacity={0.8}
          onPress={() => router.push('/(auth)/auth')}
        >
          <ThemedText type="default" style={styles.getStartedText}>
            {t('auth.welcome_page.get_started')}
          </ThemedText>
        </TouchableOpacity>

        <ThemedView style={[styles.loginContainer, {}]}>
          <ThemedText type="default" style={styles.loginText}>
            {t('auth.welcome_page.already_have_account')}{' '}
          </ThemedText>
          <TouchableOpacity>
            <ThemedText type="default" style={styles.loginLink}>
              <Link
                href={'/(auth)/auth'}
                style={{ color: Colors.light.primaryColor }}
              >
                {t('auth.welcome_page.login_link')}
              </Link>
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </ThemedScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 0,
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginBottom: 32,
  },
  textSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#939496',
    lineHeight: 22,
  },
  buttonSection: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 40,
  },
  getStartedButton: {
    backgroundColor: Colors.light.primaryColor,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  getStartedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  loginText: {
    fontSize: 14,
    color: '#939496',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primaryColor,
  },
  logo: {
    width: 200,
    height: 200,
  },
});

export default WelcomePage;
