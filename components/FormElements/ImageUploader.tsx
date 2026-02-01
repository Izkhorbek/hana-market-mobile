import { useThemeColors } from '@/hooks/use-theme-colors';
import { useColor } from '@/hooks/useColor';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus, X } from 'lucide-react-native';
import React from 'react';
import { Control, Controller } from 'react-hook-form';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ThemedScrollView from '../themed-scrollview';

interface ImageUploaderProps {
  control?: Control<any>;
  name?: string;
  label?: string;
  required?: boolean;
  maxImages?: number;
  rules?: any;
}

const ImageUploader = ({
  control,
  name = 'images',
  label,
  required = false,
  maxImages = 5,
  rules,
}: ImageUploaderProps) => {
  const colors = useThemeColors();
  const textColor = useColor('text');
  const destructiveColor = useColor('destructive');
  const borderColor = useColor('borderColor');
  const primaryColor = useColor('primaryColor'); 

  const pickImage = async (currentImages: string[], onChange: (images: string[]) => void) => {
    if (currentImages.length >= maxImages) {
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert('Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      // Get URIs from all selected images
      const selectedImageUris = result.assets.map(asset => asset.uri);
      
      // Calculate how many more images we can add
      const remainingSlots = maxImages - currentImages.length;
      
      // Take only the first N images that fit within the limit
      const imagesToAdd = selectedImageUris.slice(0, remainingSlots);
      
      // Combine current images with new ones
      const newImages = [...currentImages, ...imagesToAdd];
      onChange(newImages);
    }
  };

  const removeImage = (index: number, currentImages: string[], onChange: (images: string[]) => void) => {
    const newImages = currentImages.filter((_, i) => i !== index);
    onChange(newImages);
  };

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
          {required && <Text style={[styles.asterisk, { color: destructiveColor }]}> *</Text>}
        </View>
      )}
      <Controller
        name={name!}
        control={control}
        rules={rules}
        render={({ field: { onChange, value = [] }, fieldState: { error } }) => (
          <>
            <ThemedScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Add Image Button */}
              <TouchableOpacity
                style={[
                  styles.addButton,
                  {
                    borderColor: colors.borderColor,
                  },
                  value.length >= maxImages && styles.addButtonDisabled,
                ]}
                onPress={() => pickImage(value, onChange)}
                disabled={value.length >= maxImages}
                activeOpacity={0.7}
              >
                <ImagePlus
                  size={32}
                  color={value.length >= maxImages ? borderColor : primaryColor}
                  strokeWidth={1.5}
                />
                <Text
                  style={[
                    styles.addButtonText,
                    { color: value.length >= maxImages ? borderColor : textColor }
                  ]}
                >
                  {value.length}/{maxImages}
                </Text>
              </TouchableOpacity>

              {/* Display Selected Images */}
              {value.map((uri: string, index: number) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri }} style={styles.image} />
                  <TouchableOpacity
                    style={[styles.removeButton, { backgroundColor: destructiveColor }]}
                    onPress={() => removeImage(index, value, onChange)}
                    activeOpacity={0.8}
                  >
                    <X size={16} color="#fff" strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              ))}
            </ThemedScrollView>
            {error?.message && (
              <Text style={[styles.errorText, { color: destructiveColor }]}>
                {error.message}
              </Text>
            )}
          </>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  asterisk: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContent: {
    gap: 12,
  },
  addButton: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default ImageUploader;
