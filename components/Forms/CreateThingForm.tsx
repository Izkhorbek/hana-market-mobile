import { useCategoriesQuery, useCreateProductMutation } from '@/api/hooks';
import FormCheckbox from '@/components/FormElements/FormCheckbox';
import FormInput from '@/components/FormElements/FormInput';
import FormSelect from '@/components/FormElements/FormSelect';
import { ECurrencyType, EProductType } from '@/constants/enums';
import { useTranslations } from '@/hooks/use-translation';
import { useColor } from '@/hooks/useColor';
import { Category } from '@/types';
import { useRouter } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FormRow from '../FormElements/FormRow';
import ImageUploader, { DraftImageItem } from '../FormElements/ImageUploader';
import RadioButtonGroup, { RadioOption } from '../FormElements/RadioButtonGroup';
import MapModal from '../MapModal';


const CreateThingForm = () => {
  const { t, locale } = useTranslations();
  const primaryColor = useColor('primaryColor');
  const textColor = useColor('text');
  const router = useRouter();
  const [location, setLocation] = useState<{ latitude: number; longitude: number, address?: string } | null>(null);
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);
  const { data: categories } = useCategoriesQuery();

  const categoryOptions = categories?.data?.data?.map((category: Category) => ({
    value: category.id.toString(),
    label: locale === 'ru' ? category.name_ru : category.name_uz,
  })) || [];

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
      location: '', // latitude and longitude
      landmark: '', // moljal
    },
  });

  const { formState: { errors } } = form;
  const sellingMethod = form.watch('sellingMethod');
  const currency = form.watch('currency');

  // Clear price validation error when user switches to 'free'
  useEffect(() => {
    if (sellingMethod === 'free') {
      form.clearErrors('price');
    }
  }, [sellingMethod]);

  const { mutate: createProduct, isPending: isCreating } = useCreateProductMutation({
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

  const watchedImages: DraftImageItem[] = form.watch('images');
  const isUploading = watchedImages.some((img) => img.uploading);
  const isPending = isCreating || isUploading;

 
  const onInvalid = (formErrors: Record<string, any>) => {
    const messages = Object.values(formErrors)
      .map((err) => `• ${err?.message}`)
      .filter(Boolean)
      .join('\n');
    if (messages) {
      Alert.alert(t('post.error'), messages);
    }
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    const images: DraftImageItem[] = data.images;

    // Create FormData for product creation
    const formData = new FormData();

    // Add product type
    formData.append('product_type', EProductType.THING.toString());

    // Add basic fields
    formData.append('title', data.title);
    formData.append('description', data.description || '');

    // Add category if selected
    if (data.category) {
      formData.append('category_id', data.category);
    }

    // Add pricing based on selling method
    const isFree = data.sellingMethod === 'free';
    formData.append('is_free', isFree.toString());

    if (isFree) {
      formData.append('currency_type', ECurrencyType.UZS.toString());
    } else {
      const currencyType = data.currency === 'USD' ? ECurrencyType.USD : ECurrencyType.UZS;
      formData.append('currency_type', currencyType.toString());

      const priceField = data.currency === 'USD' ? 'price_usd' : 'price_uzs';
      formData.append(priceField, data.price);

      formData.append('is_negotiable', data.canDeal.toString());
    }

    // Add location
    formData.append('latitude',  (location?.latitude ?? 0).toString());
    formData.append('longitude', (location?.longitude ?? 0).toString());
    formData.append('moljal', data.landmark || '');

    // Add pre-uploaded draft images as JSON
    const draft_images = images.map((img, index) => ({
      draft_uuid: img.draft_uuid,
      draft_image_url: img.draft_image_url,
      sort_order: index, // You can implement sorting logic if needed
    }));

    formData.append('images_json', JSON.stringify(draft_images));
    
    console.log('thing-formData', formData);
    createProduct(formData);
  }, onInvalid);

  const handleOpenMap = () => {
    setIsMapModalVisible(true);
  };

  const handleLocationSelect = (selectedLocation: { latitude: number; longitude: number, address?: string }) => {
    setLocation(selectedLocation);
    setIsMapModalVisible(false);
    // Use address if available, otherwise fall back to coords string so the required rule passes
    const locationValue = selectedLocation.address?.trim() || `${selectedLocation.latitude},${selectedLocation.longitude}`;
    form.setValue('location', locationValue, { shouldValidate: true });
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
              validate: (value: DraftImageItem[]) => {
                if (value.length === 0) return t('post.errors.images');
                if (value.some((img) => img.uploading)) return t('post.errors.images_uploading');
                return true;
              },
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
                      required: sellingMethod === 'for_sale' ? t('post.errors.price') : false,
                      validate: (value: string) => {
                        if (sellingMethod !== 'for_sale') return true;
                        const num = parseFloat(value);
                        if (isNaN(num) || num <= 0) return t('post.errors.price_invalid');
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

          {/* Hidden field: validates that user picked a location from the map */}
          <Controller
            control={form.control}
            name="location"
            rules={{ required: t('post.errors.location') }}
            render={() => <></>}
          />

          <FormRow>
            <View style={styles.locationInputWrapper}>
              <FormInput
                control={form.control}
                name="landmark"
                label={t('post.landmark')}
                placeholder={t('post.landmark_placeholder')}
                required
                rules={{
                  required: t('post.errors.landmark'),
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
          {errors.location && (
            <Text style={{ color: '#e53935', fontSize: 12, marginTop: 4 }}>
              {errors.location.message as string}
            </Text>
          )}
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
              <Text style={styles.postButtonText}>{t('post.post_button')}</Text>
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