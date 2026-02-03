import FormDatePicker from '@/components/FormElements/FormDatePicker';
import FormInput from '@/components/FormElements/FormInput';
import FormSelect from '@/components/FormElements/FormSelect';
import { OptionType } from '@/components/ui/combobox';
import { useTranslations } from '@/hooks/use-translation';
import { useColor } from '@/hooks/useColor';
import { MapPin } from 'lucide-react-native';
import React from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FormRow from '../FormElements/FormRow';
import ImageUploader from '../FormElements/ImageUploader';
import RadioButtonGroup, { RadioOption } from '../FormElements/RadioButtonGroup';


const CreateWorksForm = () => {
  const { t } = useTranslations();
  const primaryColor = useColor('primaryColor');
  const textColor = useColor('text');

  const form = useForm({
    defaultValues: {
      images: [],
      workerType: 'working_together',
      jobTitle: '',
      jobType: '',
      jobDeadline: 'temporary',
      meetingDateTime: undefined as Date | undefined,
      salaryType: 'hourly',
      salaryAmount: '',
      currency: 'UZS',
      paymentTime: '',
      jobDescription: '',
      employerName: '',
      workplaceInfo: '',
      location: '',
      phoneNumber: '',
      webLinks: '',
    },
  });

  const { formState: { errors } } = form;

  const workerType = form.watch('workerType');
  const jobDeadline = form.watch('jobDeadline');
  const salaryType = form.watch('salaryType');
  const currency = form.watch('currency');

  const workerTypeOptions: RadioOption[] = [
    {
      value: 'working_together',
      label: t('work.working_together'),
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

  const jobDeadlineOptions: RadioOption[] = [
    {
      value: 'temporary',
      label: t('work.temporary'),
    },
    {
      value: 'month',
      label: t('work.month'),
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

  const paymentTimeOptions: OptionType[] = [
    { value: 'immediately', label: t('work.payment_immediately') },
    { value: 'weekly', label: t('work.payment_weekly') },
    { value: 'monthly', label: t('work.payment_monthly') },
    { value: 'after_completion', label: t('work.payment_after_completion') },
  ];

  const handleOpenMap = () => {
    // TODO: Open map modal
    console.log('Open map modal');
  };

  const handleSubmit = form.handleSubmit((data) => {
    console.log('Work Form Data:', data);
    // TODO: Submit data to API
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
            name="jobTitle"
            label={t('work.job_title')}
            placeholder={t('work.job_title_placeholder')}
            required
            rules={{
              required: t('work.errors.job_title'),
            }}
          />

          <FormSelect
            control={form.control}
            name="jobType"
            label={t('work.job_type')}
            placeholder={t('work.job_type_select')}
            options={[
              { value: 'full_time', label: t('work.full_time') },
              { value: 'part_time', label: t('work.part_time') },
              { value: 'contract', label: t('work.contract') },
              { value: 'freelance', label: t('work.freelance') },
            ]}
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
              name="jobDeadline"
              options={jobDeadlineOptions}
            />
          </View>

          <FormDatePicker
            control={form.control}
            name="meetingDateTime"
            mode="datetime"
            label={t('work.meeting_date_time')}
            placeholder={t('work.meeting_date_time_placeholder')}
            minimumDate={new Date()}
            required
            rules={{
              required: t('work.errors.meeting_date_time'),
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

          <FormRow>
            <View style={styles.locationInputWrapper}>
              <FormInput
                control={form.control}
                name="location"
                label={t('work.location')}
                placeholder={t('work.location_placeholder')}
                required
                rules={{
                  required: t('work.errors.location'),
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

          <FormRow>
            <FormInput
              control={form.control}
              name="webLinks"
              label={t('work.web_links')}
              placeholder={t('work.web_links_placeholder')}
              type="textarea"
              rows={3}
            />
          </FormRow>
        </View>
      </View>

      {/* Fixed Bottom Post Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.postButton, { backgroundColor: primaryColor }]}
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Text style={styles.postButtonText}>{t('work.post_job')}</Text>
        </TouchableOpacity>
      </View>
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
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  locationInputWrapper: {
    flex: 1,
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
