import { useColor } from '@/hooks/useColor';
import { Check } from 'lucide-react-native';
import React from 'react';
import { Control, Controller } from 'react-hook-form';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface FormCheckboxProps {
  control?: Control<any>;
  name?: string;
  label: string;
  error?: string;
}

const FormCheckbox = ({
  control,
  name = 'checkbox',
  label,
  error,
}: FormCheckboxProps) => {
  const textColor = useColor('text');
  const destructiveColor = useColor('destructive');
  const borderColor = useColor('borderColor');
  const primaryColor = useColor('primaryColor');

  return (
    <View style={styles.container}>
      <Controller
        name={name!}
        control={control}
        render={({ field: { onChange, value } }) => (
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => onChange(!value)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: error ? destructiveColor : value ? primaryColor : borderColor,
                  backgroundColor: value ? primaryColor : 'transparent',
                },
              ]}
            >
              {value && <Check size={16} color="#fff" strokeWidth={3} />}
            </View>
            <Text style={[styles.label, { color: textColor }]}>{label}</Text>
          </TouchableOpacity>
        )}
      />
      {error && (
        <Text style={[styles.errorText, { color: destructiveColor }]}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default FormCheckbox;
