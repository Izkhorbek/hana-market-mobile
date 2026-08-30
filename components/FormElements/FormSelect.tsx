import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
  OptionType,
} from '@/components/ui/combobox'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useColor } from '@/hooks/useColor'
import React from 'react'
import { Control, Controller } from 'react-hook-form'
import { Dimensions, StyleSheet, Text, View } from 'react-native'

interface FormSelectProps {
  options?: OptionType[];
  control?: Control<any>;
  name?: string;
  placeholder?: string;
  inputPlaceholder?: string;
  label?: string;
  required?: boolean;
  rules?: any;
}

const FormSelect = ({
  options = [],
  placeholder = 'Select...',
  inputPlaceholder = '',
  control,
  name = 'category',
  label,
  required = false,
  rules,
}: FormSelectProps) => {
  const { t } = useTranslations()
  const colors = useThemeColors()
  const backgroundColor = useColor('background')
  const textColor = useColor('text')
  const destructiveColor = useColor('destructive')

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
          {required && (
            <Text style={[styles.asterisk, { color: destructiveColor }]}>
              {' '}
              *
            </Text>
          )}
        </View>
      )}
      <Controller
        name={name!}
        control={control}
        rules={rules}
        render={({ field, fieldState: { error } }) => (
          <>
            <Combobox
              value={
                field.value
                  ? (options.find((o) => o.value === field.value) ?? null)
                  : null
              }
              onValueChange={(option) => field.onChange(option?.value ?? '')}
            >
              <ComboboxTrigger
                style={[
                  styles.trigger,
                  {
                    backgroundColor: backgroundColor,
                    borderColor: error ? destructiveColor : colors.borderColor,
                  },
                ]}
              >
                <ComboboxValue
                  placeholder={placeholder}
                  style={styles.valueText}
                />
              </ComboboxTrigger>
              <ComboboxContent maxHeight={Dimensions.get('window').height / 2}>
                {inputPlaceholder && (
                  <ComboboxInput placeholder={inputPlaceholder} />
                )}
                <ComboboxList style={styles.list}>
                  {options.length === 0 && (
                    <ComboboxEmpty>
                      {t('form_elements.select.no_framework_found')}
                    </ComboboxEmpty>
                  )}
                  {options.map((option, i) => (
                    <ComboboxItem
                      key={option.value}
                      value={option.value}
                      style={[
                        styles.item,
                        {
                          borderBottomColor: colors.borderColor,
                          borderBottomWidth: i === options.length - 1 ? 0 : StyleSheet.hairlineWidth,
                        },
                      ]}
                    >
                      {option.label}
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            {error?.message && (
              <Text style={[styles.errorText, { color: destructiveColor }]}>
                {error.message}
              </Text>
            )}
          </>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  asterisk: {
    fontSize: 14,
    fontWeight: '500',
  },
  trigger: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 16,
  },
  valueText: {
    fontSize: 16,
  },
  list: {
    overflow: 'hidden',
    borderRadius: 12,
  },
  // Padding/height come from the base option style (bigger rows); only the
  // separator is set inline (theme-aware) at the call site.
  item: {},
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
})

export default FormSelect
