import { useThemeColors } from '@/hooks/use-theme-colors';
import { useColor } from '@/hooks/useColor';
import type { LucideProps } from 'lucide-react-native';
import React from 'react';
import { Control, Controller } from 'react-hook-form';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface RadioOption {
  value: string;
  label: string;
  icon?: React.ComponentType<LucideProps>;
}

interface RadioButtonGroupProps {
  options: RadioOption[];
  control?: Control<any>;
  name?: string;
  label?: string;
  required?: boolean;
  error?: string;
}

const RadioButtonGroup = ({
  options,
  control,
  name = 'radioGroup',
  label,
  required = false,
  error,
}: RadioButtonGroupProps) => {
  const colors = useThemeColors();
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
        render={({ field: { onChange, value } }) => (
          <View style={styles.optionsContainer}>
            {options.map((option) => {
              const isSelected = value === option.value;
              const IconComponent = option.icon;

              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: isSelected ? colors.tabIconBackground : colors.background,
                      borderColor: isSelected ? colors.tabIconBackground : colors.borderColor,
                    },
                  ]}
                  onPress={() => onChange(option.value)}
                  activeOpacity={0.7}
                >
                  {IconComponent && (
                    <IconComponent
                      size={32}
                      color={isSelected ? colors.tabIconSelected : colors.icon}
                      strokeWidth={1.5}
                    />
                  )}
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: isSelected ? colors.tabIconSelected : textColor }
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
  optionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  optionCard: { 
    height: 50,
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default RadioButtonGroup;
