import { useProductQuery, useUpdateProductMutation } from '@/api/hooks'
import RadioButtonGroup, { RadioOption } from '@/components/FormElements/RadioButtonGroup'
import EditCarForm from '@/components/Forms/EditCarForm'
import EditThingForm from '@/components/Forms/EditThingForm'
import EditWorksForm from '@/components/Forms/EditWorksForm'
import EditProductHeader from '@/components/headers/EditProductHeader'
import RemoteImage from '@/components/shared/RemoteImage'
import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { EProductType } from '@/constants/enums'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useColor } from '@/hooks/useColor'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Clock, Eye, Heart } from 'lucide-react-native'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type ProductStatus = 'active' | 'reserved' | 'sold' | 'hidden'

const statusOptions: { value: ProductStatus; labelKey: string }[] = [
    { value: 'active', labelKey: 'edit_product.status_active' },
    { value: 'reserved', labelKey: 'edit_product.status_reserved' },
    { value: 'sold', labelKey: 'edit_product.status_sold' },
    { value: 'hidden', labelKey: 'edit_product.status_hidden' },
]

const EditProductPage = () => {
    const { id } = useLocalSearchParams<{ id?: string }>()
    const productId = id ? parseInt(id, 10) : 0
    const colors = useThemeColors()
    const { t } = useTranslations()
    const primaryColor = useColor('primaryColor')
    const router = useRouter()
    const insets = useSafeAreaInsets()

    const [location, setLocation] = useState<{
        latitude: number
        longitude: number
        address?: string
    } | null>(null)

    const { data: productRes, isLoading: productLoading } = useProductQuery({
        id: productId,
        querySettings: { enabled: productId > 0 },
    })

    const product = productRes?.data?.data
    const productType = product?.product_type

    const { mutate: updateProduct, isPending: isUpdating } = useUpdateProductMutation({
        onSuccess: () => {
            Alert.alert(t('edit_product.success'), t('edit_product.product_updated_successfully'), [
                { text: t('common.ok'), onPress: () => router.back() },
            ])
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || error?.message || t('edit_product.error_updating_product')
            Alert.alert(t('edit_product.error'), message)
        },
    })

    const form = useForm({
        defaultValues: {
            status: 'active' as ProductStatus,
            title: '', category: '', description: '', sellingMethod: 'for_sale',
            price: '', currency: 'UZS', canDeal: false, location: '', landmark: '',
            brand: '', model: '', year: '', mileage: '', fuelType: 'petrol',
            transmission: 'automatic', negotiable: false, condition: 'used', additionalNotes: '',
            workerType: 'employee', workType: 'full_time', workTitle: '', workCondition: 'long_term',
            workingStartDateTime: undefined as Date | undefined, salaryType: 'hourly',
            salaryAmount: '', paymentType: 'cash', paymentTime: 'monthly',
            jobDescription: '', employerName: '', workplaceInfo: '', employerPhone: '', webLinks: '',
        },
    })

    React.useEffect(() => {
        if (product?.latitude && product?.longitude) {
            setLocation({ latitude: product.latitude, longitude: product.longitude, address: product.moljal || undefined })
        }
        if (product?.status) { form.setValue('status', product.status as ProductStatus) }
    }, [product])

    const handleShare = async () => {
        try {
            await Share.share({ message: `${product?.title || ''} - ${product?.price || ''}`, title: product?.title || '' })
        } catch (error) { console.error('Error sharing:', error) }
    }

    const handleLocationChange = (newLocation: { latitude: number; longitude: number; address?: string }) => {
        setLocation(newLocation)
    }

    const handleSubmit = form.handleSubmit(data => {
        const updateData: any = { status: data.status, moljal: data.landmark }
        if (location) { updateData.latitude = location.latitude; updateData.longitude = location.longitude }

        if (productType === EProductType.THING) {
            updateData.title = data.title; updateData.description = data.description
            updateData.category_id = data.category ? parseInt(data.category, 10) : undefined
            updateData.is_free = data.sellingMethod === 'free'; updateData.is_negotiable = data.canDeal
            if (data.sellingMethod !== 'free' && data.price) {
                if (data.currency === 'USD') { updateData.price_usd = parseFloat(data.price) }
                else { updateData.price_uzs = parseFloat(data.price) }
            }
        } else if (productType === EProductType.CAR) {
            updateData.car_brand = data.brand; updateData.car_model = data.model
            updateData.title = `${data.brand} ${data.model}`; updateData.description = data.additionalNotes
            updateData.is_negotiable = data.negotiable
            if (data.price) {
                if (data.currency === 'USD') { updateData.price_usd = parseFloat(data.price) }
                else { updateData.price_uzs = parseFloat(data.price) }
            }
            updateData.car_data = {
                year: data.year ? parseInt(data.year, 10) : undefined,
                mileage: data.mileage ? parseInt(data.mileage, 10) : undefined,
                fuel_type: getFuelTypeEnum(data.fuelType),
                car_transmission: getTransmissionEnum(data.transmission),
                car_condition: getConditionEnum(data.condition),
            }
        } else if (productType === EProductType.WORK) {
            updateData.title = data.workTitle; updateData.description = data.jobDescription
            if (data.salaryAmount) {
                if (data.currency === 'USD') { updateData.price_usd = parseFloat(data.salaryAmount) }
                else { updateData.price_uzs = parseFloat(data.salaryAmount) }
            }
            updateData.work_type = getWorkTypeEnum(data.workType)
            updateData.work_condition = getWorkConditionEnum(data.workCondition)
            updateData.work_data = {
                worker_type: getWorkerTypeEnum(data.workerType),
                salary_type: getSalaryTypeEnum(data.salaryType),
                salary_amount: data.salaryAmount ? parseFloat(data.salaryAmount) : undefined,
                payment_type: getPaymentTypeEnum(data.paymentType),
                payment_time: getPaymentTimeEnum(data.paymentTime),
                employer_information: data.employerName,
                workplace_information: data.workplaceInfo,
                phone_number: data.employerPhone,
                work_ethics: data.webLinks,
                working_start_date: data.workingStartDateTime?.toISOString(),
            }
        }
        updateProduct({ id: productId, data: updateData })
    })

    const statusRadioOptions: RadioOption[] = statusOptions.map(opt => ({ value: opt.value, label: t(opt.labelKey) }))

    if (productLoading) {
        return (<ThemedView style={styles.loadingContainer}><ActivityIndicator size="large" color={primaryColor} /></ThemedView>)
    }

    if (!product) {
        return (<ThemedView style={styles.loadingContainer}><ThemedText>{t('edit_product.product_not_found')}</ThemedText></ThemedView>)
    }

    const productImages = product?.images || []
    const mainImage = product?.main_image_url

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <EditProductHeader productTitle={product?.title} onShare={handleShare} />
            <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}>
                <View style={styles.imageSection}>
                    <RemoteImage src={mainImage} style={styles.mainImage} resizeMode="cover" />
                    {productImages.length > 1 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailContainer}>
                            {productImages.map((img: string, index: number) => (
                                <RemoteImage key={index} src={img} style={styles.thumbnail} resizeMode="cover" />
                            ))}
                        </ScrollView>
                    )}
                </View>

                <View style={[styles.statsRow, { borderBottomColor: colors.borderColor }]}>
                    <View style={styles.statItem}><Eye size={18} color={colors.textMuted} /><Text style={[styles.statText, { color: colors.textMuted }]}>{product?.views_count || 0}</Text></View>
                    <View style={styles.statItem}><Heart size={18} color={colors.textMuted} /><Text style={[styles.statText, { color: colors.textMuted }]}>{product?.likes_count || 0}</Text></View>
                    <View style={styles.statItem}><Clock size={18} color={colors.textMuted} /><Text style={[styles.statText, { color: colors.textMuted }]}>{product?.created_ago || ''}</Text></View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('edit_product.status')}</Text>
                    <RadioButtonGroup control={form.control} name="status" options={statusRadioOptions} />
                </View>

                {productType === EProductType.THING && (<EditThingForm form={form} product={product} location={location} onLocationChange={handleLocationChange} />)}
                {productType === EProductType.CAR && (<EditCarForm form={form} product={product} location={location} onLocationChange={handleLocationChange} />)}
                {productType === EProductType.WORK && (<EditWorksForm form={form} product={product} location={location} onLocationChange={handleLocationChange} />)}

                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={[styles.saveButton, { backgroundColor: isUpdating ? primaryColor + '80' : primaryColor, opacity: isUpdating ? 0.7 : 1 }]} onPress={handleSubmit} disabled={isUpdating} activeOpacity={0.8}>
                        {isUpdating ? (<ActivityIndicator color="#fff" />) : (<Text style={styles.saveButtonText}>{t('edit_product.save_changes')}</Text>)}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

