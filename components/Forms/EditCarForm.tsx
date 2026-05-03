import FormCheckbox from '@/components/FormElements/FormCheckbox';
import FormInput from '@/components/FormElements/FormInput';
import { useTranslations } from '@/hooks/use-translation';
import { useColor } from '@/hooks/useColor';
import React, { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FormRow from '../FormElements/FormRow';
import RadioButtonGroup, { RadioOption } from '../FormElements/RadioButtonGroup';

export interface EditCarFormValues {
    brand: string;
    model: string;
    year: string;
    mileage: string;
    fuelType: string;
    transmission: string;
    price: string;
    currency: string;
    negotiable: boolean;
    condition: string;
    landmark: string;
    additionalNotes: string;
}

interface EditCarFormProps {
    form: UseFormReturn<any>;
    product: any;
}

// Helper functions to convert enum values to form values
function getFuelTypeValue(value?: number): string {
    switch (value) {
        case 1000: return 'petrol';
        case 1010: return 'gas';
        case 1020: return 'hybrid';
        case 1030: return 'electric';
        default: return 'petrol';
    }
}

function getTransmissionValue(value?: number): string {
    switch (value) {
        case 1000: return 'automatic';
        case 1010: return 'manual';
        default: return 'automatic';
    }
}

function getConditionValue(value?: number): string {
    switch (value) {
        case 1000: return 'new';
        case 1010: return 'used';
        case 1020: return 'broken';
        default: return 'used';
    }
}

const EditCarForm: React.FC<EditCarFormProps> = ({ form, product }) => {
    const { t } = useTranslations();
    const primaryColor = useColor('primaryColor');
    const textColor = useColor('text');

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

    const currency = form.watch('currency');

    // Set initial values from product
    useEffect(() => {
        if (product) {
            form.setValue('brand', product.car_brand || '');
            form.setValue('model', product.car_model || '');
            form.setValue('year', product.car_data?.year?.toString() || '');
            form.setValue('mileage', product.car_data?.mileage?.toString() || '');
            form.setValue('fuelType', getFuelTypeValue(product.car_data?.fuel_type));
            form.setValue('transmission', getTransmissionValue(product.car_data?.car_transmission));
            form.setValue('price', product.price_uzs?.toString() || product.price_usd?.toString() || '');
            form.setValue('currency', product.currency_type === 1010 ? 'USD' : 'UZS');
            form.setValue('negotiable', product.is_negotiable || false);
            form.setValue('condition', getConditionValue(product.car_data?.car_condition));
            form.setValue('landmark', product.moljal || '');
            form.setValue('additionalNotes', product.description || '');
        }
    }, [product]);

    return (
        <View style={styles.container}>
            {/* Section 1: Car Information */}
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

            {/* Section 2: Selling Details */}
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
                </FormRow>
            </View>

            {/* Section 3: Additional Notes */}
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
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    section: {
        marginBottom: 24,
        paddingHorizontal: 16,
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
    halfInput: {
        flex: 1,
    },
    priceInputWrapper: {
        flex: 1,
    },
    currencyButtons: {
        flexDirection: 'column',
        gap: 6,
        marginTop: 30,
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
    locationInputWrapper: {
        flex: 1,
    },
});

export default EditCarForm;
