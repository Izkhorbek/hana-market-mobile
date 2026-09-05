import { useUpdateServiceMutation } from '@/api/hooks'
import FormInput from '@/components/FormElements/FormInput'
import FormSelect from '@/components/FormElements/FormSelect'
import FormRow from '@/components/FormElements/FormRow'
import RadioButtonGroup, { RadioOption } from '@/components/FormElements/RadioButtonGroup'
import { OptionType } from '@/components/ui/combobox'
import { ECurrencyType, EServiceCategory, EServicePriceType } from '@/constants/enums'
import { useTranslations } from '@/hooks/use-translation'
import { useColor } from '@/hooks/useColor'
import type { ServiceUpdateRequest, SingleServiceDto } from '@/types'
import { parseApiError } from '@/utils/apiError'
import { resolveEnum } from '@/utils/enumHelpers'
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

interface EditServiceFormProps {
  service: SingleServiceDto
}

/** Numeric enum value → the lowercase form value the selects use. */
const enumToFormValue = (enumObj: object, value: number | undefined): string => {
  const name = (enumObj as Record<number, string | undefined>)[value as number]
  return name ? name.toLowerCase() : ''
}

/**
 * The detail response formats `price` for display ("150 000 so'm"), and there is
 * no service equivalent of `GET /product/{id}/edit` that returns the raw amount.
 * Pulling the digits back out is the only way to pre-fill the field; a value we
 * cannot read leaves it empty, and an untouched empty field is simply not sent.
 */
const parseDisplayPrice = (price: string | null | undefined): string => {
  const digits = (price ?? '').replace(/\D/g, '')
  return digits.length > 0 ? digits : ''
}

/**
 * Edit an existing service.
 *
 * Deliberately narrower than the create form: `PUT /api/service/{id}` accepts
 * neither images nor coordinates, so those two sections are absent rather than
 * present-and-ignored.
 */
