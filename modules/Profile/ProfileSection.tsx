import { useColor } from '@/hooks/useColor';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ProfileSectionProps {
  title: string;
  children: React.ReactNode;
}

const ProfileSection = ({ title, children }: ProfileSectionProps) => {
  const mutedTextColor = useColor('textMuted');

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: mutedTextColor }]}>
        {title}
      </Text>
      {children}
    </View>
  );
};

export default ProfileSection;

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
});
