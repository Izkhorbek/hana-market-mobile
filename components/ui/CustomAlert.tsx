import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react-native'
import React from 'react'
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native'

export type AlertType = 'error' | 'success' | 'warning' | 'info'

export interface CustomAlertProps {
    visible: boolean
    type?: AlertType
    title?: string
    message: string
    /** Primary action button text */
    primaryButtonText?: string
    /** Secondary action button text (optional) */
    secondaryButtonText?: string
    /** Called when primary button is pressed */
    onPrimaryPress?: () => void
    /** Called when secondary button is pressed */
    onSecondaryPress?: () => void
    /** Called when alert is dismissed (backdrop press or close) */
    onDismiss?: () => void
    /** Whether to show close button */
    showCloseButton?: boolean
    /** Whether to close on backdrop press */
    dismissOnBackdrop?: boolean
}

const ICON_SIZE = 48

const CustomAlert: React.FC<CustomAlertProps> = ({
    visible,
    type = 'info',
    title,
    message,
    primaryButtonText,
    secondaryButtonText,
    onPrimaryPress,
    onSecondaryPress,
    onDismiss,
    showCloseButton = false,
    dismissOnBackdrop = true,
}) => {
    const colors = useThemeColors()
    const { t } = useTranslations()

    // Default button text based on type
    const defaultPrimaryText = primaryButtonText ?? t('common.ok')

    // Get icon and color based on type
    const getAlertConfig = () => {
        switch (type) {
            case 'error':
                return {
                    icon: <XCircle size={ICON_SIZE} color="#EF4444" />,
                    backgroundColor: '#FEE2E2',
                    borderColor: '#EF4444',
                    defaultTitle: t('alert.error_title'),
                }
            case 'success':
                return {
                    icon: <CheckCircle size={ICON_SIZE} color="#10B981" />,
                    backgroundColor: '#D1FAE5',
                    borderColor: '#10B981',
                    defaultTitle: t('alert.success_title'),
                }
            case 'warning':
                return {
                    icon: <AlertCircle size={ICON_SIZE} color="#F59E0B" />,
                    backgroundColor: '#FEF3C7',
                    borderColor: '#F59E0B',
                    defaultTitle: t('alert.warning_title'),
                }
            case 'info':
            default:
                return {
                    icon: <Info size={ICON_SIZE} color={colors.primaryColor} />,
                    backgroundColor: colors.primaryColor + '20',
                    borderColor: colors.primaryColor,
                    defaultTitle: t('alert.info_title'),
                }
        }
    }

    const config = getAlertConfig()
    const displayTitle = title ?? config.defaultTitle

    const handleBackdropPress = () => {
        if (dismissOnBackdrop && onDismiss) {
            onDismiss()
        }
    }

    const handlePrimaryPress = () => {
        if (onPrimaryPress) {
            onPrimaryPress()
        } else if (onDismiss) {
            onDismiss()
        }
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onDismiss}
        >
            <TouchableWithoutFeedback onPress={handleBackdropPress}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={[styles.container, { backgroundColor: colors.background }]}>
                            {/* Icon */}
                            <View style={[styles.iconContainer, { backgroundColor: config.backgroundColor }]}>
                                {config.icon}
                            </View>

                            {/* Title */}
                            <Text style={[styles.title, { color: colors.text }]}>
                                {displayTitle}
                            </Text>

                            {/* Message */}
                            <Text style={[styles.message, { color: colors.textMuted }]}>
                                {message}
                            </Text>

                            {/* Buttons */}
                            <View style={styles.buttonContainer}>
                                {secondaryButtonText && (
                                    <TouchableOpacity
                                        style={[styles.button, styles.secondaryButton, { borderColor: colors.borderColor }]}
                                        onPress={onSecondaryPress}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.buttonText, { color: colors.text }]}>
                                            {secondaryButtonText}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    style={[
                                        styles.button,
                                        styles.primaryButton,
                                        { backgroundColor: colors.primaryColor },
                                        secondaryButtonText ? { flex: 1 } : { width: '100%' },
                                    ]}
                                    onPress={handlePrimaryPress}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.buttonText, styles.primaryButtonText]}>
                                        {defaultPrimaryText}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    container: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButton: {
        minWidth: 120,
    },
    secondaryButton: {
        flex: 1,
        borderWidth: 1,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    primaryButtonText: {
        color: '#FFFFFF',
    },
})

export default CustomAlert