const EditServiceForm: React.FC<EditServiceFormProps> = ({ service }) => {
  const { t } = useTranslations()
  const primaryColor = useColor('primaryColor')
  const textColor = useColor('text')
  const subTextColor = useColor('subText')
  const surfaceColor = useColor('background')
  const sectionTintColor = useColor('profileBackground')
  const borderColor = useColor('border')
  const mutedTextColor = useColor('textMuted')

  const router = useRouter()
  const isSubmittingRef = useRef(false)
  const [isSaved, setIsSaved] = useState(false)

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
      category: enumToFormValue(EServiceCategory, service.category) || 'other',
      title: service.title ?? '',
      description: service.description ?? '',
      priceType: enumToFormValue(EServicePriceType, service.price_type) || 'negotiable',
      priceAmount: parseDisplayPrice(service.price),
      currency: service.currency_type === ECurrencyType.USD ? 'USD' : 'UZS',
      // The backend stores E.164; the input works in the local 9-digit form.
      phone: (service.phone_number ?? '').replace(/\D/g, '').replace(/^998/, ''),
      availability: service.availability ?? '',
      landmark: service.moljal ?? '',
    },
  })

  const currency = form.watch('currency')
  const priceType = form.watch('priceType')
  const isNegotiable = priceType === 'negotiable'

  const { mutate: updateService, isPending } = useUpdateServiceMutation({
    onSuccess: () => {
      setIsSaved(true)
      Alert.alert(t('edit_profile.success'), t('my_services.update_success'), [
        { text: t('common.ok'), onPress: () => router.back() },
      ])
    },
    onError: (error: any) => {
      const message = parseApiError(error, t('my_services.update_error'))
      Alert.alert(t('post.error'), message)
    },
  })

  const onInvalid = (formErrors: Record<string, any>) => {
    const messages = Object.values(formErrors)
      .map((err) => `• ${err?.message}`)
      .filter(Boolean)
      .join('\n')
    if (messages) Alert.alert(t('post.error'), messages)
  }

  const handleSubmit = form.handleSubmit((data) => {
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true

    try {
      const categoryValue = resolveEnum(EServiceCategory, data.category)
      const priceTypeValue = resolveEnum(EServicePriceType, data.priceType)
      const currencyValue = resolveEnum(ECurrencyType, data.currency) ?? ECurrencyType.UZS

      if (categoryValue === undefined) {
        Alert.alert(t('post.error'), t('service.errors.category'))
        return
      }
      if (priceTypeValue === undefined) {
        Alert.alert(t('post.error'), t('service.errors.price_type'))
        return
      }

      const normalizedPhone = (data.phone || '').replace(/\D/g, '')
      const payload: ServiceUpdateRequest = {
        category: categoryValue,
        title: data.title,
        description: data.description || '',
        price_type: priceTypeValue,
        phone_number: normalizedPhone ? `+998${normalizedPhone.replace(/^998/, '')}` : '',
        availability: data.availability || '',
        moljal: data.landmark || '',
      }

      // Price only travels when there is one to send — "negotiable" has none,
      // and an amount we could not pre-fill is left for the provider to retype.
      if (!isNegotiable && data.priceAmount) {
        payload.currency_type = currencyValue
        const amount = Number(data.priceAmount)
        if (currencyValue === ECurrencyType.USD) payload.price_usd = amount
        else payload.price_uzs = amount
      }

      updateService({ id: service.id, data: payload })
    } finally {
      isSubmittingRef.current = false
    }
  }, onInvalid)

  const busy = isPending || isSaved

  return (
    <View style={styles.container}>
      <View style={styles.formContent}>
        {/* Service information */}
        <View style={[styles.section, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionAccent, { backgroundColor: primaryColor }]} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              {t('service.service_information')}
            </Text>
          </View>

          <FormSelect
            control={form.control}
            name='category'
            label={t('service.category')}
            placeholder={t('service.category_select')}
            options={categoryOptions}
            required
            rules={{ required: t('service.errors.category') }}
          />

          <FormInput
            control={form.control}
            name='title'
            label={t('service.title')}
            placeholder={t('service.title_placeholder')}
            placeholderTextColor={mutedTextColor}
            required
            rules={{ required: t('service.errors.title') }}
          />

          <FormInput
            control={form.control}
            name='description'
            label={t('service.description')}
            placeholder={t('service.description_placeholder')}
            placeholderTextColor={mutedTextColor}
            type='textarea'
            rows={5}
            required
            rules={{ required: t('service.errors.description') }}
          />
        </View>

        {/* Price */}
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
              name='priceType'
              options={priceTypeOptions}
            />
          </View>

          {!isNegotiable && (
            <View style={styles.priceInputContainer}>
              <View style={styles.priceInputWrapper}>
                <FormInput
                  control={form.control}
                  name='priceAmount'
                  label={t('service.price_amount')}
                  placeholder={t('service.price_amount_placeholder')}
                  placeholderTextColor={mutedTextColor}
                  keyboardType='numeric'
                />
              </View>
              <View style={styles.currencyButtons}>
                {(['UZS', 'USD'] as const).map((code) => (
                  <TouchableOpacity
                    key={code}
                    style={[
                      styles.currencyButton,
                      {
                        backgroundColor: currency === code ? primaryColor : 'transparent',
                        borderColor: primaryColor,
                      },
                    ]}
                    onPress={() => form.setValue('currency', code)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.currencyButtonText,
                        { color: currency === code ? '#fff' : primaryColor },
                      ]}
                    >
                      {code}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Contact */}
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
              name='phone'
              label={t('service.phone_number')}
              placeholder={t('service.phone_number_placeholder')}
              placeholderTextColor={mutedTextColor}
              required
              keyboardType='phone-pad'
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
            name='availability'
            label={t('service.availability')}
            placeholder={t('service.availability_placeholder')}
            placeholderTextColor={mutedTextColor}
          />

          <FormRow>
            <View style={styles.locationInputWrapper}>
              <FormInput
                control={form.control}
                name='landmark'
                label={t('service.landmark')}
                placeholder={t('service.landmark_placeholder')}
                placeholderTextColor={mutedTextColor}
                required
                rules={{ required: t('service.errors.landmark') }}
              />
            </View>
          </FormRow>

          {/* Photos and the map pin are create-time only — PUT accepts neither. */}
          <Text style={[styles.note, { color: mutedTextColor }]}>
            {t('my_services.edit_note')}
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: busy ? primaryColor + '80' : primaryColor, opacity: busy ? 0.7 : 1 },
          ]}
          onPress={handleSubmit}
          disabled={busy}
          activeOpacity={0.8}
        >
          {busy ? (
            <ActivityIndicator color='#fff' />
          ) : (
            <Text style={styles.saveButtonText}>{t('my_services.save')}</Text>
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
    padding: 16,
    gap: 16,
  },
  section: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionAccent: {
    width: 4,
    height: 18,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  radioSection: {
    gap: 8,
  },
  radioLabel: {
    fontSize: 14,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  priceInputWrapper: {
    flex: 1,
  },
  currencyButtons: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 6,
  },
  currencyButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  currencyButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  phoneInputWrapper: {
    flex: 1,
  },
  locationInputWrapper: {
    flex: 1,
  },
  note: {
    fontSize: 12,
    lineHeight: 17,
  },
  buttonContainer: {
    padding: 16,
    paddingBottom: 28,
  },
  saveButton: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
})

export default EditServiceForm
