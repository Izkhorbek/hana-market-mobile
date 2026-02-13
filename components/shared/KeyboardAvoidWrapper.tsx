import React from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ScrollViewProps,
    StyleSheet,
    ViewStyle,
} from 'react-native';

interface KeyboardAvoidWrapperProps {
  children: React.ReactNode;
  /** Style applied to the KeyboardAvoidingView container */
  style?: ViewStyle;
  /** Style applied to the ScrollView's content container */
  contentContainerStyle?: ViewStyle;
  /** Whether to include a ScrollView inside (default: true) */
  scrollEnabled?: boolean;
  /** Additional props to pass to the inner ScrollView */
  scrollViewProps?: ScrollViewProps;
}

/**
 * A reusable wrapper that handles keyboard avoidance.
 * Wrap your screen content (inputs + bottom buttons) inside this component
 * so the keyboard doesn't cover them.
 *
 * Usage:
 * ```tsx
 * <KeyboardAvoidWrapper>
 *   <FormInput ... />
 *   <View style={{ marginTop: 'auto' }}>
 *     <Button title="Submit" />
 *   </View>
 * </KeyboardAvoidWrapper>
 * ```
 */
const KeyboardAvoidWrapper = ({
  children,
  style,
  contentContainerStyle,
  scrollEnabled = true,
  scrollViewProps,
}: KeyboardAvoidWrapperProps) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, style]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {scrollEnabled ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          {...scrollViewProps}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default KeyboardAvoidWrapper;
