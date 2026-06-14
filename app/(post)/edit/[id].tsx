import { useEditProductQuery, useUpdateProductMutation } from '@/api/hooks'
import RadioButtonGroup, { RadioOption } from '@/components/FormElements/RadioButtonGroup'
import EditCarForm from '@/components/Forms/EditCarForm'
import EditThingForm from '@/components/Forms/EditThingForm'
import EditWorksForm from '@/components/Forms/EditWorksForm'
import EditProductHeader from '@/components/headers/EditProductHeader'
import KeyboardAvoidWrapper from '@/components/shared/KeyboardAvoidWrapper'
import RemoteImage from '@/components/shared/RemoteImage'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { AppLimits } from '@/constants/appLimits'
import { ECarCondition, ECarFuelType, ECarTransmissionType, ECurrencyType, EProductType, EWorkCondition, EWorkerType, EWorkSalaryType, EWorkType } from '@/constants/enums'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useColor } from '@/hooks/useColor'
import { ProductEditImageDto, ProductStatus, ProductUpdateRequest } from '@/types'
import { parseApiError } from '@/utils/apiError'
import { parseBackendDateTime } from '@/utils/dateTime'
import { logger } from '@/utils/logger'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Clock, Eye, Heart } from 'lucide-react-native'
import React from 'react'
import { useForm } from 'react-hook-form'
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const statusOptions: { value: ProductStatus; labelKey: string }[] = [
    { value: AppLimits.ProductStatus.active, labelKey: 'edit_product.status_active' },
    { value: AppLimits.ProductStatus.reserved, labelKey: 'edit_product.status_reserved' },
    { value: AppLimits.ProductStatus.sold, labelKey: 'edit_product.status_sold' },
    { value: AppLimits.ProductStatus.hidden, labelKey: 'edit_product.status_hidden' },
]

