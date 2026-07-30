import { useThemeColors } from '@/hooks/use-theme-colors'
import React from 'react'
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export interface ActionSheetOption {
  label: string
  onPress: () => void
  /** Renders the label in the destructive (red) color. */
  destructive?: boolean
  disabled?: boolean
}

interface ActionSheetProps {
  visible: boolean
  onClose: () => void
  /** Optional heading shown above the options. */
  title?: string
  options: ActionSheetOption[]
  /** Label for the always-present cancel button. */
  cancelLabel: string
}

const DESTRUCTIVE = '#E5484D'

/**
 * Cross-platform bottom-sheet action menu.
 *
 * Replaces `Alert.alert(title, msg, [...])` for menus with more than two
 * choices: Android's native alert only renders up to THREE buttons, so a
 * 4–5 option menu silently drops buttons (typically Cancel). This sheet has no
 * such limit and looks consistent on both platforms.
 */
const ActionSheet: React.FC<ActionSheetProps> = ({
  visible,
  onClose,
  title,
  options,
  cancelLabel,
}) => {
  const colors = useThemeColors()
  const insets = useSafeAreaInsets()

  const handlePress = (opt: ActionSheetOption) => {
    if (opt.disabled) return
    // Close first, then run the action on the next tick so a follow-up
    // confirmation Alert isn't presented under the dismissing sheet.
    onClose()
    setTimeout(() => opt.onPress(), 0)
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={[styles.group, { backgroundColor: colors.background }]}>
          {title ? (
            <View style={[styles.titleRow, { borderBottomColor: colors.borderColor }]}>
              <Text style={[styles.title, { color: colors.textMuted }]} numberOfLines={1}>
                {title}
              </Text>
            </View>
          ) : null}

          {options.map((opt, i) => (
            <TouchableOpacity
              key={`${opt.label}-${i}`}
              style={[
                styles.row,
                i < options.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.borderColor,
                },
              ]}
              onPress={() => handlePress(opt)}
              disabled={opt.disabled}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.rowText,
                  {
                    color: opt.destructive ? DESTRUCTIVE : colors.text,
                    opacity: opt.disabled ? 0.4 : 1,
                  },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.group, styles.cancelGroup, { backgroundColor: colors.background }]}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Text style={[styles.rowText, styles.cancelText, { color: colors.primaryColor }]}>
            {cancelLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

export default ActionSheet

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  wrap: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 0,
  },
  group: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  cancelGroup: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    // Match the option rows' height so Cancel reads as a full-size button
    // (previously it only had the text's line-height and looked cramped).
    paddingVertical: 18,
  },
  titleRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
  },
  row: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  rowText: {
    fontSize: 16,
    fontWeight: '500',
  },
  cancelText: {
    fontWeight: '700',
  },
})
