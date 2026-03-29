import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import {
    AlertTriangle,
    CheckCircle2,
    Info,
    XCircle,
} from 'lucide-react-native'
import React, { useEffect, useRef } from 'react'
import {
    Animated,
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

const ICON_SIZE = 32

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

    const scaleAnim = useRef(new Animated.Value(0.88)).current
    const opacityAnim = useRef(new Animated.Value(0)).current

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    damping: 18,
                    stiffness: 260,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 180,
                    useNativeDriver: true,
                }),
            ]).start()
        } else {
            scaleAnim.setValue(0.88)
            opacityAnim.setValue(0)
        }
    }, [visible])

    const defaultPrimaryText = primaryButtonText ?? t('common.ok')

    const getAlertConfig = () => {
        switch (type) {
            case 'error':
                return {
                    icon: <XCircle size={ICON_SIZE} color="#fff" strokeWidth={2.2} />,
                    iconBg: '#EF4444',
                    accentColor: '#EF4444',
                    pillBg: '#FEE2E2',
                    defaultTitle: t('alert.error_title'),
                }
            case 'success':
                return {
                    icon: <CheckCircle2 size={ICON_SIZE} color="#fff" strokeWidth={2.2} />,
                    iconBg: '#02A348',
                    accentColor: '#02A348',
                    pillBg: '#D1FAE5',
                    defaultTitle: t('alert.success_title'),
                }
            case 'warning':
                return {
                    icon: <AlertTriangle size={ICON_SIZE} color="#fff" strokeWidth={2.2} />,
                    iconBg: '#F59E0B',
                    accentColor: '#F59E0B',
                    pillBg: '#FEF3C7',
                    defaultTitle: t('alert.warning_title'),
                }
            case 'info':
            default:
                return {
                    icon: <Info size={ICON_SIZE} color="#fff" strokeWidth={2.2} />,
                    iconBg: colors.primaryColor,
                    accentColor: colors.primaryColor,
                    pillBg: colors.primaryColor + '18',
                    defaultTitle: t('alert.info_title'),
                }
        }
    }

    const config = getAlertConfig()
    const displayTitle = title ?? config.defaultTitle

    const handleBackdropPress = () => {
        if (dismissOnBackdrop && onDismiss) onDismiss()
    }

    const handlePrimaryPress = () => {
        if (onPrimaryPress) onPrimaryPress()
        else if (onDismiss) onDismiss()
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onDismiss}
        >
            <TouchableWithoutFeedback onPress={handleBackdropPress}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <Animated.View
                            style={[
                                styles.container,
                                { backgroundColor: colors.background },
                                { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
                            ]}
                        >
                            {/* Accent top bar */}
                            <View style={[styles.accentBar, { backgroundColor: config.accentColor }]} />

                            {/* Icon pill */}
                            <View style={[styles.iconPill, { backgroundColor: config.pillBg }]}>
                                <View style={[styles.iconCircle, { backgroundColor: config.iconBg }]}>
                                    {config.icon}
                                </View>
                            </View>

                            {/* Content */}
                            <View style={styles.content}>
                                <Text style={[styles.title, { color: colors.text }]}>
                                    {displayTitle}
                                </Text>
                                <Text style={[styles.message, { color: colors.textMuted }]}>
                                    {message}
                                </Text>
                            </View>

                            {/* Divider */}
                            <View style={[styles.divider, { backgroundColor: colors.borderColor }]} />

                            {/* Buttons */}
                            <View style={styles.buttonContainer}>
                                {secondaryButtonText && (
                                    <TouchableOpacity
                                        style={[styles.secondaryButton, { borderColor: colors.borderColor, backgroundColor: colors.card }]}
                                        onPress={onSecondaryPress}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                                            {secondaryButtonText}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    style={[
                                        styles.primaryButton,
                                        { backgroundColor: config.accentColor },
                                        !secondaryButtonText && styles.fullWidthButton,
                                    ]}
                                    onPress={handlePrimaryPress}
                                    activeOpacity={0.82}
                                >
                                    <Text style={styles.primaryButtonText}>
                                        {defaultPrimaryText}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 28,
    },
    container: {
        width: '100%',
        maxWidth: 360,
        borderRadius: 20,
        overflow: 'hidden',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
        elevation: 12,
    },
    accentBar: {
        width: '100%',
        height: 4,
    },
    iconPill: {
        marginTop: 28,
        marginBottom: 4,
        borderRadius: 40,
        padding: 14,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.2,
    },
    message: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 21,
    },
    divider: {
        width: '100%',
        height: 1,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        padding: 16,
        gap: 10,
    },
    primaryButton: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fullWidthButton: {
        flex: 1,
    },
    secondaryButton: {
        flex: 1,
        paddingVertical: 13,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.1,
    },
    secondaryButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
})

export default CustomAlert