function getFuelTypeEnum(value: string): number {
    switch (value) { case 'petrol': return 1000; case 'gas': return 1010; case 'hybrid': return 1020; case 'electric': return 1030; default: return 1000 }
}
function getTransmissionEnum(value: string): number {
    switch (value) { case 'automatic': return 1000; case 'manual': return 1010; default: return 1000 }
}
function getConditionEnum(value: string): number {
    switch (value) { case 'new': return 1000; case 'used': return 1010; case 'broken': return 1020; default: return 1010 }
}
function getWorkerTypeEnum(value: string): number {
    switch (value) { case 'employee': return 1000; case 'assistant': return 1010; case 'teacher': return 1020; default: return 1000 }
}
function getWorkTypeEnum(value: string): number {
    switch (value) { case 'full_time': return 1000; case 'part_time': return 1010; case 'contract': return 1020; case 'freelancer': return 1030; default: return 1000 }
}
function getWorkConditionEnum(value: string): number {
    switch (value) { case 'temporary': return 1000; case 'one_month': return 1010; case 'long_term': return 1020; default: return 1020 }
}
function getSalaryTypeEnum(value: string): number {
    switch (value) { case 'hourly': return 1000; case 'daily': return 1010; case 'per_task': return 1020; case 'monthly': return 1030; default: return 1030 }
}
function getPaymentTypeEnum(value: string): number {
    switch (value) { case 'cash': return 1000; case 'bank_transfer': return 1010; case 'mobile_payment': return 1020; default: return 1000 }
}
function getPaymentTimeEnum(value: string): number {
    switch (value) { case 'immediately': return 1000; case 'weekly': return 1010; case 'monthly': return 1020; case 'after_completion': return 1030; default: return 1020 }
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
