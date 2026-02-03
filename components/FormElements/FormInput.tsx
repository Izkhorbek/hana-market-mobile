import { useThemeColors } from '@/hooks/use-theme-colors';
import { useColor } from '@/hooks/useColor';
import React from 'react';
import { Control, Controller } from 'react-hook-form';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

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
  const colors = useThemeColors();
  const backgroundColor = useColor('background');
  const textColor = useColor('text');
  const destructiveColor = useColor('destructive');
  const placeholderColor = useColor('textMuted');

  const isTextarea = type === 'textarea';

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
        rules={rules}
        render={({ field: { onChange, onBlur, value }, fieldState: { error: fieldError } }) => (
          <>
            <TextInput
              style={[
                isTextarea ? styles.textarea : styles.input,
                {
                  backgroundColor: backgroundColor,
                  borderColor: (error || fieldError) ? destructiveColor : colors.borderColor,
                  color: textColor, 
                },
              ]}
              placeholder={placeholder}
              placeholderTextColor={placeholderColor}
              onChangeText={onChange}
              onBlur={onBlur}
              value={value}
              multiline={isTextarea}
              numberOfLines={isTextarea ? rows : undefined}
              textAlignVertical={isTextarea ? 'top' : 'center'}
              {...props}
            />
            {(error || fieldError?.message) && (
              <Text style={[styles.errorText, { color: destructiveColor }]}>
                {error || fieldError?.message}
              </Text>
            )}
          </>
        )}
      />
    </View>
  );
};

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
});

export default FormInput;