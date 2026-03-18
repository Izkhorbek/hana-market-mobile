import { MarkerData } from '@/components/Maps/GoogleMap';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTranslations } from '@/hooks/use-translation';
import { navigate } from 'expo-router/build/global-state/routing';
import { X } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import RemoteImage from '../shared/RemoteImage';

interface MarkerDetailModalProps {
  marker: MarkerData | null;
  isVisible: boolean;
  onClose: () => void;
}

export function MarkerDetailModal({ marker, isVisible, onClose }: MarkerDetailModalProps) {
  const colors = useThemeColors();
  const { t } = useTranslations();

  if (!marker) return null;

  const handleViewDetails = (productId: number | string) => {
    if (!productId) return;

    navigate(`/product/${productId}`);
    onClose();
  }
  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={onClose}
      snapPoints={[0.4]}
      style={{ backgroundColor: colors.background }}
      enableBackdropDismiss={true}
      disablePanGesture={false}
    >
      <View style={styles.container}>
        {/* Close Button */}
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: colors.muted }]}
          onPress={onClose}
        >
          <X size={20} color={colors.text} />
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
          {/* Image and Main Info */}
          <View style={styles.header}>
            <RemoteImage
              src={marker.image || undefined}
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.headerText}>
              <Text variant="title" style={styles.title} numberOfLines={1}>
                {marker.title || 'Title'}
              </Text>
              <Text variant="caption" style={[styles.category, { color: colors.textMuted }]} numberOfLines={1}>
                {marker.category || 'Category'}
              </Text>
            </View>
          </View>

          {/* Category Tag and Distance */}
          <View style={styles.metaRow}>
            {marker.categoryTag && (
              <View style={[styles.tag, { backgroundColor: '#E8F5E9' }]}>
                <Text variant="caption" style={[styles.tagText, { color: '#2E7D32' }]} numberOfLines={1}  >
                  {marker.categoryTag}
                </Text>
              </View>
            )}
            {marker.distance && (
              <Text variant="caption" style={[styles.distance]} numberOfLines={1}>
                {marker.distance}
              </Text>
            )}
          </View>

          {/* Features */}
          {marker.features && marker.features.length > 0 && (
            <View style={styles.featuresContainer}>
              {marker.features.map((feature, index) => (
                <Text
                  key={index}
                  variant="body"
                  style={[styles.feature, { color: colors.primaryColor }]}
                  numberOfLines={1}
                >
                  {feature},
                </Text>
              ))}
            </View>
          )}

          {/* View Details Button */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#2E7D32' }]}
            onPress={() => handleViewDetails(marker.id)}
          >
            <Text variant="body" style={styles.buttonText} numberOfLines={1}>
              {t('map.view_details')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    backgroundColor: '#E0E0E0',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  category: {
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  distance: {
    fontSize: 13,
  },
  featuresContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  feature: {
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
