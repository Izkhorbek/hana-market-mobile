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
} from '@/components/ui/combobox';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTranslations } from '@/hooks/use-translation';
import { useColor } from '@/hooks/useColor';
import React from 'react';
import { Control, Controller } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

interface FormSelectProps {
  options?: OptionType[];
  control?: Control<any>;
  name?: string;
  placeholder?: string;
  inputPlaceholder?: string;
  label?: string;
  required?: boolean;
}

const FormSelect = ({
  options = [],
  placeholder = 'Select...',
  inputPlaceholder = '',
  control,
  name = 'category',
  label,
  required = false,
}: FormSelectProps) => {
  const { t } = useTranslations();
  const colors = useThemeColors()
  const backgroundColor = useColor('background');
  const textColor = useColor('text');
  const destructiveColor = useColor('destructive');

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
          {required && <Text style={[styles.asterisk, { color: destructiveColor }]}> *</Text>}
        </View>
      )}
      <Controller
        name={name!}
        control={control}
        render={({ field }) => (
          <Combobox value={field.value} onValueChange={field.onChange}>
            <ComboboxTrigger style={[
              styles.trigger,
              {
                backgroundColor: backgroundColor,
                borderColor: colors.borderColor,
              }
            ]}>
              <ComboboxValue placeholder={placeholder} style={styles.valueText} />
            </ComboboxTrigger>
            <ComboboxContent  maxHeight={300}>
              {inputPlaceholder && <ComboboxInput placeholder={inputPlaceholder} />}
              <ComboboxList style={styles.list}>
               {options.length === 0 && <ComboboxEmpty>{t('form_elements.select.no_framework_found')}</ComboboxEmpty>}
                {options.map((option) => (
                  <ComboboxItem key={option.value} value={option.value}>
                    {option.label}
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
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
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 16,
  },
  valueText: {
    fontSize: 16,
  },
  list: {
    overflow: 'hidden',
    // borderRadius: 12,
  },
})

export default FormSelect