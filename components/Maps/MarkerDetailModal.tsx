import { MarkerData } from '@/components/Maps/GoogleMap';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { X } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';

interface MarkerDetailModalProps {
  marker: MarkerData | null;
  isVisible: boolean;
  onClose: () => void;
}

export function MarkerDetailModal({ marker, isVisible, onClose }: MarkerDetailModalProps) {
  const colors = useThemeColors();

  if (!marker) return null;

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
            <Image
              source={{ uri: marker.image || 'https://images.pexels.com/photos/7486933/pexels-photo-7486933.jpeg' }}
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.headerText}>
              <Text variant="title" style={styles.title} numberOfLines={1}>
                {marker.title || 'Location'}
              </Text>
              <Text variant="caption" style={[styles.category, { color: colors.muted }]}>
                {marker.category || 'Location'}
              </Text>
            </View>
          </View>

          {/* Category Tag and Distance */}
          <View style={styles.metaRow}>
            {marker.categoryTag && (
              <View style={[styles.tag, { backgroundColor: '#E8F5E9' }]}>
                <Text variant="caption" style={[styles.tagText, { color: '#2E7D32' }]}>
                  {marker.categoryTag}
                </Text>
              </View>
            )}
            {marker.distance && (
              <Text variant="caption" style={[styles.distance, { color: colors.muted }]}>
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
                  style={[styles.feature, { color: '#2E7D32' }]}
                >
                  {feature}
                </Text>
              ))}
            </View>
          )}

          {/* View Details Button */}
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#2E7D32' }]}
            onPress={() => {
              console.log('View details for:', marker.title);
              // Add your navigation logic here
            }}
          >
            <Text variant="body" style={styles.buttonText}>
              View Details
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
    backgroundColor: '#E0E0E0',
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 18,
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
    paddingVertical: 4,
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
