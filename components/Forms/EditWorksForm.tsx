import FormInput from '@/components/FormElements/FormInput'
import FormSelect from '@/components/FormElements/FormSelect'
import { OptionType } from '@/components/ui/combobox'
import { useTranslations } from '@/hooks/use-translation'
import { useColor } from '@/hooks/useColor'
import React, { useEffect } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import FormRow from '../FormElements/FormRow'
import RadioButtonGroup, { RadioOption } from '../FormElements/RadioButtonGroup'
import { EWorkCondition, EWorkSalaryType, EWorkType } from '@/constants/enums'
import { EWorkerType } from '../../constants/enums'

export interface EditWorksFormValues {
    workerType: string;
    workType: string;
    workTitle: string;
    workCondition: string;
    salaryType: string;
    salaryAmount: string;
    currency: string;
    jobDescription: string;
    employerName: string;
    landmark: string;
    employerPhone: string;
}

interface EditWorksFormProps {
    form: UseFormReturn<any>;
    product: any;
}

// Helper functions to convert enum values to form values
function getWorkerTypeValue(value?: number): string {
    switch (value) {
        case EWorkerType.EMPLOYEE: return 'employee'
        case EWorkerType.ASSISTANT: return 'assistant'
        case EWorkerType.TEACHER: return 'teacher'
        default: return 'employee'
    }
}

function getWorkTypeValue(value?: number): string {
    switch (value) {
        case EWorkType.FULL_TIME: return 'full_time'
        case EWorkType.PART_TIME: return 'part_time'
        case EWorkType.CONTRACT: return 'contract'
        case EWorkType.FREELANCER: return 'freelancer'
        default: return 'full_time'
    }
}

function getWorkConditionValue(value?: number): string {
    switch (value) {
        case EWorkCondition.TEMPORARY: return 'temporary'
        case EWorkCondition.ONE_MONTH: return 'one_month'
        case EWorkCondition.LONG_TERM: return 'long_term'
        default: return 'long_term'
    }
}

function getSalaryTypeValue(value?: number): string {
    switch (value) {
        case EWorkSalaryType.HOURLY: return 'hourly'
        case EWorkSalaryType.DAILY: return 'daily'
        case EWorkSalaryType.MONTHLY: return 'monthly'
        default: return 'monthly'
    }
}

const EditWorksForm: React.FC<EditWorksFormProps> = ({ form, product }) => {
    const { t } = useTranslations()
    const primaryColor = useColor('primaryColor')
    const textColor = useColor('text')

    // Options for radio buttons and selects
    const workerTypeOptions: RadioOption[] = [
        { value: 'employee', label: t('work.employee') },
        { value: 'assistant', label: t('work.assistant') },
        { value: 'teacher', label: t('work.teacher') },
    ]

    const workConditionOptions: RadioOption[] = [
        { value: 'temporary', label: t('work.temporary') },
        { value: 'one_month', label: t('work.one_month') },
        { value: 'long_term', label: t('work.long_term') },
    ]

    const salaryTypeOptions: RadioOption[] = [
        { value: 'hourly', label: t('work.hourly') },
        { value: 'daily', label: t('work.daily') },
        { value: 'monthly', label: t('work.monthly') },
    ]

    // Work type options for select
    const workTypeOptions: OptionType[] = [
        { value: 'full_time', label: t('work.full_time') },
        { value: 'part_time', label: t('work.part_time') },
        { value: 'contract', label: t('work.contract') },
        { value: 'freelancer', label: t('work.freelancer') },
    ]

    const currency = form.watch('currency')

    // Set initial values from product
    useEffect(() => {
        if (product) {
            form.setValue('workerType', getWorkerTypeValue(product.work_data?.worker_type))
            form.setValue('workType', getWorkTypeValue(product.work_type))
            form.setValue('workTitle', product.title || '')
            form.setValue('workCondition', getWorkConditionValue(product.work_condition))
            form.setValue('salaryType', getSalaryTypeValue(product.work_data?.salary_type))
            form.setValue('salaryAmount', product.work_data?.salary_amount?.toString() || '')
            form.setValue('currency', product.currency_type === 1010 ? 'USD' : 'UZS')
            form.setValue('jobDescription', product.description || '')
            form.setValue('employerName', product.work_data?.employer_information || '')
            form.setValue('employerPhone', product.work_data?.phone_number || '')
            form.setValue('landmark', product.moljal || '')
        }
    }, [product, form])

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
    socialMediaInputWrapper: {
        marginTop: 8,
    },
})

export default EditWorksForm
