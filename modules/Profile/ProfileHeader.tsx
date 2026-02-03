import { useColor } from '@/hooks/useColor';
import { ChevronRight, User } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ProfileHeaderProps {
  name: string;
  status: string;
  temperature: string;
  onPress?: () => void;
}

const ProfileHeader = ({ name, status, temperature, onPress }: ProfileHeaderProps) => {
  const cardColor = useColor('profileCard');
  const primaryColor = useColor('primary');
  const textColor = useColor('text');
  const mutedTextColor = useColor('textMuted');

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: cardColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: primaryColor }]}>
          <User size={28} color="#fff" strokeWidth={2} />
        </View>
        <View style={styles.statusDot} />
      </View>

      <View style={styles.infoContainer}>
        <Text style={[styles.name, { color: textColor }]}>{name}</Text>
        <View style={styles.statusContainer}>
          <Text style={[styles.temperature, { color: mutedTextColor }]}>
            • {temperature} {status}
          </Text>
        </View>
      </View>

      <ChevronRight size={20} color={mutedTextColor} strokeWidth={2} />
    </TouchableOpacity>
  );
};

export default ProfileHeader;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10b981',
    borderWidth: 2.5,
    borderColor: '#fff',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  temperature: {
    fontSize: 13,
    fontWeight: '400',
  },
});
