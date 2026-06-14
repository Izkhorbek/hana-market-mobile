import { useCategoriesQuery } from '@/api/hooks'
import FormCheckbox from '@/components/FormElements/FormCheckbox'
import FormInput from '@/components/FormElements/FormInput'
import FormSelect from '@/components/FormElements/FormSelect'
import { useTranslations } from '@/hooks/use-translation'
import { useColor } from '@/hooks/useColor'
import { Category } from '@/types'
import React, { useEffect } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import FormRow from '../FormElements/FormRow'
import RadioButtonGroup, { RadioOption } from '../FormElements/RadioButtonGroup'
import { ECurrencyType } from '@/constants/enums'

export interface EditThingFormValues {
    title: string;
    category: string;
    description: string;
    sellingMethod: string;
    price: string;
    currency: string;
    canDeal: boolean;
    landmark: string;
}

interface EditThingFormProps {
    form: UseFormReturn<any>;
    product: any;
}

const EditThingForm: React.FC<EditThingFormProps> = ({ form, product }) => {
    const { t, locale } = useTranslations()
    const primaryColor = useColor('primaryColor')
    const textColor = useColor('text')
    const { data: categories } = useCategoriesQuery()

    const categoryOptions = categories?.data?.data?.map((category: Category) => ({
        value: category.id.toString(),
        label: locale === 'ru' ? category.name_ru : category.name_uz,
    })) || []

    const sellingMethodOptions: RadioOption[] = [
        {
            value: 'for_sale',
            label: t('post.for_sale'),
        },
        {
            value: 'free',
            label: t('post.free'),
        },
    ]

    const sellingMethod = form.watch('sellingMethod')
    const currency = form.watch('currency')    // Clear price validation error when user switches to 'free'
    useEffect(() => {
        if (sellingMethod === 'free') {
            form.clearErrors('price')
        }
    }, [sellingMethod, form])

    // Set initial values from product
    useEffect(() => {
        if (product) {
            form.setValue('title', product.title || '')
            form.setValue('category', product.category_id?.toString() || '')
            form.setValue('description', product.description || '')
            form.setValue('sellingMethod', product.is_free ? 'free' : 'for_sale')
            form.setValue('price', product.price_uzs?.toString() || product.price_usd?.toString() || '')
            form.setValue('currency', product.currency_type === ECurrencyType.USD ? 'USD' : 'UZS')
            form.setValue('canDeal', product.is_negotiable || false)
            form.setValue('landmark', product.moljal || '')
        }
    }, [product, form])

    return (
        <View style={styles.container}>
            {/* Section 1: Item Details */}
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

            {/* Section 2: Selling Methods */}
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
                                            if (sellingMethod !== 'for_sale') return true
                                            const num = parseFloat(value)
                                            if (isNaN(num) || num <= 0) return t('post.errors.price_invalid')
                                            return true
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

            {/* Section 3: Meeting */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: textColor }]}>
                    {t('post.meeting')}
                </Text>

                {/* Hidden field removed: location is auto-resolved on Post */}

                <FormRow>
                    <View style={styles.locationInputWrapper}>
                        <FormInput
                            control={form.control}
                            name="landmark"
                            label={t('post.landmark')}
                            placeholder={t('post.landmark_placeholder')}
                            required
                            editable={false} // Make it non-editable since it's auto-resolved
                            rules={{
                                required: t('post.errors.landmark'),
                            }}
                        />
                    </View>
                </FormRow>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    section: {
        marginBottom: 24,
        paddingHorizontal: 16,
        gap: 14,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
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
})

export default EditThingForm
