import { HEADER_HEIGHT } from '@/constants/appLimits'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useRouter } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import React from 'react'
import { StyleSheet, TouchableOpacity } from 'react-native'
import { ThemedText } from '../themed-text'
import { ThemedView } from '../themed-view'

interface MapPageHeaderProps {
    title?: string
}

const MapPageHeader: React.FC<MapPageHeaderProps> = ({ title }) => {
    const colors = useThemeColors()
    const { t } = useTranslations()
    const router = useRouter()

    const handleBack = () => {
        router.back()
    }

    return (
        <ThemedView
            style={[
                styles.container,
                { backgroundColor: colors.background, borderBottomColor: colors.borderColor },
            ]}
        >
            <TouchableOpacity
                style={[styles.backButton, { borderColor: colors.borderColor }]}
                onPress={handleBack}
            >
                <ArrowLeft size={24} color={colors.blackIcon} />
            </TouchableOpacity>
            <ThemedText style={[styles.title, { color: colors.text }]}>
                {title || t('map.title')}
            </ThemedText>
            <ThemedView style={styles.placeholder} />
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    container: {
        height: HEADER_HEIGHT,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingBottom: 8,
        borderBottomWidth: 1,
        paddingHorizontal: 12,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        lineHeight: 28,
        fontWeight: '600',
        marginBottom: 4,
    },
    placeholder: {
        width: 44,
        height: 44,
        backgroundColor: 'transparent',
    },
})

export default MapPageHeader
