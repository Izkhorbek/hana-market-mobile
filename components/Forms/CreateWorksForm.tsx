import { useCreateProductMutation } from '@/api/hooks'
import SuccessPostModal from '@/components/guidance/SuccessPostModal'
import FormInput from '@/components/FormElements/FormInput'
import FormSelect from '@/components/FormElements/FormSelect'
import { OptionType } from '@/components/ui/combobox'
import {
  ECategoryType,
  ECurrencyType,
  EProductType,
  EWorkCondition,
  EWorkerType,
  EWorkSalaryType,
  EWorkType,
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
import FormRow from '../FormElements/FormRow'
import ImageUploader, { DraftImageItem } from '../FormElements/ImageUploader'
import RadioButtonGroup, {
  RadioOption,
} from '../FormElements/RadioButtonGroup'

const CreateWorksForm = () => {
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
  const [createdProductId, setCreatedProductId] = useState<number | null>(null)
  const isSubmittingRef = useRef(false)

  // Options for radio buttons and selects
  const workerTypeOptions: RadioOption[] = [
    {
      value: 'employee',
      label: t('work.employee'),
    },
    {
      value: 'assistant',
      label: t('work.assistant'),
    },
    {
      value: 'teacher',
      label: t('work.teacher'),
    },
  ]

  const workConditionOptions: RadioOption[] = [
    {
      value: 'temporary',
      label: t('work.temporary'),
    },
    {
      value: 'one_month',
      label: t('work.one_month'),
    },
    {
      value: 'long_term',
      label: t('work.long_term'),
    },
  ]

  const salaryTypeOptions: RadioOption[] = [
    {
      value: 'hourly',
      label: t('work.hourly'),
    },
    {
      value: 'daily',
      label: t('work.daily'),
    },
    {
      value: 'monthly',
      label: t('work.monthly'),
    },
  ]

  // Ish turlari uchun options
  const workTypeOptions: OptionType[] = [
    { value: 'full_time', label: t('work.full_time') },
    { value: 'part_time', label: t('work.part_time') },
    { value: 'contract', label: t('work.contract') },
    { value: 'freelancer', label: t('work.freelancer') },
  ]

  // const paymentTimeOptions: OptionType[] = [
  //   { value: 'immediately', label: t('work.payment_immediately') },
  //   { value: 'weekly', label: t('work.payment_weekly') },
  //   { value: 'monthly', label: t('work.payment_monthly') },
  //   { value: 'after_completion', label: t('work.payment_after_completion') },
  // ];

  // const paymentTypeOptions: OptionType[] = [
  //   { value: 'cash', label: t('work.payment_cash') },
  //   { value: 'bank_transfer', label: t('work.payment_bank_transfer') },
  //   { value: 'mobile_payment', label: t('work.payment_mobile_payment') },
  // ];

  // Initialize form with react-hook-form
  const form = useForm({
    defaultValues: {
      images: [],
      workerType: workerTypeOptions[0].value,
      workType: workTypeOptions[0].value,
      workTitle: '',
      workCondition: workConditionOptions[0].value,
      salaryType: salaryTypeOptions[0].value,
      salaryAmount: '',
      currency: ECurrencyType[ECurrencyType.UZS],
      jobDescription: '',
      employerName: '',
      employerPhone: '',
      landmark: '',
    },
  })

  const currency = form.watch('currency')

  const { mutate: createProduct, isPending } = useCreateProductMutation({
    onSuccess: (response) => {
      // Success modal replaces the plain alert. Product id is shown if the API returns one.
      const createdId =
        (response?.data?.data as { product_id?: number } | undefined)?.product_id ?? null
      form.reset()
      setCreatedProductId(typeof createdId === 'number' && createdId > 0 ? createdId : null)
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
    const workerTypeValue = resolveEnum(EWorkerType, data.workerType)
    const workTypeValue = resolveEnum(EWorkType, data.workType)
    const workConditionValue = resolveEnum(EWorkCondition, data.workCondition)
    const salaryTypeValue = resolveEnum(EWorkSalaryType, data.salaryType)
    const currencyValue =
      resolveEnum(ECurrencyType, data.currency) ?? ECurrencyType.UZS

    // Validate all required enum fields
    if (workerTypeValue === undefined) {
      Alert.alert(t('post.error'), t('work.errors.worker_type'))
      return
    }
    if (workTypeValue === undefined) {
      Alert.alert(t('post.error'), t('work.errors.work_type'))
      return
    }
    if (workConditionValue === undefined) {
      Alert.alert(t('post.error'), t('work.errors.work_condition'))
      return
    }
    if (salaryTypeValue === undefined) {
      Alert.alert(t('post.error'), t('work.errors.salary_type'))
      return
    }
    const formData = new FormData()

    // Product type & category
    formData.append('product_type', EProductType.WORK.toString())
    formData.append('category_id', ECategoryType.WORKS.toString())

    // Basic fields
    formData.append('title', data.workTitle)
    formData.append('description', data.jobDescription || '')
    
    const currencyType =
      data.currency === 'USD' ? ECurrencyType.USD : ECurrencyType.UZS
    formData.append('currency_type', currencyType.toString())

    const priceField = data.currency === 'USD' ? 'price_usd' : 'price_uzs'
    formData.append(priceField, data.salaryAmount)

    formData.append('work_type', workTypeValue.toString())
    formData.append('work_condition', workConditionValue.toString())

    // Work data
    formData.append('work_data.worker_type', workerTypeValue.toString())
    formData.append('work_data.salary_type', salaryTypeValue.toString())
    formData.append('work_data.salary_amount', data.salaryAmount)
    const normalizedPhone = (data.employerPhone || '').replace(/\D/g, '')
    const phoneE164 = normalizedPhone
      ? `+998${normalizedPhone.replace(/^998/, '')}`
      : ''
    formData.append('work_data.phone_number', phoneE164)
    formData.append('work_data.employer_information', data.employerName || '')

    // Currency & price
    formData.append('currency_type', currencyValue.toString())
    formData.append(
      currencyValue === ECurrencyType.USD ? 'price_usd' : 'price_uzs',
      data.salaryAmount,
    )
    formData.append('is_free', 'false')

    // Location (auto-resolved on Post)
    formData.append('latitude', coords.latitude.toString())
    formData.append('longitude', coords.longitude.toString())
    formData.append('moljal', data.landmark || '')

    // Images
    const images: DraftImageItem[] = data.images
    const draft_images = images.map((img, index) => ({
      draft_uuid: img.draft_uuid,
      draft_image_url: img.draft_image_url,
      sort_order: index,
    }))
    formData.append('images_json', JSON.stringify(draft_images))
    createProduct(formData)
    } finally {
      setIsResolvingLocation(false)
      isSubmittingRef.current = false
    }
  }, onInvalid)

  return (
    <View style={styles.container}>
      <View style={styles.formContent}>
        {/* Section 1: Job Images (Optional) */}
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
              {t('work.job_images')}
            </Text>
          </View>
          <ImageUploader
            control={form.control}
            name="images"
            maxImages={5}
            rules={{
              validate: (value: string[]) =>
                value.length > 0 || t('work.errors.images'),
            }}
          />
        </View>

        {/* Section 2: Worker Type */}
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
              {t('work.worker_type')}
            </Text>
          </View>
          <RadioButtonGroup
            control={form.control}
            name="workerType"
            options={workerTypeOptions}
          />
        </View>

        {/* Section 3: Job Information */}
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
              {t('work.job_information')}
            </Text>
          </View>

          <FormInput
            control={form.control}
            name="workTitle"
            label={t('work.job_title')}
            placeholder={t('work.job_title_placeholder')}
            placeholderTextColor={mutedTextColor}
            required
            rules={{
              required: t('work.errors.job_title'),
            }}
          />

          <FormSelect
            control={form.control}
            name="workType"
            label={t('work.job_type')}
            placeholder={t('work.job_type_select')}
            options={workTypeOptions}
            required
            rules={{
              required: t('work.errors.job_type'),
            }}
          />

          <View style={styles.radioSection}>
            <Text style={[styles.radioLabel, { color: subTextColor }]}>
              {t('work.job_deadlines')}
            </Text>
            <RadioButtonGroup
              control={form.control}
              name="workCondition"
              options={workConditionOptions}
            />
          </View>

          {/*
          <FormDatePicker
            control={form.control}
            name='workingStartDateTime'
            mode="datetime"
            label={t('work.job_period_date_time')}
            placeholder={t('work.job_period_date_time_placeholder')}
            minimumDate={new Date()}
            required
            rules={{
              required: t('work.errors.job_period_date_time'),
            }}
          />
          */}
        </View>

        {/* Section 4: Salary Details */}
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
              {t('work.salary_details')}
            </Text>
          </View>

          <View style={styles.radioSection}>
            <Text style={[styles.radioLabel, { color: subTextColor }]}>
              {t('work.salary_type')}
            </Text>
            <RadioButtonGroup
              control={form.control}
              name="salaryType"
              options={salaryTypeOptions}
            />
          </View>

          <View style={styles.priceInputContainer}>
            <View style={styles.priceInputWrapper}>
              <FormInput
                control={form.control}
                name="salaryAmount"
                label={t('work.salary_amount')}
                placeholder={t('work.salary_amount_placeholder')}
                placeholderTextColor={mutedTextColor}
                keyboardType="numeric"
                required
                rules={{
                  required: t('work.errors.salary_amount'),
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
                  UZS
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
          </View>

          {/*
          <FormSelect
            control={form.control}
            name="paymentTime"
            label={t('work.payment_time')}
            placeholder={t('work.payment_time_placeholder')}
            placeholderTextColor={mutedTextColor}
            options={paymentTimeOptions}
            required
            rules={{
              required: t('work.errors.payment_time'),
            }}
          />

          <FormSelect
            control={form.control}
            name="paymentType"
            label={t('work.payment_type')}
            placeholder={t('work.payment_type_placeholder')}
            placeholderTextColor={mutedTextColor}
            options={paymentTypeOptions}
            required
            rules={{
              required: t('work.errors.payment_type'),
            }}
          />
          */}
        </View>

        {/* Section 5: Job Description */}
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
              {t('work.job_description')}
            </Text>
          </View>

          <FormInput
            control={form.control}
            name="jobDescription"
            placeholder={t('work.job_description_placeholder')}
            placeholderTextColor={mutedTextColor}
            type="textarea"
            rows={5}
            required
            rules={{
              required: t('work.errors.job_description'),
            }}
          />
        </View>

        {/* Section 6: Employer Information */}
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
              {t('work.employer_information')}
            </Text>
          </View>

          {/* Ish beruvchi nomi yoki kompaniya nomi */}
          <FormInput
            control={form.control}
            name="employerName"
            label={t('work.employer_name')}
            placeholder={t('work.employer_name_placeholder')}
            placeholderTextColor={mutedTextColor}
            required
            rules={{
              required: t('work.errors.employer_name'),
            }}
          />

          {/* Ish beruvchining telefon raqami */}
          <View style={styles.phoneInputWrapper}>
            <FormInput
              control={form.control}
              name="employerPhone"
              label={t('work.employer_phone')}
              placeholder={t('work.employer_phone_placeholder')}
              placeholderTextColor={mutedTextColor}
              required
              keyboardType="phone-pad"
              maxLength={13}
              rules={{
                required: t('work.errors.employer_phone'),
                validate: (value: string) => {
                  const digits = (value || '').replace(/\D/g, '').replace(/^998/, '')
                  return (
                    /^(33|50|55|66|67|7[0135789]|88|9[0134578])\d{7}$/.test(digits) ||
                    t('work.errors.employer_phone_invalid')
                  )
                },
              }}
            />
          </View>
          <FormRow>
            <View style={styles.locationInputWrapper}>
              <FormInput
                control={form.control}
                name="landmark"
                label={t('work.landmark')}
                placeholder={t('work.landmark_placeholder')}
                placeholderTextColor={mutedTextColor}
                required
                rules={{
                  required: t('work.errors.landmark'),
                }}
              />
            </View>
          </FormRow>

          {/*
          <FormInput
            control={form.control}
            name="workplaceInfo"
            label={t('work.workplace_info')}
            placeholder={t('work.workplace_info_placeholder')}
            placeholderTextColor={mutedTextColor}
            required
            rules={{
              required: t('work.errors.workplace_info'),
            }}
          />
          */}

          {/* Telegram yoki boshqa ijtimoiy tarmoqlardagi havolalar, ixtiyoriy */}
          {/*
          <View style={styles.socialMediaInputWrapper}>
            <FormInput
              control={form.control}
              name="webLinks"
              label={t('work.web_links')}
              placeholder={t('work.web_links_placeholder')}
              placeholderTextColor={mutedTextColor}
              type="textarea"
              rows={3}
            />
          </View>
          */}
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
            <Text style={styles.postButtonText}>{t('work.post_job')}</Text>
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
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  locationInputWrapper: {
    flex: 1,
  },
  socialMediaInputWrapper: {
    marginTop: 10,
  },
  mapButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
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

export default CreateWorksForm
