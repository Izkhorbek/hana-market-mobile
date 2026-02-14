import { useCreateProductMutation } from '@/api/hooks';
import { ECarCondition, ECarFuelType, ECarTransmissionType, ECurrencyType, EProductType } from '@/api/types';
import FormCheckbox from '@/components/FormElements/FormCheckbox';
import FormInput from '@/components/FormElements/FormInput';
import { useTranslations } from '@/hooks/use-translation';
import { useColor } from '@/hooks/useColor';
import { useRouter } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FormRow from '../FormElements/FormRow';
import ImageUploader from '../FormElements/ImageUploader';
import RadioButtonGroup, { RadioOption } from '../FormElements/RadioButtonGroup';
import MapModal from '../MapModal';

interface CreateCarFormProps {
  // No props needed, form is self-contained
}

const CreateCarForm = () => {
  const { t } = useTranslations();
  const primaryColor = useColor('primaryColor');
  const textColor = useColor('text');
  const router = useRouter();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);

  const form = useForm({
    defaultValues: {
      images: [],
      brand: '',
      model: '',
      year: '',
      mileage: '',
      fuelType: 'petrol',
      transmission: 'automatic',
      price: '',
      currency: 'SUM',
      negotiable: false,
      condition: 'used',
      location: '',
      landmark: '',
      additionalNotes: '',
    },
  });

  const { formState: { errors } } = form;

  const fuelType = form.watch('fuelType');
  const transmission = form.watch('transmission');
  const condition = form.watch('condition');
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
      const message = error?.response?.data?.message || error?.message || t('post.error_creating_product');
      Alert.alert(t('post.error'), message);
    },
  });

  const fuelTypeOptions: RadioOption[] = [
    {
      value: 'petrol',
      label: t('car.petrol'),
    },
    {
      value: 'gas',
      label: t('car.gas'),
    },
    {
      value: 'hybrid',
      label: t('car.hybrid'),
    },
    {
      value: 'electric',
      label: t('car.electric'),
    },
  ];

  const transmissionOptions: RadioOption[] = [
    {
      value: 'automatic',
      label: t('car.automatic'),
    },
    {
      value: 'manual',
      label: t('car.manual'),
    },
  ];

  const conditionOptions: RadioOption[] = [
    {
      value: 'new',
      label: t('car.new'),
    },
    {
      value: 'used',
      label: t('car.used'),
    },
    {
      value: 'needs_repair',
      label: t('car.needs_repair'),
    },
  ];

  const handleSubmit = form.handleSubmit((data) => {
    if (!location) {
      Alert.alert(t('post.error'), t('post.please_select_location'));
      return;
    }

    const formData = new FormData();

    // Add product type
    formData.append('product_type', EProductType.CAR.toString());

    // Add car brand and model
    formData.append('car_brand', data.brand);
    formData.append('car_model', data.model);
    formData.append('title', `${data.brand} ${data.model}`);
    formData.append('description', data.additionalNotes || '');

    // Add car-specific data
    formData.append('car_data.year', data.year);
    formData.append('car_data.mileage', data.mileage);

    // Map fuel type to enum
    const fuelTypeMap: Record<string, ECarFuelType> = {
      petrol: ECarFuelType.PETROL,
      gas: ECarFuelType.GAS,
      hybrid: ECarFuelType.HYBRID,
      electric: ECarFuelType.ELECTRIC,
    };
    formData.append('car_data.fuel_type', fuelTypeMap[data.fuelType].toString());

    // Map transmission to enum
    const transmissionMap: Record<string, ECarTransmissionType> = {
      automatic: ECarTransmissionType.AUTOMATIC,
      manual: ECarTransmissionType.MANUAL,
    };
    formData.append('car_data.car_transmission', transmissionMap[data.transmission].toString());

    // Map condition to enum
    const conditionMap: Record<string, ECarCondition> = {
      new: ECarCondition.NEW,
      used: ECarCondition.USED,
      needs_repair: ECarCondition.DAMAGED,
    };
    formData.append('car_data.car_condition', conditionMap[data.condition].toString());

    // Add pricing
    const currencyType = data.currency === 'USD' ? ECurrencyType.USD : ECurrencyType.UZS;
    formData.append('currency_type', currencyType.toString());
    const priceField = data.currency === 'USD' ? 'price_usd' : 'price_uzs';
    formData.append(priceField, data.price);
    formData.append('is_negotiable', data.negotiable.toString());
    formData.append('is_free', 'false');

    // Add location
    formData.append('latitude', location.latitude.toString());
    formData.append('longitude', location.longitude.toString());
    formData.append('moljal', data.landmark || '');

    // Add images
    data.images.forEach((imageUri: string, index: number) => {
      const imageFile = {
        uri: imageUri,
        type: 'image/jpeg',
        name: `image_${index}.jpg`,
      } as any;

      if (index === 0) {
        formData.append('main_image_url', imageFile);
      }

      formData.append(`images[${index}].image_url`, imageFile);
      formData.append(`images[${index}].sort_order`, index.toString());
    });
    console.log(formData);
    // createProduct(formData);
  });

  const handleOpenMap = () => {
    setIsMapModalVisible(true);
  };

  const handleLocationSelect = (selectedLocation: { latitude: number; longitude: number }) => {
    setLocation(selectedLocation);
    setIsMapModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContent}>
        {/* Section 1: Upload Images */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {t('car.upload_images')}
          </Text>
          <ImageUploader
            control={form.control}
            name="images"
            maxImages={5}
            rules={{
              validate: (value: string[]) => value.length > 0 || t('car.errors.images'),
            }}
          />
        </View>

        {/* Section 2: Car Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {t('car.car_information')}
          </Text>

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
                }}
              />
            </View>
            <View style={styles.halfInput}>
              <FormInput
                control={form.control}
                name="mileage"
                label={t('car.mileage')}
                placeholder={t('car.mileage_placeholder')}
                keyboardType="numeric"
                required
                rules={{
                  required: t('car.errors.mileage'),
                }}
              />
            </View>
          </FormRow>

          <View style={styles.radioSection}>
            <Text style={[styles.radioLabel, { color: textColor }]}>
              {t('car.fuel_type')}
            </Text>
            <RadioButtonGroup
              control={form.control}
              name="fuelType"
              options={fuelTypeOptions}
            />
          </View>

          <View style={styles.radioSection}>
            <Text style={[styles.radioLabel, { color: textColor }]}>
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
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {t('car.selling_details')}
          </Text>

          <FormRow>
            <View style={styles.priceInputWrapper}>
              <FormInput
                control={form.control}
                name="price"
                label={t('car.price')}
                placeholder={t('car.price_placeholder')}
                keyboardType="numeric"
                required
                rules={{
                  required: t('car.errors.price'),
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
          </FormRow>

          <FormCheckbox
            control={form.control}
            name="negotiable"
            label={t('car.negotiable')}
          />

          <View style={styles.radioSection}>
            <Text style={[styles.radioLabel, { color: textColor }]}>
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
                name="location"
                label={t('car.location')}
                placeholder={t('car.location_placeholder')}
                required
                rules={{
                  required: t('car.errors.location'),
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
          </FormRow>

          <FormInput
            control={form.control}
            name="landmark"
            label={t('car.landmark')}
            placeholder={t('car.landmark_placeholder')}
          />
        </View>

        {/* Section 4: Additional Notes */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            {t('car.additional_notes')}
          </Text>

          <FormInput
            control={form.control}
            name="additionalNotes"
            placeholder={t('car.additional_notes_placeholder')}
            type="textarea"
            rows={4}
          />
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
              <Text style={styles.postButtonText}>{t('car.post_car')}</Text>
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

export default CreateCarForm;