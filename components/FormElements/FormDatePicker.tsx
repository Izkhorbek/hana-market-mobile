import { DatePicker, DatePickerProps } from '@/components/ui/date-picker'
import React from 'react'
import { Control, Controller } from 'react-hook-form'

interface FormDatePickerProps extends Omit<DatePickerProps, 'value' | 'onChange'> {
  control?: Control<any>;
  name?: string;
  label?: string;
  required?: boolean;
  rules?: any;
}

const FormDatePicker = ({
  control,
  name = 'date',
  label,
  required = false,
  rules,
  ...datePickerProps
}: FormDatePickerProps) => {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <DatePicker
          label={label}
          value={value}
          onChange={onChange}
          error={error?.message}
          {...datePickerProps}
        />
      )}
    />
  )
}

export default FormDatePicker
