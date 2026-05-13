import { useThemeColors } from '@/hooks/use-theme-colors'
import React from 'react'
import { Control, Controller } from 'react-hook-form'
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native'

interface FormInputProps extends TextInputProps {
  control?: Control<any>;
  name?: string;
  label?: string;
  required?: boolean;
  error?: string;
  type?: 'input' | 'textarea';
  rows?: number;
  rules?: any;
}

const FormInput = ({
  control,
  name = 'input',
  label,
  required = false,
  error,
  placeholder,
  type = 'input',
  rows = 4,
  rules,
  ...props
}: FormInputProps) => {
  const colors = useThemeColors()

  const isTextarea = type === 'textarea'
  // Format integer-style numeric inputs with thousand separators while keeping
  // the raw digits in form state (so backend always receives "200000").
  const isNumericInteger =
    props.keyboardType === 'numeric' || props.keyboardType === 'number-pad'

  const formatNumber = (raw: string) =>
    raw ? Number(raw).toLocaleString('en-US') : ''

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
          {required && (
            <Text style={[styles.asterisk, { color: colors.destructive }]}>
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
        render={({
          field: { onChange, onBlur, value },
          fieldState: { error: fieldError },
        }) => (
          <>
            <TextInput
              style={[
                isTextarea ? styles.textarea : styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor:
                    error || fieldError ? colors.destructive : colors.border,
                  color: colors.text,
                },
              ]}
              placeholder={placeholder}
              placeholderTextColor={colors.textMuted}
              onChangeText={(text) => {
                if (isNumericInteger) {
                  // Strip everything that is not a digit; store raw digits.
                  const cleaned = text.replace(/[^0-9]/g, '')
                  onChange(cleaned)
                  return
                }
                onChange(text)
              }}
              onBlur={onBlur}
              value={
                isNumericInteger
                  ? formatNumber(value ?? '')
                  : (value ?? '')
              }
              multiline={isTextarea}
              numberOfLines={isTextarea ? rows : undefined}
              textAlignVertical={isTextarea ? 'top' : 'center'}
              {...props}
            />
            {(error || fieldError?.message) && (
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {error || fieldError?.message}
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
    marginVertical: 0,
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
  input: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textarea: {
    minHeight: 100,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
})

export default FormInput
