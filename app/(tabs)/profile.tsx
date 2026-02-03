import ProfilePageHeader from '@/components/headers/ProfilePageHeader';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTranslations } from '@/hooks/use-translation';
import { useColor } from '@/hooks/useColor';
import ProfileHeader from '@/modules/Profile/ProfileHeader';
import ProfileMenuItem from '@/modules/Profile/ProfileMenuItem';
import ProfileSection from '@/modules/Profile/ProfileSection';
import {
  Bell,
  FileText,
  Heart,
  HelpCircle,
  Home,
  MapPin,
  MessageCircle,
  MessageSquare,
  Package,
  Settings,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const ProfilePage = () => {
  const { t } = useTranslations();
  const colors = useThemeColors()
  const backgroundColor = useColor('background');
  const mutedTextColor = useColor('textMuted');

  const handleNavigation = (route: string) => {
    console.log('Navigate to:', route);
    // TODO: Add navigation logic
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ProfilePageHeader />

      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.profileBackground }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <ProfileHeader
          name="John Doe"
          status={t('profile.active')}
          temperature="36.3°C"
          onPress={() => handleNavigation('profile-details')}
        />

        {/* My Activity Section */}
        <ProfileSection title={t('profile.my_activity')}>
          <ProfileMenuItem
            icon={Package}
            title={t('profile.listings')}
            subtitle={t('profile.listings_subtitle')}
            onPress={() => handleNavigation('listings')}
          />
          <ProfileMenuItem
            icon={Heart}
            title={t('profile.favorites')}
            onPress={() => handleNavigation('favorites')}
          />
        </ProfileSection>

        {/* Neighborhood Section */}
        <ProfileSection title={t('profile.neighborhood')}>
          <ProfileMenuItem
            icon={MapPin}
            title={t('profile.manage_neighborhood')}
            subtitle={t('profile.manage_neighborhood_subtitle')}
            onPress={() => handleNavigation('manage-neighborhood')}
          />
        </ProfileSection>

        {/* Trust & Verification Section */}
        <ProfileSection title={t('profile.trust_verification')}>
          <ProfileMenuItem
            icon={ShieldCheck}
            title={t('profile.verification')}
            subtitle={t('profile.verification_subtitle')}
            onPress={() => handleNavigation('verification')}
          />
        </ProfileSection>

        {/* Settings Section */}
        <ProfileSection title={t('profile.settings_section')}>
          <ProfileMenuItem
            icon={Settings}
            title={t('profile.settings')}
            onPress={() => handleNavigation('settings')}
          />
          <ProfileMenuItem
            icon={MessageCircle}
            title={t('profile.chats')}
            onPress={() => handleNavigation('chats')}
          />
          <ProfileMenuItem
            icon={Bell}
            title={t('profile.notifications')}
            onPress={() => handleNavigation('notifications')}
          />
        </ProfileSection>

        {/* Support & Information Section */}
        <ProfileSection title={t('profile.support_information')}>
          <ProfileMenuItem
            icon={HelpCircle}
            title={t('profile.contact_us')}
            onPress={() => handleNavigation('contact')}
          />
          <ProfileMenuItem
            icon={Sparkles}
            title={t('profile.whats_new')}
            onPress={() => handleNavigation('whats-new')}
          />
          <ProfileMenuItem
            icon={MessageSquare}
            title={t('profile.feedback')}
            onPress={() => handleNavigation('feedback')}
          />
          <ProfileMenuItem
            icon={Home}
            title={t('profile.about')}
            onPress={() => handleNavigation('about')}
          />
          <ProfileMenuItem
            icon={FileText}
            title={t('profile.terms_policies')}
            onPress={() => handleNavigation('terms')}
          />
        </ProfileSection>

        {/* App Version */}
        <Text style={[styles.appVersion, { color: mutedTextColor }]}>
          {t('profile.app_version')}
        </Text>
      </ScrollView>
    </View>
  );
};

export default ProfilePage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingBottom: 100,
    paddingTop: 20,
  },
  appVersion: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
});