const EditProductPage = () => {
    const { id } = useLocalSearchParams<{ id?: string }>()
    const productId = id ? parseInt(id, 10) : 0
    const colors = useThemeColors()
    const { t } = useTranslations()
    const primaryColor = useColor('primaryColor')
    const router = useRouter()
    const insets = useSafeAreaInsets()
    
    const { data: productRes, isLoading: productLoading, isFetching: productFetching, refetch: refetchProduct } = useEditProductQuery({
        id: productId,
        querySettings: { enabled: productId > 0 },
    })

    const product = productRes?.data?.data
    const productType = product?.product_type
    const productImages = product?.images || []
    const mainImage = product?.main_image_url
    const createdAt = product?.created_at ? parseBackendDateTime(product.created_at) : null
    const createdAtLabel = createdAt ? createdAt.toLocaleString() : ''

    const { mutate: updateProduct, isPending: isUpdating } = useUpdateProductMutation({
        onSuccess: () => {
            Alert.alert(t('edit_product.success'), t('edit_product.product_updated_successfully'), [
                { text: t('common.ok'), onPress: () => router.back() },
            ])

            
        },
        onError: (error: any) => {
            const message = parseApiError(error, t('edit_product.error_updating_product'))
            Alert.alert(t('edit_product.error'), message)
        },
    })

    const form = useForm({
        defaultValues: {
            status: AppLimits.ProductStatus.active as ProductStatus,
            title: '', 
            category: '', 
            description: '', 
            sellingMethod: '',
            price: '', 
            currency: '', 
            canDeal: false, 
            landmark: '',
            brand: '', 
            model: '', 
            year: '', 
            mileage: '', 
            fuelType: '',
            transmission: '', 
            negotiable: false, 
            condition: '', 
            additionalNotes: '',
            workerType: '', 
            workType: '', 
            workTitle: '', 
            workCondition: '',
            salaryType: '',
            salaryAmount: '',
            jobDescription: '', 
            employerName: '', 
            employerPhone: '',
        },
    })

    React.useEffect(() => {
        if (product?.status) { form.setValue('status', product.status as ProductStatus) }
    }, [form, product])

    const handleShare = async () => {
        try {
            await Share.share({ message: `${product?.title || ''} - ${product?.currency_type === ECurrencyType.USD ? `${product?.price_usd} USD` : `${product?.price_uzs} UZS`}`, title: product?.title || '' })
        } catch (error) { logger.warn(error, { code: 'PRODUCT_SHARE_FAILED' }) }
    }

    const handleSubmit = form.handleSubmit(data => {
        const updateData: ProductUpdateRequest = { 
            status: data.status, 
            moljal: data.landmark, 
            product_type: productType,
        }

        if (productType === EProductType.THING) {
            updateData.category_id = data.category ? parseInt(data.category, 10) : undefined
            updateData.title = data.title 
            updateData.description = data.description
            updateData.is_free = data.sellingMethod === 'free' 
            updateData.is_negotiable = data.canDeal

            if (data.sellingMethod !== 'free' && data.price) {
                if (data.currency === 'USD') { 
                    updateData.currency_type = ECurrencyType.USD
                    updateData.price_usd = parseFloat(data.price) 
                }
                else { 
                    updateData.currency_type = ECurrencyType.UZS
                    updateData.price_uzs = parseFloat(data.price) 
                }
            }
        } else if (productType === EProductType.CAR) {
            updateData.car_brand = data.brand 
            updateData.car_model = data.model
            updateData.title = `${data.brand} ${data.model}` 
            updateData.description = data.additionalNotes
            updateData.is_free = false
            updateData.is_negotiable = data.negotiable
            if (data.price) {
                if (data.currency === 'USD') { 
                    updateData.currency_type = ECurrencyType.USD
                    updateData.price_usd = parseFloat(data.price) 
                }
                else { 
                    updateData.currency_type = ECurrencyType.UZS
                    updateData.price_uzs = parseFloat(data.price) 
                }
            }
            updateData.car_data = {
                year: data.year ? parseInt(data.year, 10) : undefined,
                mileage: data.mileage ? parseInt(data.mileage, 10) : undefined,
                fuel_type: getFuelTypeEnum(data.fuelType),
                car_transmission: getTransmissionEnum(data.transmission),
                car_condition: getConditionEnum(data.condition),
            }
        } else if (productType === EProductType.WORK) {
            updateData.title = data.workTitle 
            updateData.description = data.jobDescription
            if (data.salaryAmount) {
                if (data.currency === 'USD') { 
                    updateData.currency_type = ECurrencyType.USD
                    updateData.price_usd = parseFloat(data.salaryAmount) 
                }
                else { 
                    updateData.currency_type = ECurrencyType.UZS
                    updateData.price_uzs = parseFloat(data.salaryAmount) 
                }
            }
            updateData.work_type = getWorkTypeEnum(data.workType)
            updateData.work_condition = getWorkConditionEnum(data.workCondition)
            updateData.work_data = {
                worker_type: getWorkerTypeEnum(data.workerType),
                salary_type: getSalaryTypeEnum(data.salaryType),
                salary_amount: data.salaryAmount ? parseFloat(data.salaryAmount) : undefined,
                employer_information: data.employerName,
                phone_number: data.employerPhone,
            }
        }

        updateProduct({ id: productId, data: updateData })
    }, (formErrors) => {
        const messages = Object.values(formErrors)
            .map((err: any) => `• ${err?.message}`)
            .filter(Boolean)
            .join('\n')
        if (messages) {
            Alert.alert(t('edit_product.error'), messages)
        }
    })

    const statusRadioOptions: RadioOption[] = statusOptions.map(opt => ({ value: opt.value, label: t(opt.labelKey) }))

    if (productLoading) {
        return (
            <ThemedView style={{ flex: 1 }}>
                <EditProductHeader productTitle="" onShare={handleShare} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={primaryColor} />
                </View>
            </ThemedView>
        )
    }

    if (!product) {
        return (
            <ThemedView style={{ flex: 1 }}>
                <EditProductHeader productTitle="" onShare={handleShare} />
                <View style={styles.loadingContainer}>
                    <ThemedText>{t('edit_product.product_not_found')}</ThemedText>
                </View>
            </ThemedView>
        )
    }

    return (
        <KeyboardAvoidWrapper style={{ flex: 1 }} 
        >
            <EditProductHeader productTitle={product?.title} onShare={handleShare} />
            <ScrollView
                style={[styles.container, { backgroundColor: colors.background }]}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom }]}
                refreshControl={
                    <RefreshControl
                        refreshing={productFetching && !productLoading}
                        onRefresh={refetchProduct}
                        tintColor={primaryColor}
                        colors={[primaryColor]}
                    />
                }
            >
                <View style={styles.imageSection}>
                    <RemoteImage src={mainImage} style={styles.mainImage} resizeMode="cover" />
                    {productImages.length > 1 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailContainer}>
                            {productImages.map((img: ProductEditImageDto, index: number) => (
                                <RemoteImage key={img.id} src={img.image_url} style={styles.thumbnail}  resizeMode="cover" />
                            ))}
                        </ScrollView>
                    )}
                </View>

                <View style={[styles.statsRow, { borderBottomColor: colors.borderColor }]}>
                    <View style={styles.statItem}><Eye size={18} color={colors.textMuted} /><Text style={[styles.statText, { color: colors.textMuted }]}>{product?.views_count || 0}</Text></View>
                    <View style={styles.statItem}><Heart size={18} color={colors.textMuted} /><Text style={[styles.statText, { color: colors.textMuted }]}>{product?.likes_count || 0}</Text></View>
                    <View style={styles.statItem}><Clock size={18} color={colors.textMuted} /><Text style={[styles.statText, { color: colors.textMuted }]}>{createdAtLabel}</Text></View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('edit_product.status')}</Text>
                    <RadioButtonGroup control={form.control} name="status" options={statusRadioOptions} />
                </View>

                {productType === EProductType.THING && (<EditThingForm form={form} product={product} />)}
                {productType === EProductType.CAR && (<EditCarForm form={form} product={product} />)}
                {productType === EProductType.WORK && (<EditWorksForm form={form} product={product} />)}

                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={[styles.saveButton, { backgroundColor: isUpdating ? primaryColor + '80' : primaryColor, opacity: isUpdating ? 0.7 : 1 }]} onPress={handleSubmit} disabled={isUpdating} activeOpacity={0.8}>
                        {isUpdating ? (<ActivityIndicator color="#fff" />) : (<Text style={styles.saveButtonText}>{t('edit_product.save_changes')}</Text>)}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidWrapper>
    )
}

