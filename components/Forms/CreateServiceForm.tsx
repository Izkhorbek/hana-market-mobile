import { useCreateServiceMutation } from '@/api/hooks'
import SuccessPostModal from '@/components/guidance/SuccessPostModal'
import FormInput from '@/components/FormElements/FormInput'
import FormSelect from '@/components/FormElements/FormSelect'
import { OptionType } from '@/components/ui/combobox'
import {
  ECurrencyType,
  EServiceCategory,
  EServicePriceType,
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

const CreateServiceForm = () => {
  const { t } = useTranslations()
  const primaryColor = useColor('primaryColor')
  const textColor = useColor('text')
  const subTextColor = useColor('subText')
  const surfaceColor = useColor('background')
  const sectionTintColor = useColor('profileBackground')
  const borderColor = useColor('border')
  const mutedTextColor = useColor('textMuted')

  const router = useRouter()
  const [isResolvingLocation, setIsResolvingLocation] = useState(false)
  const [successVisible, setSuccessVisible] = useState(false)
  const isSubmittingRef = useRef(false)
  // Guards against setState after unmount if the user leaves mid-create-request.
  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Values are lowercase enum names so resolveEnum() maps them to the numeric enum.
  const categoryOptions: OptionType[] = [
    { value: 'plumber', label: t('service.plumber') },
    { value: 'electrician', label: t('service.electrician') },
    { value: 'repair', label: t('service.repair') },
    { value: 'cleaning', label: t('service.cleaning') },
    { value: 'moving', label: t('service.moving') },
    { value: 'tutor', label: t('service.tutor') },
    { value: 'gardener', label: t('service.gardener') },
    { value: 'appliance', label: t('service.appliance') },
    { value: 'beauty', label: t('service.beauty') },
    { value: 'other', label: t('service.other') },
  ]

  const priceTypeOptions: RadioOption[] = [
    { value: 'hourly', label: t('service.hourly') },
    { value: 'per_job', label: t('service.per_job') },
    { value: 'negotiable', label: t('service.negotiable') },
  ]

  const form = useForm({
    defaultValues: {
      images: [],
      category: categoryOptions[0].value,
      title: '',
      description: '',
      priceType: priceTypeOptions[0].value,
      priceAmount: '',
      currency: ECurrencyType[ECurrencyType.UZS],
      phone: '',
      availability: '',
      landmark: '',
    },
  })

  const currency = form.watch('currency')
  const priceType = form.watch('priceType')
  const isNegotiable = priceType === 'negotiable'

  const { mutate: createService, isPending } = useCreateServiceMutation({
    onSuccess: () => {
      if (!isMountedRef.current) return
      form.reset()
      setSuccessVisible(true)
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

      // ── Enum resolution (lowercase form value → numeric enum) ──
      const categoryValue = resolveEnum(EServiceCategory, data.category)
      const priceTypeValue = resolveEnum(EServicePriceType, data.priceType)
      const currencyValue =
        resolveEnum(ECurrencyType, data.currency) ?? ECurrencyType.UZS

      if (categoryValue === undefined) {
        Alert.alert(t('post.error'), t('service.errors.category'))
        return
      }
      if (priceTypeValue === undefined) {
        Alert.alert(t('post.error'), t('service.errors.price_type'))
        return
      }

      const formData = new FormData()

      formData.append('category', categoryValue.toString())
      formData.append('title', data.title)
      formData.append('description', data.description || '')
      formData.append('price_type', priceTypeValue.toString())

      // Price is optional when the provider chose "negotiable".
      if (!isNegotiable && data.priceAmount) {
        formData.append('currency_type', currencyValue.toString())
        formData.append(
          currencyValue === ECurrencyType.USD ? 'price_usd' : 'price_uzs',
          data.priceAmount,
        )
      }

      // Public contact number, normalized to E.164 (+998...).
      const normalizedPhone = (data.phone || '').replace(/\D/g, '')
      const phoneE164 = normalizedPhone
        ? `+998${normalizedPhone.replace(/^998/, '')}`
        : ''
      formData.append('phone_number', phoneE164)

      formData.append('availability', data.availability || '')

      // Location (auto-resolved on Post)
      formData.append('latitude', coords.latitude.toString())
      formData.append('longitude', coords.longitude.toString())
      formData.append('moljal', data.landmark || '')

      // Images (draft uuids from the shared product draft-upload endpoint)
      const images: DraftImageItem[] = data.images
      const draft_images = images.map((img, index) => ({
        draft_uuid: img.draft_uuid,
        draft_image_url: img.draft_image_url,
        sort_order: index,
      }))
      formData.append('images_json', JSON.stringify(draft_images))

      createService(formData)
    } finally {
      setIsResolvingLocation(false)
      isSubmittingRef.current = false
    }
  }, onInvalid)

  return (
    <View style={styles.container}>
      <View style={styles.formContent}>
        {/* Section 1: Photos (Optional) */}
        <View style={[styles.section, { backgroundColor: sectionTintColor, borderColor }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionAccent, { backgroundColor: primaryColor }]} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              {t('service.service_images')}
            </Text>
          </View>
          <ImageUploader control={form.control} name="images" maxImages={5} />
        </View>

        {/* Section 2: Service Information */}
        <View style={[styles.section, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionAccent, { backgroundColor: primaryColor }]} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              {t('service.service_information')}
            </Text>
          </View>

          <FormSelect
            control={form.control}
            name="category"
            label={t('service.category')}
            placeholder={t('service.category_select')}
            options={categoryOptions}
            required
            rules={{ required: t('service.errors.category') }}
          />

          <FormInput
            control={form.control}
            name="title"
            label={t('service.title')}
            placeholder={t('service.title_placeholder')}
            placeholderTextColor={mutedTextColor}
            required
            rules={{ required: t('service.errors.title') }}
          />

          <FormInput
            control={form.control}
            name="description"
            label={t('service.description')}
            placeholder={t('service.description_placeholder')}
            placeholderTextColor={mutedTextColor}
            type="textarea"
            rows={5}
            required
            rules={{ required: t('service.errors.description') }}
          />
        </View>

        {/* Section 3: Price */}
        <View style={[styles.section, { backgroundColor: sectionTintColor, borderColor }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionAccent, { backgroundColor: primaryColor }]} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              {t('service.price_details')}
            </Text>
          </View>

          <View style={styles.radioSection}>
            <Text style={[styles.radioLabel, { color: subTextColor }]}>
              {t('service.price_type')}
            </Text>
            <RadioButtonGroup
              control={form.control}
              name="priceType"
              options={priceTypeOptions}
            />
          </View>

          {!isNegotiable && (
            <View style={styles.priceInputContainer}>
              <View style={styles.priceInputWrapper}>
                <FormInput
                  control={form.control}
                  name="priceAmount"
                  label={t('service.price_amount')}
                  placeholder={t('service.price_amount_placeholder')}
                  placeholderTextColor={mutedTextColor}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.currencyButtons}>
                <TouchableOpacity
                  style={[
                    styles.currencyButton,
                    {
                      backgroundColor: currency === 'UZS' ? primaryColor : 'transparent',
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
                    UZS
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.currencyButton,
                    {
                      backgroundColor: currency === 'USD' ? primaryColor : 'transparent',
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
            </View>
          )}
        </View>

        {/* Section 4: Contact */}
        <View style={[styles.section, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionAccent, { backgroundColor: primaryColor }]} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              {t('service.contact_information')}
            </Text>
          </View>

          <View style={styles.phoneInputWrapper}>
            <FormInput
              control={form.control}
              name="phone"
              label={t('service.phone_number')}
              placeholder={t('service.phone_number_placeholder')}
              placeholderTextColor={mutedTextColor}
              required
              keyboardType="phone-pad"
              maxLength={13}
              rules={{
                required: t('service.errors.phone_number'),
                validate: (value: string) => {
                  const digits = (value || '').replace(/\D/g, '').replace(/^998/, '')
                  return (
                    /^(33|50|55|66|67|7[0135789]|88|9[0134578])\d{7}$/.test(digits) ||
                    t('service.errors.phone_invalid')
                  )
                },
              }}
            />
          </View>

          <FormInput
            control={form.control}
            name="availability"
            label={t('service.availability')}
            placeholder={t('service.availability_placeholder')}
            placeholderTextColor={mutedTextColor}
          />

          <FormRow>
            <View style={styles.locationInputWrapper}>
              <FormInput
                control={form.control}
                name="landmark"
                label={t('service.landmark')}
                placeholder={t('service.landmark_placeholder')}
                placeholderTextColor={mutedTextColor}
                required
                rules={{ required: t('service.errors.landmark') }}
              />
            </View>
          </FormRow>
        </View>
      </View>

      {/* Fixed Bottom Post Button */}
      <View style={[styles.buttonContainer]}>
        <TouchableOpacity
          style={[
            styles.postButton,
            {
              backgroundColor:
                isPending || isResolvingLocation ? primaryColor + '80' : primaryColor,
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
            <Text style={styles.postButtonText}>{t('service.post_service')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <SuccessPostModal
        visible={successVisible}
        // No service detail screen yet — only the "Go home / close" action is shown.
        productId={null}
        onClose={() => {
          setSuccessVisible(false)
          router.back()
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
  radioSection: {
    marginTop: 14,
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginVertical: 10,
  },
  priceInputWrapper: {
    flex: 1,
    marginBottom: 0,
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
  phoneInputWrapper: {
    marginTop: 10,
  },
  locationInputWrapper: {
    flex: 1,
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

export default CreateServiceForm
