import { useCreateProductMutation } from '@/api/hooks';
import FormDatePicker from '@/components/FormElements/FormDatePicker';
import FormInput from '@/components/FormElements/FormInput';
import FormSelect from '@/components/FormElements/FormSelect';
import { OptionType } from '@/components/ui/combobox';
import { ECategoryType, ECurrencyType, EPaymentTimeType, EPaymentType, EProductType, EWorkCondition, EWorkerType, EWorkSalaryType, EWorkType } from '@/constants/enums';
import { useTranslations } from '@/hooks/use-translation';
import { useColor } from '@/hooks/useColor';
import { resolveEnum } from '@/utils/enumHelpers';
import { useRouter } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FormRow from '../FormElements/FormRow';
import ImageUploader, { DraftImageItem } from '../FormElements/ImageUploader';
import RadioButtonGroup, { RadioOption } from '../FormElements/RadioButtonGroup';
import MapModal from '../MapModal';


const CreateWorksForm = () => {
  const { t } = useTranslations();
  const primaryColor = useColor('primaryColor');
  const textColor = useColor('text');
  const router = useRouter();
  // const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>({ latitude: 41.311081, longitude: 69.240562 }); // Default to Tashkent for testing
  const [location, setLocation] = useState<{ latitude: number; longitude: number }>({ latitude: 41.311081, longitude: 69.240562 }); // Default to Tashkent for testing
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);

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
  ];

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
  ];

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
      value: 'per_task',
      label: t('work.per_task'),
    },
  ];

    // Ish turlari uchun options 
  const workTypeOptions: OptionType[] = [
    { value: 'full_time', label: t('work.full_time') },
    { value: 'part_time', label: t('work.part_time') },
    { value: 'contract',   label: t('work.contract') },
    { value: 'freelancer', label: t('work.freelancer') },
  ];

  // Payment time options for select
  const paymentTimeOptions: OptionType[] = [
    { value: 'immediately', label: t('work.payment_immediately') },
    { value: 'weekly', label: t('work.payment_weekly') },
    { value: 'monthly', label: t('work.payment_monthly') },
    { value: 'after_completion', label: t('work.payment_after_completion') },
  ];

  // Payment type options for select
  const paymentTypeOptions: OptionType[] = [
    { value: 'cash', label: t('work.payment_cash') },
    { value: 'bank_transfer', label: t('work.payment_bank_transfer') },
    { value: 'mobile_payment', label: t('work.payment_mobile_payment') },
  ];

  // Initialize form with react-hook-form
  const form = useForm({
    defaultValues: {
      images: [],
      workerType: workerTypeOptions[0].value,
      workType: workTypeOptions[0].value,
      workTitle: 'sample work title',
      workCondition: workConditionOptions[0].value,
      workingStartDateTime: new Date(), //undefined as Date | undefined ,
      salaryType: salaryTypeOptions[0].value,
      salaryAmount: '452000',
      currency:  ECurrencyType[ECurrencyType.UZS],
      paymentType: paymentTypeOptions[0].value,
      paymentTime: paymentTimeOptions[0].value,
      jobDescription: 'sample job description',
      employerName: 'sample employer name',
      workplaceInfo: 'sample workplace info',
      location: 'sample location',
      landmark: 'sample landmark',
      employerPhone: '+998901234567',
      webLinks: '',
    },
  });

  const { formState: { errors } } = form;

  const workerType = form.watch('workerType');
  const jobDeadline = form.watch('workCondition');
  const salaryType = form.watch('salaryType');
  const currency = form.watch('currency');

  const { mutate: createProduct, isPending } = useCreateProductMutation({
    onSuccess: () => {
      Alert.alert(
        t('post.success'),
        t('post.product_created_successfully'),
        [
          {
            text: t('common.ok'),
            onPress: () => router.back(),
          },
        ]
      );
      form.reset();
    },
    onError: (error: any) => {
      console.error('Error creating product:', error);
      const message = error?.response?.data?.message || error?.message || t('post.error_creating_product');
      Alert.alert(t('post.error'), message);
    },
  });

 

  const handleOpenMap = () => {
    setIsMapModalVisible(true);
  };

  const handleLocationSelect = (selectedLocation: { latitude: number; longitude: number }) => {
    setLocation(selectedLocation);
    setIsMapModalVisible(false);
  };


  const handleSubmit = form.handleSubmit((data) => {

    if (data.landmark.trim() === '') {
      Alert.alert(t('post.error'), t('post.please_enter_landmark'));
      return;
    }

    if (data.workingStartDateTime === undefined || isNaN(data.workingStartDateTime.getTime())) {
      Alert.alert(t('post.error'), t('post.please_select_job_period_date_time'));
      return;
    }

    // ── Enum resolution (lowercase form value → numeric enum) ──
    const workerTypeValue    = resolveEnum(EWorkerType,      data.workerType);
    const workTypeValue      = resolveEnum(EWorkType,        data.workType);
    const workConditionValue = resolveEnum(EWorkCondition,   data.workCondition);
    const salaryTypeValue    = resolveEnum(EWorkSalaryType,  data.salaryType);
    const paymentTypeValue   = resolveEnum(EPaymentType,     data.paymentType);
    const paymentTimeValue   = resolveEnum(EPaymentTimeType, data.paymentTime);
    const currencyValue      = resolveEnum(ECurrencyType,    data.currency) ?? ECurrencyType.UZS;

    // Validate all required enum fields
    if (workerTypeValue === undefined)    { Alert.alert(t('post.error'), t('work.errors.worker_type'));   return; }
    if (workTypeValue === undefined)      { Alert.alert(t('post.error'), t('work.errors.work_type'));     return; }
    if (workConditionValue === undefined) { Alert.alert(t('post.error'), t('work.errors.work_condition')); return; }
    if (salaryTypeValue === undefined)    { Alert.alert(t('post.error'), t('work.errors.salary_type'));   return; }
    if (paymentTypeValue === undefined)   { Alert.alert(t('post.error'), t('work.errors.payment_type'));  return; }
    if (paymentTimeValue === undefined)   { Alert.alert(t('post.error'), t('work.errors.payment_time'));  return; }

    const formData = new FormData();

    // Product type & category
    formData.append('product_type', EProductType.WORK.toString());
    formData.append('category_id',  ECategoryType.WORKS.toString());

    // Basic fields
    formData.append('title',          data.workTitle);
    formData.append('description',    data.jobDescription || '');
    formData.append('work_type',      workTypeValue.toString());
    formData.append('work_condition', workConditionValue.toString());

    // Work data
    formData.append('work_data.worker_type',           workerTypeValue.toString());
    formData.append('work_data.salary_type',           salaryTypeValue.toString());
    formData.append('work_data.salary_amount',         data.salaryAmount);
    formData.append('work_data.payment_type',          paymentTypeValue.toString());
    formData.append('work_data.payment_time',          paymentTimeValue.toString());
    formData.append('work_data.employer_information',  data.employerName || '');
    formData.append('work_data.workplace_information', data.workplaceInfo || '');
    formData.append('work_data.phone_number',          data.employerPhone || '');
    formData.append('work_data.work_ethics',           data.webLinks || '');

    // Working start date
    if (data.workingStartDateTime) {
      formData.append('work_data.working_start_date', data.workingStartDateTime.toISOString());
    }

    // Currency & price
    formData.append('currency_type', currencyValue.toString());
    formData.append(currencyValue === ECurrencyType.USD ? 'price_usd' : 'price_uzs', data.salaryAmount);
    formData.append('is_free', 'false');

    // Location
    formData.append('latitude',  location.latitude.toString());
    formData.append('longitude', location.longitude.toString());
    formData.append('moljal',    data.landmark || '');

    // Images
    const images: DraftImageItem[] = data.images;
    const draft_images = images.map((img, index) => ({
      draft_uuid:      img.draft_uuid,
      draft_image_url: img.draft_image_url,
      sort_order:      index,
    }));
    formData.append('images_json', JSON.stringify(draft_images));

    console.log('Work form data to submit:', formData);
    createProduct(formData);
  });

  return (
    <View style={styles.container}>
      <View style={styles.formContent}>
        {/* Section 1: Job Images (Optional) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {t('work.job_images')}
          </Text>
          <ImageUploader
            control={form.control}
            name="images"
            maxImages={5}
            rules={{
              validate: (value: string[]) => value.length > 0 || t('work.errors.images'),
            }}
          />
        </View>

        {/* Section 2: Worker Type */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {t('work.worker_type')}
          </Text>
          <RadioButtonGroup
            control={form.control}
            name="workerType"
            options={workerTypeOptions}
          />
        </View>

        {/* Section 3: Job Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {t('work.job_information')}
          </Text>

          <FormInput
            control={form.control}
            name="workTitle"
            label={t('work.job_title')}
            placeholder={t('work.job_title_placeholder')}
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
            <Text style={[styles.radioLabel, { color: textColor }]}>
              {t('work.job_deadlines')}
            </Text>
            <RadioButtonGroup
              control={form.control}
              name="workCondition"
              options={workConditionOptions}
            />
          </View>

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
        </View>

        {/* Section 4: Salary Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {t('work.salary_details')}
          </Text>

          <View style={styles.radioSection}>
            <Text style={[styles.radioLabel, { color: textColor }]}>
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
                    backgroundColor: currency === 'UZS' ? primaryColor : 'transparent',
                    borderColor: primaryColor,
                  }
                ]}
                onPress={() => form.setValue('currency', 'UZS')}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.currencyButtonText,
                  { color: currency === 'UZS' ? '#fff' : primaryColor }
                ]}>UZS</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.currencyButton,
                  {
                    backgroundColor: currency === 'USD' ? primaryColor : 'transparent',
                    borderColor: primaryColor,
                  }
                ]}
                onPress={() => form.setValue('currency', 'USD')}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.currencyButtonText,
                  { color: currency === 'USD' ? '#fff' : primaryColor }
                ]}>USD</Text>
              </TouchableOpacity>
            </View>
          </View>

          <FormSelect
            control={form.control}
            name="paymentTime"
            label={t('work.payment_time')}
            placeholder={t('work.payment_time_placeholder')}
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
            options={paymentTypeOptions}
            required
            rules={{
              required: t('work.errors.payment_type'),
            }}
          />

        </View>

        {/* Section 5: Job Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {t('work.job_description')}
          </Text>

          <FormInput
            control={form.control}
            name="jobDescription"
            placeholder={t('work.job_description_placeholder')}
            type="textarea"
            rows={5}
            required
            rules={{
              required: t('work.errors.job_description'),
            }}
          />
        </View>

        {/* Section 6: Employer Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {t('work.employer_information')}
          </Text>

          {/* Ish beruvchi nomi yoki kompaniya nomi */}
          <FormInput
            control={form.control}
            name="employerName"
            label={t('work.employer_name')}
            placeholder={t('work.employer_name_placeholder')}
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
              required
              keyboardType="phone-pad"
              rules={{
                required: t('work.errors.employer_phone'),
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
                required
                rules={{
                  required: t('work.errors.landmark'),
                }}
              />
            </View>
            <TouchableOpacity
              style={[
                styles.mapButton,
                {
                  borderColor: primaryColor,
                  backgroundColor: primaryColor,
                }
              ]}
              onPress={handleOpenMap}
              activeOpacity={0.7}
            >
              <MapPin size={20} color="#fff" strokeWidth={2} />
            </TouchableOpacity>
          </FormRow>

          <FormInput
            control={form.control}
            name="workplaceInfo"
            label={t('work.workplace_info')}
            placeholder={t('work.workplace_info_placeholder')}
            required
            rules={{
              required: t('work.errors.workplace_info'),
            }}
          />

          {/* Telegram yoki boshqa ijtimoiy tarmoqlardagi havolalar, ixtiyoriy */}
          <View style={styles.socialMediaInputWrapper}>
            <FormInput
              control={form.control}
              name="webLinks"
              label={t('work.web_links')}
              placeholder={t('work.web_links_placeholder')}
              type="textarea"
              rows={3}
            />
          </View>
        </View>
      </View>

      {/* Fixed Bottom Post Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.postButton,
            {
              backgroundColor: isPending ? primaryColor + '80' : primaryColor,
              opacity: isPending ? 0.7 : 1,
            }
          ]}
          onPress={handleSubmit}
          disabled={isPending}
          activeOpacity={0.8}
        >
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
              <Text style={styles.postButtonText}>{t('work.post_job')}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Map Modal */}
      <MapModal
        visible={isMapModalVisible}
        mode="SELECT"
        initialLocation={location || undefined}
        onClose={() => setIsMapModalVisible(false)}
        onLocationSelect={handleLocationSelect}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formContent: {
    paddingBottom: 100, // Space for fixed button
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  radioSection: {
    marginTop: 16,
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    marginBottom: 16,
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
});

export default CreateWorksForm;
