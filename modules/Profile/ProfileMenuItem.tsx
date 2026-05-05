import { useColor } from '@/hooks/useColor';
import { ChevronRight } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ProfileMenuItemProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  badge?: string;
  onPress?: () => void;
  showChevron?: boolean;
  rightContent?: React.ReactNode;
}

const ProfileMenuItem = ({
  icon: Icon,
  title,
  subtitle,
  badge,
  onPress,
  showChevron = true,
  rightContent,
}: ProfileMenuItemProps) => {
  const cardColor = useColor('profileCard');
  const textColor = useColor('text');
  const mutedTextColor = useColor('textMuted'); 

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: cardColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer]}>
        <Icon size={20} color={textColor} strokeWidth={2} />
      </View>

      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: mutedTextColor }]}>
            {subtitle}
          </Text>
        )}
      </View>

      {badge && (
        <View style={styles.badge}>
          <Text style={[styles.badgeText, { color: mutedTextColor }]}>
            {badge}
          </Text>
        </View>
      )}

      {rightContent ? (
        rightContent
      ) : (
        showChevron && (
          <ChevronRight size={20} color={mutedTextColor} strokeWidth={2} />
          )
      )}
    </TouchableOpacity>
  );
};

export default ProfileMenuItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 0,
    marginBottom: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  badge: {
    marginRight: 8,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '400',
  },
});
