import { useColorScheme } from '@/hooks/use-color-scheme'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { router } from 'expo-router'
import { AlertTriangle, MapPin, Navigation } from 'lucide-react-native'
import React from 'react'
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface LocationMismatchModalProps {
    visible: boolean
    onClose: () => void
    storedLocation?: {
        address?: string
        latitude: number
        longitude: number
    }
    currentLocation?: {
        address?: string
        latitude: number
        longitude: number
    }
    distanceKm?: number
}

/**
 * Modal component that informs users when their stored location
 * differs from their current GPS location.
 * Offers options to update location or dismiss.
 */
const LocationMismatchModal: React.FC<LocationMismatchModalProps> = ({
    visible,
    onClose,
    storedLocation,
    currentLocation,
    distanceKm,
}) => {
    const { t } = useTranslations()
    const colors = useThemeColors()
    const colorScheme = useColorScheme()

    const handleUpdateLocation = () => {
        onClose()
        router.push('/(settings)/manage')
    }

    const handleKeepCurrent = () => {
        onClose()
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.background }]}>
                    {/* Icon */}
                    <View
                        style={[
                            styles.iconContainer,
                            { backgroundColor: colorScheme === 'dark' ? '#3D2E1C' : '#FEF3E6' },
                        ]}
                    >
                        <AlertTriangle size={32} color="#F59E0B" />
                    </View>

                    {/* Title */}
                    <Text style={[styles.title, { color: colors.text }]}>
                        {t('location_mismatch.title')}
                    </Text>

                    {/* Description */}
                    <Text style={[styles.description, { color: colors.textMuted }]}>
                        {t('location_mismatch.description')}
                    </Text>

                    {/* Location Comparison */}
                    <View style={styles.locationComparison}>
                        {/* Stored Location */}
                        <View style={[styles.locationCard, { backgroundColor: colors.card }]}>
                            <View style={styles.locationHeader}>
                                <View
                                    style={[
                                        styles.locationIconSmall,
                                        { backgroundColor: colorScheme === 'dark' ? '#1C3D2E' : '#E6F4ED' },
                                    ]}
                                >
                                    <MapPin size={16} color={colors.primaryColor} />
                                </View>
                                <Text style={[styles.locationLabel, { color: colors.textMuted }]}>
                                    {t('location_mismatch.stored_location')}
                                </Text>
                            </View>
                            <Text style={[styles.locationAddress, { color: colors.text }]} numberOfLines={2}>
                                {storedLocation?.address || t('location_mismatch.unknown_location')}
                            </Text>
                        </View>

                        {/* Current Location */}
                        <View style={[styles.locationCard, { backgroundColor: colors.card }]}>
                            <View style={styles.locationHeader}>
                                <View
                                    style={[
                                        styles.locationIconSmall,
                                        { backgroundColor: colorScheme === 'dark' ? '#1C2E3D' : '#E6EFFA' },
                                    ]}
                                >
                                    <Navigation size={16} color="#3B82F6" />
                                </View>
                                <Text style={[styles.locationLabel, { color: colors.textMuted }]}>
                                    {t('location_mismatch.current_location')}
                                </Text>
                            </View>
                            <Text style={[styles.locationAddress, { color: colors.text }]} numberOfLines={2}>
                                {currentLocation?.address || t('location_mismatch.unknown_location')}
                            </Text>
                        </View>
                    </View>

                    {/* Distance Badge */}
                    {distanceKm !== undefined && distanceKm > 0 && (
                        <View
                            style={[
                                styles.distanceBadge,
                                { backgroundColor: colorScheme === 'dark' ? '#3D2E1C' : '#FEF3E6' },
                            ]}
                        >
                            <Text style={[styles.distanceText, { color: '#F59E0B' }]}>
                                {t('location_mismatch.distance_away', { distance: distanceKm.toFixed(1) })}
                            </Text>
                        </View>
                    )}

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.secondaryButton, { borderColor: colors.borderColor }]}
                            onPress={handleKeepCurrent}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                                {t('location_mismatch.keep_current')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.primaryButton, { backgroundColor: colors.primaryColor }]}
                            onPress={handleUpdateLocation}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.primaryButtonText}>
                                {t('location_mismatch.update_location')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    )
}

export default LocationMismatchModal

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
        maxWidth: 360,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
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
    description: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    locationComparison: {
        width: '100%',
        gap: 12,
        marginBottom: 16,
    },
    locationCard: {
        padding: 14,
        borderRadius: 12,
    },
    locationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    locationIconSmall: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    locationLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    locationAddress: {
        fontSize: 15,
        fontWeight: '500',
        marginLeft: 36,
    },
    distanceBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 20,
    },
    distanceText: {
        fontSize: 13,
        fontWeight: '600',
    },
    buttonContainer: {
        width: '100%',
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryButton: {
        borderWidth: 1.5,
    },
    primaryButton: {},
    secondaryButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    primaryButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
})
