import { useCreateProductMutation } from '@/api/hooks';
import FormCheckbox from '@/components/FormElements/FormCheckbox';
import FormInput from '@/components/FormElements/FormInput';
import { ECarCondition, ECarFuelType, ECarTransmissionType, ECategoryType, ECurrencyType, EProductType } from '@/constants/enums';
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

const CreateCarForm = () => {
  const { t } = useTranslations();
  const primaryColor = useColor('primaryColor');
  const textColor = useColor('text');
  const router = useRouter();
  // const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
   const [location, setLocation] = useState<{ latitude: number; longitude: number }>({ latitude: 41.311081, longitude: 69.240562 }); // Default to Tashkent for testing
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);

  
  const fuelTypeOptions: RadioOption[] = [
    { value: 'petrol', label: t('car.petrol') },
    { value: 'gas', label: t('car.gas') },
    { value: 'hybrid', label: t('car.hybrid') },
    { value: 'electric', label: t('car.electric') },
  ];

  const transmissionOptions: RadioOption[] = [
    { value: 'automatic', label: t('car.automatic') },
    { value: 'manual', label: t('car.manual') },
  ];

  const conditionOptions: RadioOption[] = [
    { value: 'new', label: t('car.new') },
    { value: 'used', label: t('car.used') },
    { value: 'broken', label: t('car.needs_repair') },
  ];

  const form = useForm({
    defaultValues: {
      images: [],
      brand: 'test for car',
      model: 'test for model',
      year: '2020',
      mileage: '28000',
      fuelType: fuelTypeOptions[0].value, // Default to first fuel type option
      transmission: transmissionOptions[0].value, // Default to first transmission option
      price: '5000',
      currency: 'USD',
      negotiable: false,
      condition: conditionOptions[0].value, // Default to first condition option
      location: '',
      landmark: 'Yunusobod, Amir Temur ko`chasi',
      additionalNotes: 'Holati yaxshi, hech qanday muammosi yo`q. Faqatgina sotuvidaman.',
    },
  });

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


  const handleSubmit = form.handleSubmit((data) => {

    if (!location) {
      Alert.alert(t('post.error'), t('post.please_select_location'));
      return;
    }

     // ── Enum resolution ──
    const fuelTypeValue    = resolveEnum(ECarFuelType,          data.fuelType);
    const transmissionValue = resolveEnum(ECarTransmissionType, data.transmission);
    const conditionValue   = resolveEnum(ECarCondition,         data.condition);

    if (fuelTypeValue === undefined) {
      Alert.alert(t('post.error'), 'Invalid fuel type selected');
      return;
    }
    if (transmissionValue === undefined) {
      Alert.alert(t('post.error'), 'Invalid transmission selected');
      return;
    }
    if (conditionValue === undefined) {
      Alert.alert(t('post.error'), 'Invalid condition selected');
      return;
    }

    const formData = new FormData();

    // Add product type
    formData.append('product_type', EProductType.CAR.toString());

    // Add category
    formData.append('category_id', ECategoryType.CARS.toString()); // Assuming 100 is the category ID for cars, adjust as needed
    // Add car brand and model
    formData.append('car_brand', data.brand);
    formData.append('car_model', data.model);
    formData.append('title', `${data.brand} ${data.model}`);
    formData.append('description', data.additionalNotes || '');

    // Add car-specific data
    formData.append('car_data.year', data.year);
    formData.append('car_data.mileage', data.mileage);

    formData.append('car_data.fuel_type',      fuelTypeValue.toString());
    formData.append('car_data.car_transmission', transmissionValue.toString());
    formData.append('car_data.car_condition',  conditionValue.toString());

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
    const images: DraftImageItem[] = data.images;
    
    const draft_images = images.map((img, index) => ({
      draft_uuid: img.draft_uuid,
      draft_image_url: img.draft_image_url,
      sort_order: index, // You can implement sorting logic if needed
    }));

    formData.append('images_json', JSON.stringify(draft_images));
      
    console.log(formData);
    
    // Submit the form data
    createProduct(formData);
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
                  pattern: {
                    value: /^\d{4}$/,
                    message: t('car.errors.year_invalid'),
                  },
                  validate: (value: string) => {
                    const year = parseInt(value, 10);
                    if (year < 1900 || year > new Date().getFullYear() + 1)
                      return t('car.errors.year_range');
                    return true;
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
                keyboardType="numeric"
                required
                rules={{
                  required: t('car.errors.mileage'),
                  validate: (value: string) => {
                    const num = parseInt(value, 10);
                    if (isNaN(num) || num < 0)
                      return t('car.errors.mileage_invalid');
                    return true;
                  },
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
                  validate: (value: string) => {
                    const num = parseFloat(value);
                    if (isNaN(num) || num <= 0)
                      return t('car.errors.price_invalid');
                    return true;
                  },
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
                name="landmark"
                label={t('car.landmark')}
                placeholder={t('car.landmark_placeholder')}
                required
                rules={{
                  required: t('car.errors.landmark'),
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

          {/* <FormInput
            control={form.control}
            name="landmark"
            label={t('car.landmark')}
            placeholder={t('car.landmark_placeholder')}
          /> */}
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