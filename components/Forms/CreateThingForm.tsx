import { useCategoriesQuery, useCreateProductMutation } from '@/api/hooks'
import SuccessPostModal from '@/components/guidance/SuccessPostModal'
import FormCheckbox from '@/components/FormElements/FormCheckbox'
import FormInput from '@/components/FormElements/FormInput'
import FormSelect from '@/components/FormElements/FormSelect'
import { ECurrencyType, EProductType } from '@/constants/enums'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { isMissingProfileAddressError, parseApiError } from '@/utils/apiError'
import { Category } from '@/types'
import PostLocationPicker, {
  type PickedLocation,
} from '@/components/FormElements/PostLocationPicker'
import { useRouter } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import FormRow from '../FormElements/FormRow'
import ImageUploader, { DraftImageItem } from '../FormElements/ImageUploader'
import RadioButtonGroup, {
  RadioOption,
} from '../FormElements/RadioButtonGroup'

const CreateThingForm = () => {
  const { t, locale } = useTranslations()
  const colors = useThemeColors()

  const router = useRouter()
  // null = post under the profile address; set = an explicit place on the map.
  const [customLocation, setCustomLocation] = useState<PickedLocation | null>(null)
  const [successVisible, setSuccessVisible] = useState(false)
  const [createdProductId, setCreatedProductId] = useState<number | null>(null)
  const isSubmittingRef = useRef(false)
  // Guards against setState after unmount if the user leaves mid-create-request.
  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])
  const { data: categories } = useCategoriesQuery()

  const categoryOptions =
    categories?.data?.data?.map((category: Category) => ({
      value: category.id.toString(),
      label: locale === 'ru' ? category.name_ru : category.name_uz,
    })) || []

  const sellingMethodOptions: RadioOption[] = [
    {
      value: 'for_sale',
      label: t('post.for_sale'),
    },
    {
      value: 'free',
      label: t('post.free'),
    },
  ]

  const form = useForm({
    defaultValues: {
      images: [],
      title: '',
      category: '',
      description: '',
      sellingMethod: sellingMethodOptions[0].value, // Default to "For Sale"
      price: '',
      currency: ECurrencyType[ECurrencyType.UZS],
      canDeal: false,
  
      landmark: '', // moljal
    },
  })

  const sellingMethod = form.watch('sellingMethod')
  const currency = form.watch('currency')

  // Clear price validation error when user switches to 'free'
  useEffect(() => {
    if (sellingMethod === 'free') {
      form.clearErrors('price')
    }
  }, [sellingMethod, form])

  const { mutate: createProduct, isPending: isCreating } =
    useCreateProductMutation({
      onSuccess: (response) => {
        if (!isMountedRef.current) return
        // Success modal replaces the plain alert. Product id is shown if the API returns one.
        const createdId =
          (response?.data?.data as { product_id?: number } | undefined)?.product_id ?? null
        form.reset()
        setCreatedProductId(typeof createdId === 'number' && createdId > 0 ? createdId : null)
        setSuccessVisible(true)
      },
      onError: (error: any) => {
        // Nothing is posted with the device position any more, so a user with
        // no saved address has nowhere to pin this — send them to set one
        // instead of showing the backend sentence raw (sync §14/§20).
        if (isMissingProfileAddressError(error)) {
          Alert.alert(t('post.no_address_title'), t('post.no_address_message'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('post.no_address_action'),
              onPress: () => router.push('/(settings)/manage'),
            },
          ])
          return
        }
        const message = parseApiError(error, t('post.error_creating_product'))
        Alert.alert(t('post.error'), message)
      },
    })

  const watchedImages: DraftImageItem[] = form.watch('images')
  const isUploading = watchedImages.some((img) => img.uploading)
  const isPending = isCreating || isUploading

  const onInvalid = (formErrors: Record<string, any>) => {
    const messages = Object.values(formErrors)
      .map((err) => `• ${err?.message}`)
      .filter(Boolean)
      .join('\n')
    if (messages) {
      Alert.alert(t('post.error'), messages)
    }
  }

  const handleSubmit = form.handleSubmit(async (data) => {
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true

    try {

      const images: DraftImageItem[] = data.images

      // Create FormData for product creation
      const formData = new FormData()

      // Add product type
      formData.append('product_type', EProductType.THING.toString())

      // Add basic fields
      formData.append('title', data.title)
      formData.append('description', data.description || '')

      // Add category if selected
      if (data.category) {
        formData.append('category_id', data.category)
      }

      // Add pricing based on selling method
      const isFree = data.sellingMethod === 'free'
      formData.append('is_free', isFree.toString())

      if (isFree) {
        formData.append('currency_type', ECurrencyType.UZS.toString())
      } else {
        const currencyType =
          data.currency === 'USD' ? ECurrencyType.USD : ECurrencyType.UZS
        formData.append('currency_type', currencyType.toString())

        const priceField = data.currency === 'USD' ? 'price_usd' : 'price_uzs'
        formData.append(priceField, data.price)

        formData.append('is_negotiable', data.canDeal.toString())
      }

      // Coordinates travel only when the user picked a place on the map. Without
      // them the backend pins this to the owner's saved profile address and tags
      // its mahalla (sync §14/§20); with them it is recorded as 'custom'.
      if (customLocation) {
        formData.append('latitude', customLocation.latitude.toString())
        formData.append('longitude', customLocation.longitude.toString())
      }
      formData.append('moljal', data.landmark || '')

      // Add pre-uploaded draft images as JSON
      const draft_images = images.map((img, index) => ({
        draft_uuid: img.draft_uuid,
        draft_image_url: img.draft_image_url,
        sort_order: index, // You can implement sorting logic if needed
      }))

      formData.append('images_json', JSON.stringify(draft_images))

      createProduct(formData)
    } finally {
      isSubmittingRef.current = false
    }
  }, onInvalid)

  return (
    <View style={styles.container}>
      <View style={styles.formContent}>
        {/* Section 1: Images */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.profileBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionAccent,
                { backgroundColor: colors.primaryColor },
              ]}
            />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('post.images')}
            </Text>
          </View>
          <ImageUploader
            control={form.control}
            name="images"
            maxImages={5}
            rules={{
              validate: (value: DraftImageItem[]) => {
                if (value.length === 0) return t('post.errors.images')
                if (value.some((img) => img.uploading))
                  return t('post.errors.images_uploading')
                return true
              },
            }}
          />
        </View>

        {/* Section 2: Item Details */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionAccent,
                { backgroundColor: colors.primaryColor },
              ]}
            />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('post.item_details')}
            </Text>
          </View>

          <FormInput
            control={form.control}
            name="title"
            label={t('post.title')}
            placeholder={t('post.title_placeholder')}
            required
            rules={{
              required: t('post.errors.title'),
            }}
          />

          <FormSelect
            control={form.control}
            name="category"
            label={t('post.category')}
            placeholder={t('post.category')}
            options={categoryOptions}
            required
            rules={{
              required: t('post.errors.category'),
            }}
          />

          <FormInput
            control={form.control}
            name="description"
            label={t('post.description')}
            placeholder={t('post.description_placeholder')}
            type="textarea"
            rows={5}
          />
        </View>

        {/* Section 3: Selling Methods */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.profileBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionAccent,
                { backgroundColor: colors.primaryColor },
              ]}
            />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('post.selling_methods')}
            </Text>
          </View>

          <RadioButtonGroup
            control={form.control}
            name="sellingMethod"
            options={sellingMethodOptions}
          />

          {sellingMethod === 'for_sale' && (
            <>
              <FormRow>
                <View style={styles.priceInputWrapper}>
                  <FormInput
                    control={form.control}
                    name="price"
                    label={t('post.price')}
                    placeholder={t('post.price_placeholder')}
                    keyboardType="numeric"
                    required
                    rules={{
                      required:
                        sellingMethod === 'for_sale'
                          ? t('post.errors.price')
                          : false,
                      validate: (value: string) => {
                        if (sellingMethod !== 'for_sale') return true
                        const num = parseFloat(value)
                        if (isNaN(num) || num <= 0)
                          return t('post.errors.price_invalid')
                        return true
                      },
                    }}
                  />
                </View>
                <View style={styles.currencyButtons}>
                  <TouchableOpacity
                    style={[
                      styles.currencyButton,
                      {
                        backgroundColor:
                          currency === 'UZS'
                            ? colors.primaryColor
                            : 'transparent',
                        borderColor: colors.primaryColor,
                      },
                    ]}
                    onPress={() => form.setValue('currency', 'UZS')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.currencyButtonText,
                        {
                          color:
                            currency === 'UZS' ? '#fff' : colors.primaryColor,
                        },
                      ]}
                    >
                      SUM
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.currencyButton,
                      {
                        backgroundColor:
                          currency === 'USD'
                            ? colors.primaryColor
                            : 'transparent',
                        borderColor: colors.primaryColor,
                      },
                    ]}
                    onPress={() => form.setValue('currency', 'USD')}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.currencyButtonText,
                        {
                          color:
                            currency === 'USD' ? '#fff' : colors.primaryColor,
                        },
                      ]}
                    >
                      USD
                    </Text>
                  </TouchableOpacity>
                </View>
              </FormRow>
              <FormCheckbox
                control={form.control}
                name="canDeal"
                label={t('post.can_deal')}
              />
            </>
          )}
        </View>

        {/* Section 4: Meeting */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionAccent,
                { backgroundColor: colors.primaryColor },
              ]}
            />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('post.meeting')}
            </Text>
          </View>

          {/* Hidden field removed: location is auto-resolved on Post */}

          <FormRow>
            <View style={styles.locationInputWrapper}>
              <FormInput
                control={form.control}
                name="landmark"
                label={t('post.landmark')}
                placeholder={t('post.landmark_placeholder')}
                placeholderTextColor={colors.textMuted}
                required
                rules={{
                  required: t('post.errors.landmark'),
                }}
              />
            </View>
          </FormRow>

          <FormRow>
            <PostLocationPicker value={customLocation} onChange={setCustomLocation} />
          </FormRow>
        </View>
      </View>

      {/* Fixed Bottom Post Button */}
      <View style={[styles.buttonContainer]}>
        <TouchableOpacity
          style={[
            styles.postButton,
            {
              backgroundColor: isPending
                ? colors.primaryColor + '80'
                : colors.primaryColor,
              opacity: isPending ? 0.7 : 1,
            },
          ]}
          onPress={handleSubmit}
          disabled={isPending}
          activeOpacity={0.8}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.postButtonText}>{t('post.post_button')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <SuccessPostModal
        visible={successVisible}
        productId={createdProductId}
        onClose={() => {
          setSuccessVisible(false)
          router.back()
        }}
        onViewListing={(id) => {
          setSuccessVisible(false)
          router.push(`/product/${id}`)
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formContent: {
    paddingTop: 8,
  },
  section: {
    marginBottom: 14,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionAccent: {
    width: 4,
    height: 18,
    borderRadius: 3,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  priceInputWrapper: {
    flex: 1,
  },
  currencyButtons: {
    flexDirection: 'column',
    gap: 6,
    marginTop: 30, // Align with input (label height + margin)
  },
  currencyButton: {
    width: 52,
    height: 23,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  locationInputWrapper: {
    flex: 1,
  },
  mapButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30, // Align with input (label height + margin)
  },
  buttonContainer: {
    paddingVertical: 12,
  },
  postButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})

export default CreateThingForm
