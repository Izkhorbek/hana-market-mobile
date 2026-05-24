import { productService } from '@/api/services'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useColor } from '@/hooks/useColor'
import * as ImagePicker from 'expo-image-picker'
import { ImagePlus, Star, X } from 'lucide-react-native'
import React, { useRef } from 'react'
import { Control, Controller } from 'react-hook-form'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import RemoteImage from '../shared/RemoteImage'
import { logger } from '@/utils/logger'

export interface DraftImageItem {
  uri: string;
  draft_uuid?: string;
  draft_image_url?: string;
  uploading?: boolean;
  uploadError?: boolean;
}

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
  const colors = useThemeColors()
  const textColor = useColor('text')
  const destructiveColor = useColor('destructive')
  const borderColor = useColor('borderColor')
  const primaryColor = useColor('primaryColor')
  const { t } = useTranslations()

  // Ref to always have the latest images array in async callbacks (avoids stale closures)
  const latestImagesRef = useRef<DraftImageItem[]>([])

  const uploadSingleImage = async (
    uri: string,
    index: number,
    onChange: (images: DraftImageItem[]) => void
  ) => {
    try {
      const formData = new FormData()
      formData.append('images', {
        uri,
        type: 'image/jpeg',
        name: `image_${Date.now()}_${index}.jpg`,
      } as any)

      const response = await productService.uploadDraftImages(formData)
      const draftImage = response?.data?.data?.[0]

      latestImagesRef.current = latestImagesRef.current.map((img, i) =>
        i === index
          ? {
            ...img,
            draft_uuid: draftImage?.draft_uuid,
            draft_image_url: draftImage?.draft_image_url,
            uploading: false,
            uploadError: false,
          }
          : img
      )
      onChange([...latestImagesRef.current])
    } catch (error) {
      logger.error(error, 'Upload error for image at index')
      latestImagesRef.current = latestImagesRef.current.map((img, i) =>
        i === index ? { ...img, uploading: false, uploadError: true } : img
      )
      onChange([...latestImagesRef.current])
    }
  }

  const pickImage = async (
    currentImages: DraftImageItem[],
    onChange: (images: DraftImageItem[]) => void
  ) => {
    if (currentImages.length >= maxImages) return

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (permissionResult.granted === false) {
      alert('Permission to access camera roll is required!')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 0.8,
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const remainingSlots = maxImages - currentImages.length
      const assetsToAdd = result.assets.slice(0, remainingSlots)
      const startIndex = currentImages.length

      // Add items immediately with uploading=true so user sees progress
      const newItems: DraftImageItem[] = assetsToAdd.map((asset) => ({
        uri: asset.uri,
        uploading: true,
      }))

      const combined = [...currentImages, ...newItems]
      latestImagesRef.current = combined
      onChange(combined)

      // Upload each image in parallel
      assetsToAdd.forEach((asset, i) => {
        uploadSingleImage(asset.uri, startIndex + i, onChange)
      })
    }
  }

  const removeImage = (
    index: number,
    currentImages: DraftImageItem[],
    onChange: (images: DraftImageItem[]) => void
  ) => {
    const imageToRemove = currentImages[index]
    const updated = currentImages.filter((_, i) => i !== index)
    latestImagesRef.current = updated
    onChange(updated)

    if (imageToRemove?.draft_uuid) {
      productService.deleteDraftImage(imageToRemove.draft_uuid).catch((err) => {
        console.warn('Failed to delete draft image:', imageToRemove.draft_uuid, err)
      })
    }
  }

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
        render={({ field: { onChange, value = [] }, fieldState: { error } }) => {
          // Keep ref in sync with the latest rendered value
          latestImagesRef.current = value

          const mainItem: DraftImageItem | undefined = value[0]

          return (
            <>
              {/* Main image slot */}
              <TouchableOpacity
                style={[
                  styles.mainSlot,
                  { borderColor: mainItem ? 'transparent' : borderColor },
                ]}
                onPress={() => pickImage(value, onChange)}
                activeOpacity={0.8}
                disabled={mainItem?.uploading}
              >
                {mainItem ? (
                  <>
                    <RemoteImage src={mainItem.uri} style={styles.mainImage} />
                    {mainItem.uploading ? (
                      <View style={styles.uploadingOverlay}>
                        <ActivityIndicator color="#fff" size="large" />
                      </View>
                    ) : (
                      <>
                        <View
                          style={[
                            styles.mainBadge,
                            { backgroundColor: mainItem.uploadError ? destructiveColor : primaryColor },
                          ]}
                        >
                          <Star size={12} color="#fff" fill="#fff" strokeWidth={0} />
                          <Text style={styles.mainBadgeText}>
                            {mainItem.uploadError ? t('post.upload_failed') : t('post.main_photo')}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.removeButton, { backgroundColor: destructiveColor }]}
                          onPress={() => removeImage(0, value, onChange)}
                          activeOpacity={0.8}
                        >
                          <X size={16} color="#fff" strokeWidth={3} />
                        </TouchableOpacity>
                      </>
                    )}
                  </>
                ) : (
                  <View style={styles.mainPlaceholder}>
                    <ImagePlus size={36} color={primaryColor} strokeWidth={1.5} />
                    <Text style={[styles.mainPlaceholderTitle, { color: textColor }]}>
                      {t('post.main_photo')}
                    </Text>
                    <Text style={[styles.mainPlaceholderSub, { color: borderColor }]}>
                      {t('post.main_photo_hint')}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Additional image slots */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                style={styles.scrollRow}
              >
                {/* Add button */}
                <TouchableOpacity
                  style={[
                    styles.thumbSlot,
                    {
                      borderColor: colors.borderColor,
                      opacity: value.length >= maxImages ? 0.4 : 1,
                    },
                  ]}
                  onPress={() => pickImage(value, onChange)}
                  disabled={value.length >= maxImages}
                  activeOpacity={0.7}
                >
                  <ImagePlus
                    size={24}
                    color={value.length >= maxImages ? borderColor : primaryColor}
                    strokeWidth={1.5}
                  />
                  <Text style={[styles.thumbCount, { color: value.length >= maxImages ? borderColor : textColor }]}>
                    {value.length}/{maxImages}
                  </Text>
                </TouchableOpacity>

                {/* Additional images (index 1+) */}
                {value.slice(1).map((item: DraftImageItem, i: number) => (
                  <View key={i + 1} style={styles.thumbContainer}>
                    <RemoteImage src={item.uri} style={styles.thumbImage} />
                    {item.uploading ? (
                      <View style={styles.uploadingOverlay}>
                        <ActivityIndicator color="#fff" size="small" />
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.removeButton, { backgroundColor: destructiveColor }]}
                        onPress={() => removeImage(i + 1, value, onChange)}
                        activeOpacity={0.8}
                      >
                        <X size={14} color="#fff" strokeWidth={3} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </ScrollView>

              {error?.message && (
                <Text style={[styles.errorText, { color: destructiveColor }]}>
                  {error.message}
                </Text>
              )}
            </>
          )
        }}
      />
    </View>
  )
}

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
  // Main slot
  mainSlot: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 10,
  },
  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mainBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  mainBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  mainPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  mainPlaceholderTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  mainPlaceholderSub: {
    fontSize: 12,
  },
  // Additional slots row
  scrollRow: {
    marginTop: 2,
  },
  scrollContent: {
    gap: 10,
  },
  thumbSlot: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  thumbCount: {
    fontSize: 11,
    fontWeight: '500',
  },
  thumbContainer: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
})

export default ImageUploader
