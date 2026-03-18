import FormDatePicker from '@/components/FormElements/FormDatePicker';
import FormInput from '@/components/FormElements/FormInput';
import FormSelect from '@/components/FormElements/FormSelect';
import { OptionType } from '@/components/ui/combobox';
import { useTranslations } from '@/hooks/use-translation';
import { useColor } from '@/hooks/useColor';
import { MapPin } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FormRow from '../FormElements/FormRow';
import RadioButtonGroup, { RadioOption } from '../FormElements/RadioButtonGroup';
import MapModal from '../MapModal';

export interface EditWorksFormValues {
    workerType: string;
    workType: string;
    workTitle: string;
    workCondition: string;
    workingStartDateTime: Date | undefined;
    salaryType: string;
    salaryAmount: string;
    currency: string;
    paymentType: string;
    paymentTime: string;
    jobDescription: string;
    employerName: string;
    workplaceInfo: string;
    location: string;
    landmark: string;
    employerPhone: string;
    webLinks: string;
}

interface EditWorksFormProps {
    form: UseFormReturn<any>;
    product: any;
    location: { latitude: number; longitude: number; address?: string } | null;
    onLocationChange: (location: { latitude: number; longitude: number; address?: string }) => void;
}

// Helper functions to convert enum values to form values
function getWorkerTypeValue(value?: number): string {
    switch (value) {
        case 1000: return 'employee';
        case 1010: return 'assistant';
        case 1020: return 'teacher';
        default: return 'employee';
    }
}

function getWorkTypeValue(value?: number): string {
    switch (value) {
        case 1000: return 'full_time';
        case 1010: return 'part_time';
        case 1020: return 'contract';
        case 1030: return 'freelancer';
        default: return 'full_time';
    }
}

function getWorkConditionValue(value?: number): string {
    switch (value) {
        case 1000: return 'temporary';
        case 1010: return 'one_month';
        case 1020: return 'long_term';
        default: return 'long_term';
    }
}

function getSalaryTypeValue(value?: number): string {
    switch (value) {
        case 1000: return 'hourly';
        case 1010: return 'daily';
        case 1020: return 'per_task';
        case 1030: return 'monthly';
        default: return 'monthly';
    }
}

function getPaymentTypeValue(value?: number): string {
    switch (value) {
        case 1000: return 'cash';
        case 1010: return 'bank_transfer';
        case 1020: return 'mobile_payment';
        default: return 'cash';
    }
}

function getPaymentTimeValue(value?: number): string {
    switch (value) {
        case 1000: return 'immediately';
        case 1010: return 'weekly';
        case 1020: return 'monthly';
        case 1030: return 'after_completion';
        default: return 'monthly';
    }
}

const EditWorksForm: React.FC<EditWorksFormProps> = ({ form, product, location, onLocationChange }) => {
    const { t } = useTranslations();
    const primaryColor = useColor('primaryColor');
    const textColor = useColor('text');
    const [isMapModalVisible, setIsMapModalVisible] = useState(false);

    // Options for radio buttons and selects
    const workerTypeOptions: RadioOption[] = [
        { value: 'employee', label: t('work.employee') },
        { value: 'assistant', label: t('work.assistant') },
        { value: 'teacher', label: t('work.teacher') },
    ];

    const workConditionOptions: RadioOption[] = [
        { value: 'temporary', label: t('work.temporary') },
        { value: 'one_month', label: t('work.one_month') },
        { value: 'long_term', label: t('work.long_term') },
    ];

    const salaryTypeOptions: RadioOption[] = [
        { value: 'hourly', label: t('work.hourly') },
        { value: 'daily', label: t('work.daily') },
        { value: 'per_task', label: t('work.per_task') },
    ];

    // Work type options for select
    const workTypeOptions: OptionType[] = [
        { value: 'full_time', label: t('work.full_time') },
        { value: 'part_time', label: t('work.part_time') },
        { value: 'contract', label: t('work.contract') },
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

    const currency = form.watch('currency');

    // Set initial values from product
    useEffect(() => {
        if (product) {
            form.setValue('workerType', getWorkerTypeValue(product.work_data?.worker_type));
            form.setValue('workType', getWorkTypeValue(product.work_type));
            form.setValue('workTitle', product.title || '');
            form.setValue('workCondition', getWorkConditionValue(product.work_condition));
            form.setValue('salaryType', getSalaryTypeValue(product.work_data?.salary_type));
            form.setValue('salaryAmount', product.work_data?.salary_amount?.toString() || '');
            form.setValue('currency', product.currency_type === 1010 ? 'USD' : 'UZS');
            form.setValue('paymentType', getPaymentTypeValue(product.work_data?.payment_type));
            form.setValue('paymentTime', getPaymentTimeValue(product.work_data?.payment_time));
            form.setValue('jobDescription', product.description || '');
            form.setValue('employerName', product.work_data?.employer_information || '');
            form.setValue('workplaceInfo', product.work_data?.workplace_information || '');
            form.setValue('employerPhone', product.work_data?.phone_number || '');
            form.setValue('landmark', product.moljal || '');
            form.setValue('webLinks', product.work_data?.work_ethics || '');

            // Set working start date if available
            if (product.work_data?.working_start_date) {
                form.setValue('workingStartDateTime', new Date(product.work_data.working_start_date));
            }
        }
    }, [product]);

    const handleOpenMap = () => {
        setIsMapModalVisible(true);
    };

    const handleLocationSelect = (selectedLocation: { latitude: number; longitude: number; address?: string }) => {
        onLocationChange(selectedLocation);
        setIsMapModalVisible(false);
        const locationValue = selectedLocation.address?.trim() || `${selectedLocation.latitude},${selectedLocation.longitude}`;
        form.setValue('landmark', selectedLocation.address || locationValue, { shouldValidate: true });
    };

    return (
        <View style={styles.container}>
            {/* Section 1: Worker Type */}
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

            {/* Section 2: Job Information */}
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

            {/* Section 3: Salary Details */}
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

            {/* Section 4: Job Description */}
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

            {/* Section 5: Employer Information */}
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
        marginBottom: 16,
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
        marginTop: 30,
    },
    socialMediaInputWrapper: {
        marginTop: 8,
    },
});

export default EditWorksForm;