function getFuelTypeEnum(value: string): number {
    switch (value) { case 'petrol': return ECarFuelType.PETROL; case 'gas': return ECarFuelType.GAS; case 'hybrid': return ECarFuelType.HYBRID; case 'electric': return ECarFuelType.ELECTRIC; default: return ECarFuelType.PETROL }
}
function getTransmissionEnum(value: string): number {
    switch (value) { case 'automatic': return ECarTransmissionType.AUTOMATIC; case 'manual': return ECarTransmissionType.MANUAL; default: return ECarTransmissionType.AUTOMATIC }
}
function getConditionEnum(value: string): number {
    switch (value) { case 'new': return ECarCondition.NEW; case 'used': return ECarCondition.USED; case 'broken': return ECarCondition.BROKEN; default: return ECarCondition.USED }
}
function getWorkerTypeEnum(value: string): number {
    switch (value) { case 'employee': return EWorkerType.EMPLOYEE; case 'assistant': return EWorkerType.ASSISTANT; case 'teacher': return EWorkerType.TEACHER; default: return EWorkerType.EMPLOYEE }
}
function getWorkTypeEnum(value: string): number {
    switch (value) { case 'full_time': return EWorkType.FULL_TIME; case 'part_time': return EWorkType.PART_TIME; case 'contract': return EWorkType.CONTRACT; case 'freelancer': return EWorkType.FREELANCER; default: return EWorkType.FULL_TIME }
}
function getWorkConditionEnum(value: string): number {
    switch (value) { case 'temporary': return EWorkCondition.TEMPORARY; case 'one_month': return EWorkCondition.ONE_MONTH; case 'long_term': return EWorkCondition.LONG_TERM; default: return EWorkCondition.LONG_TERM }
}
function getSalaryTypeEnum(value: string): number {
    switch (value) { case 'hourly': return EWorkSalaryType.HOURLY; case 'daily': return EWorkSalaryType.DAILY; case 'monthly': return EWorkSalaryType.MONTHLY; default: return EWorkSalaryType.MONTHLY }
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 100 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    imageSection: { width: '100%' },
    mainImage: { width: '100%', height: 300 },
    thumbnailContainer: { flexDirection: 'row', padding: 12 },
    thumbnail: { width: 60, height: 60, borderRadius: 8, marginRight: 8 },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, borderBottomWidth: 1, marginHorizontal: 16 },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statText: { fontSize: 14 },
    section: { paddingHorizontal: 16, paddingTop: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
    buttonContainer: { paddingHorizontal: 16, paddingVertical: 20 },
    saveButton: { height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})

export default EditProductPage
