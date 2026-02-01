import FormCheckbox from '@/components/FormElements/FormCheckbox';
import FormInput from '@/components/FormElements/FormInput';
import FormSelect from '@/components/FormElements/FormSelect';
import { OptionType } from '@/components/ui/combobox';
import { useTranslations } from '@/hooks/use-translation';
import { useColor } from '@/hooks/useColor';
import { MapPin } from 'lucide-react-native';
import React from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ImageUploader from '../FormElements/ImageUploader';
import RadioButtonGroup, { RadioOption } from '../FormElements/RadioButtonGroup';

interface CreateThingFormProps {
  categoryOptions?: OptionType[];
}

const CreateThingForm = ({
  categoryOptions = [],
}: CreateThingFormProps) => {
  const { t } = useTranslations();
  const primaryColor = useColor('primaryColor');
  const textColor = useColor('text');

  const form = useForm({
    defaultValues: {
      images: [],
      title: '',
      category: '',
      description: '',
      sellingMethod: 'for_sale',
      price: '',
      currency: 'SUM',
      canDeal: false,
      location: '',
    },
  });

  const { formState: { errors } } = form;
  const sellingMethod = form.watch('sellingMethod');
  const currency = form.watch('currency');

  const sellingMethodOptions: RadioOption[] = [
    {
      value: 'for_sale',
      label: t('post.for_sale'),
    },
    {
      value: 'free',
      label: t('post.free'),
    },
  ];

  const handleSubmit = form.handleSubmit((data) => {
    console.log('Form Data:', data);
    // TODO: Submit data to API
  });

  const handleOpenMap = () => {
    // TODO: Open map modal
    console.log('Open map modal');
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContent}>
        {/* Section 1: Images */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {t('post.images')}
          </Text>
          <ImageUploader
            control={form.control}
            name="images"
            maxImages={5}
            rules={{
              validate: (value: string[]) => value.length > 0 || t('post.errors.images'),
            }}
          />
        </View>

        {/* Section 2: Item Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {t('post.item_details')}
          </Text>

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
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {t('post.selling_methods')}
          </Text>

          <RadioButtonGroup
            control={form.control}
            name="sellingMethod"
            options={sellingMethodOptions}
          />

          {sellingMethod === 'for_sale' && (
            <>
              <View style={styles.priceInputContainer}>
                <View style={styles.priceInputWrapper}>
                  <FormInput
                    control={form.control}
                    name="price"
                    label={t('post.price')}
                    placeholder={t('post.price_placeholder')}
                    keyboardType="numeric"
                    required
                    rules={{
                      required: t('post.errors.price'),
                    }}
                  />
                </View>
                <View style={styles.currencyButtons}>
                  <TouchableOpacity
                    style={[
                      styles.currencyButton,
                      {
                        backgroundColor: currency === 'SUM' ? primaryColor : 'transparent',
                        borderColor: primaryColor,
                      }
                    ]}
                    onPress={() => form.setValue('currency', 'SUM')}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.currencyButtonText,
                      { color: currency === 'SUM' ? '#fff' : primaryColor }
                    ]}>SUM</Text>
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
              <FormCheckbox
                control={form.control}
                name="canDeal"
                label={t('post.can_deal')}
              />
            </>
          )}
        </View>

        {/* Section 4: Meeting */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {t('post.meeting')}
          </Text>

          <View style={styles.locationInputContainer}>
            <View style={styles.locationInputWrapper}>
              <FormInput
                control={form.control}
                name="location"
                label={t('post.location')}
                placeholder={t('post.location_placeholder')}
                required
                rules={{
                  required: t('post.errors.location'),
                }}
              />
            </View>
            <TouchableOpacity
              style={[styles.mapButton, { backgroundColor: primaryColor }]}
              onPress={handleOpenMap}
              activeOpacity={0.7}
            >
              <MapPin size={24} color="#fff" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Fixed Bottom Post Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.postButton, { backgroundColor: primaryColor }]}
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Text style={styles.postButtonText}>{t('post.post_button')}</Text>
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
    // paddingHorizontal: 16,
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

export default CreateThingForm;