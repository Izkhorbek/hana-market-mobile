import { useColor } from '@/hooks/useColor';
import { X } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NotificationBannerProps {
  message: string;
  onClose?: () => void;
}

const NotificationBanner = ({ message, onClose }: NotificationBannerProps) => {
  const bannerBgColor = useColor('notificationBannerBg');
  const bannerTextColor = useColor('notificationBannerText');

  return (
    <View style={[styles.container, { backgroundColor: bannerBgColor }]}>
      <Text style={[styles.message, { color: bannerTextColor }]}>{message}</Text>
      {onClose && (
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={20} color={bannerTextColor} strokeWidth={2} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default NotificationBanner;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 24,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    marginLeft: 12,
    padding: 4,
  },
});
