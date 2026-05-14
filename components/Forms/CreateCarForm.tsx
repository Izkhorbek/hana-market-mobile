import { useCreateProductMutation } from '@/api/hooks'
import FormCheckbox from '@/components/FormElements/FormCheckbox'
import FormInput from '@/components/FormElements/FormInput'
import {
  ECarCondition,
  ECarFuelType,
  ECarTransmissionType,
  ECategoryType,
  ECurrencyType,
  EProductType,
} from '@/constants/enums'
import { useTranslations } from '@/hooks/use-translation'
import { useColor } from '@/hooks/useColor'
import { parseApiError } from '@/utils/apiError'
import { resolveEnum } from '@/utils/enumHelpers'
import {
  getCurrentLocationSafe,
  showLocationErrorAlert,
} from '@/utils/location'
import { useRouter } from 'expo-router'
import React, { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import FormRow from '../FormElements/FormRow'
import ImageUploader, { DraftImageItem } from '../FormElements/ImageUploader'
import RadioButtonGroup, {
  RadioOption,
} from '../FormElements/RadioButtonGroup'

const CreateCarForm = () => {
  const { t } = useTranslations()
  const primaryColor = useColor('primaryColor')
  const textColor = useColor('text')
  const insets = useSafeAreaInsets()
  const subTextColor = useColor('subText')
  const surfaceColor = useColor('background')
  const sectionTintColor = useColor('profileBackground')
  const borderColor = useColor('border')
  const mutedTextColor = useColor('textMuted')

  const router = useRouter()
  const [isResolvingLocation, setIsResolvingLocation] = useState(false)
  const isSubmittingRef = useRef(false)

  const fuelTypeOptions: RadioOption[] = [
    { value: 'petrol', label: t('car.petrol') },
    { value: 'gas', label: t('car.gas') },
    { value: 'hybrid', label: t('car.hybrid') },
    { value: 'electric', label: t('car.electric') },
  ]

  const transmissionOptions: RadioOption[] = [
    { value: 'automatic', label: t('car.automatic') },
    { value: 'manual', label: t('car.manual') },
  ]

  const conditionOptions: RadioOption[] = [
    { value: 'new', label: t('car.new') },
    { value: 'used', label: t('car.used') },
    { value: 'broken', label: t('car.needs_repair') },
  ]

  const form = useForm({
    defaultValues: {
      images: [],
      brand: '',
      model: '',
      year: '',
      mileage: '',
      fuelType: fuelTypeOptions[0].value, // Default to first fuel type option
      transmission: transmissionOptions[0].value, // Default to first transmission option
      price: '',
      currency: ECurrencyType[ECurrencyType.UZS], // "UZS"
      negotiable: false,
      condition: conditionOptions[0].value, // Default to first condition option
      landmark: '',
      additionalNotes: '',
    },
  })

  const fuelType = form.watch('fuelType')
  const transmission = form.watch('transmission')
  const condition = form.watch('condition')
  const currency = form.watch('currency')

  const { mutate: createProduct, isPending } = useCreateProductMutation({
    onSuccess: () => {
      Alert.alert(t('post.success'), t('post.product_created_successfully'), [
        {
          text: t('common.ok'),
          onPress: () => router.back(),
        },
      ])
      form.reset()
    },
    onError: (error: any) => {
      const message = parseApiError(error, t('post.error_creating_product'))
      Alert.alert(t('post.error'), message)
    },
  })

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
    // ── Resolve current location automatically ──
    setIsResolvingLocation(true)
    const locationResult = await getCurrentLocationSafe()
    setIsResolvingLocation(false)

    if (!locationResult.ok) {
      showLocationErrorAlert(locationResult, t)
      return
    }
    const coords = locationResult.coords

    // ── Enum resolution ──
    const fuelTypeValue = resolveEnum(ECarFuelType, data.fuelType)
    const transmissionValue = resolveEnum(
      ECarTransmissionType,
      data.transmission,
    )
    const conditionValue = resolveEnum(ECarCondition, data.condition)

    if (fuelTypeValue === undefined) {
      Alert.alert(t('post.error'), 'Invalid fuel type selected')
      return
    }
    if (transmissionValue === undefined) {
      Alert.alert(t('post.error'), 'Invalid transmission selected')
      return
    }
    if (conditionValue === undefined) {
      Alert.alert(t('post.error'), 'Invalid condition selected')
      return
    }

    const formData = new FormData()

    // Add product type
    formData.append('product_type', EProductType.CAR.toString())

    // Add category
    formData.append('category_id', ECategoryType.CARS.toString()) // Assuming 100 is the category ID for cars, adjust as needed
    // Add car brand and model
    formData.append('car_brand', data.brand)
    formData.append('car_model', data.model)
    formData.append('title', `${data.brand} ${data.model}`)
    formData.append('description', data.additionalNotes || '')

    // Add car-specific data
    formData.append('car_data.year', data.year)
    formData.append('car_data.mileage', data.mileage)

    formData.append('car_data.fuel_type', fuelTypeValue.toString())
    formData.append('car_data.car_transmission', transmissionValue.toString())
    formData.append('car_data.car_condition', conditionValue.toString())

    // Add pricing
    const currencyType =
      data.currency === 'USD' ? ECurrencyType.USD : ECurrencyType.UZS
    formData.append('currency_type', currencyType.toString())
    const priceField = data.currency === 'USD' ? 'price_usd' : 'price_uzs'
    formData.append(priceField, data.price)
    formData.append('is_negotiable', data.negotiable.toString())
    formData.append('is_free', 'false')

    // Add location (auto-resolved on Post)
    formData.append('latitude', coords.latitude.toString())
    formData.append('longitude', coords.longitude.toString())
    formData.append('moljal', data.landmark || '')

    // Add images
    const images: DraftImageItem[] = data.images

    const draft_images = images.map((img, index) => ({
      draft_uuid: img.draft_uuid,
      draft_image_url: img.draft_image_url,
      sort_order: index, // You can implement sorting logic if needed
    }))

    formData.append('images_json', JSON.stringify(draft_images))

    // Submit the form data
    createProduct(formData)
    } finally {
      setIsResolvingLocation(false)
      isSubmittingRef.current = false
    }
  }, onInvalid)

  return (
    <View style={styles.container}>
      <View style={styles.formContent}>
        {/* Section 1: Upload Images */}
        <View
          style={[
            styles.section,
            { backgroundColor: sectionTintColor, borderColor },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View
              style={[styles.sectionAccent, { backgroundColor: primaryColor }]}
            />
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              {t('car.upload_images')}
            </Text>
          </View>
          <ImageUploader
            control={form.control}
            name="images"
            maxImages={5}
            rules={{
              validate: (value: string[]) =>
                value.length > 0 || t('car.errors.images'),
            }}
          />
        </View>

        {/* Section 2: Car Information */}
        <View
          style={[
            styles.section,
            { backgroundColor: surfaceColor, borderColor },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View
              style={[styles.sectionAccent, { backgroundColor: primaryColor }]}
            />
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              {t('car.car_information')}
            </Text>
          </View>

          <FormInput
            control={form.control}
            name="brand"
            label={t('car.car_brand')}
            placeholder={t('car.car_brand_placeholder')}
            required
            rules={{
              required: t('car.errors.brand'),
            }}
          />

          <FormInput
            control={form.control}
            name="model"
            label={t('car.car_model')}
            placeholder={t('car.car_model_placeholder')}
            required
            rules={{
              required: t('car.errors.model'),
            }}
          />

          <FormRow>
            <View style={styles.halfInput}>
              <FormInput
                control={form.control}
                name="year"
                label={t('car.year')}
                placeholder={t('car.year_placeholder')}
                keyboardType="numeric"
                required
                rules={{
                  required: t('car.errors.year'),
                  pattern: {
                    value: /^\d{4}$/,
                    message: t('car.errors.year_invalid'),
                  },
                  validate: (value: string) => {
                    const year = parseInt(value, 10)
                    if (year < 1900 || year > new Date().getFullYear() + 1)
                      return t('car.errors.year_range')
                    return true
                  },
                }}
              />
            </View>
            <View style={styles.halfInput}>
              <FormInput
                control={form.control}
                name="mileage"
                label={t('car.mileage')}
                placeholder={t('car.mileage_placeholder')}
                placeholderTextColor={mutedTextColor}
                keyboardType="numeric"
                required
                rules={{
                  required: t('car.errors.mileage'),
                  validate: (value: string) => {
                    const num = parseInt(value, 10)
                    if (isNaN(num) || num < 0)
                      return t('car.errors.mileage_invalid')
                    return true
                  },
                }}
              />
            </View>
          </FormRow>

          <View style={styles.radioSection}>
            <Text style={[styles.radioLabel, { color: subTextColor }]}>
              {t('car.fuel_type')}
            </Text>
            <RadioButtonGroup
              control={form.control}
              name="fuelType"
              options={fuelTypeOptions}
            />
          </View>

          <View style={styles.radioSection}>
            <Text style={[styles.radioLabel, { color: subTextColor }]}>
              {t('car.transmission')}
            </Text>
            <RadioButtonGroup
              control={form.control}
              name="transmission"
              options={transmissionOptions}
            />
          </View>
        </View>

        {/* Section 3: Selling Details */}
        <View
          style={[
            styles.section,
            { backgroundColor: sectionTintColor, borderColor },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View
              style={[styles.sectionAccent, { backgroundColor: primaryColor }]}
            />
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              {t('car.selling_details')}
            </Text>
          </View>

          <FormRow>
            <View style={styles.priceInputWrapper}>
              <FormInput
                control={form.control}
                name="price"
                label={t('car.price')}
                placeholder={t('car.price_placeholder')}
                placeholderTextColor={mutedTextColor}
                keyboardType="numeric"
                required
                rules={{
                  required: t('car.errors.price'),
                  validate: (value: string) => {
                    const num = parseFloat(value)
                    if (isNaN(num) || num <= 0)
                      return t('car.errors.price_invalid')
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
                      currency === 'UZS' ? primaryColor : 'transparent',
                    borderColor: primaryColor,
                  },
                ]}
                onPress={() => form.setValue('currency', 'UZS')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.currencyButtonText,
                    { color: currency === 'UZS' ? '#fff' : primaryColor },
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
                      currency === 'USD' ? primaryColor : 'transparent',
                    borderColor: primaryColor,
                  },
                ]}
                onPress={() => form.setValue('currency', 'USD')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.currencyButtonText,
                    { color: currency === 'USD' ? '#fff' : primaryColor },
                  ]}
                >
                  USD
                </Text>
              </TouchableOpacity>
            </View>
          </FormRow>

          <FormCheckbox
            control={form.control}
            name="negotiable"
            label={t('car.negotiable')}
          />

          <View style={styles.radioSection}>
            <Text style={[styles.radioLabel, { color: subTextColor }]}>
              {t('car.condition')}
            </Text>
            <RadioButtonGroup
              control={form.control}
              name="condition"
              options={conditionOptions}
            />
          </View>

          <FormRow>
            <View style={styles.locationInputWrapper}>
              <FormInput
                control={form.control}
                name="landmark"
                label={t('car.landmark')}
                placeholder={t('car.landmark_placeholder')}
                placeholderTextColor={mutedTextColor}
                required
                rules={{
                  required: t('car.errors.landmark'),
                }}
              />
            </View>
          </FormRow>
        </View>

        {/* Section 4: Additional Notes */}
        <View
          style={[
            styles.section,
            { backgroundColor: surfaceColor, borderColor },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View
              style={[styles.sectionAccent, { backgroundColor: primaryColor }]}
            />
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              {t('car.additional_notes')}
            </Text>
          </View>

          <FormInput
            control={form.control}
            name="additionalNotes"
            placeholder={t('car.additional_notes_placeholder')}
            placeholderTextColor={mutedTextColor}
            type="textarea"
            rows={4}
          />
        </View>
      </View>

      {/* Fixed Bottom Post Button */}
      <View style={[styles.buttonContainer]}>
        <TouchableOpacity
          style={[
            styles.postButton,
            {
              backgroundColor:
                isPending || isResolvingLocation
                  ? primaryColor + '80'
                  : primaryColor,
              opacity: isPending || isResolvingLocation ? 0.7 : 1,
            },
          ]}
          onPress={handleSubmit}
          disabled={isPending || isResolvingLocation}
          activeOpacity={0.8}
        >
          {isPending || isResolvingLocation ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.postButtonText}>{t('car.post_car')}</Text>
          )}
        </TouchableOpacity>
      </View>
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
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  radioSection: {
    marginTop: 14,
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
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
    marginTop: 8,
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

export default CreateCarForm
