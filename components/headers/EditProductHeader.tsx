import { HEADER_HEIGHT } from '@/constants/appLimits'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useRouter } from 'expo-router'
import { ArrowLeft, Share2 } from 'lucide-react-native'
import React from 'react'
import { Share, StyleSheet, TouchableOpacity } from 'react-native'
import { ThemedText } from '../themed-text'
import { ThemedView } from '../themed-view'

interface EditProductHeaderProps {
    productTitle?: string
    onShare?: () => void
}

const EditProductHeader: React.FC<EditProductHeaderProps> = ({ productTitle, onShare }) => {
    const colors = useThemeColors()
    const { t } = useTranslations()
    const router = useRouter()

    const handleBack = () => {
        router.back()
    }

    const handleShare = async () => {
        if (onShare) {
            onShare()
            return
        }
        // Default share behavior
        try {
            await Share.share({
                message: productTitle || t('edit_product.share_message'),
            })
        } catch (error) {
            console.error('Error sharing:', error)
        }
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
                <ArrowLeft size={20} color={colors.blackIcon} />
            </TouchableOpacity>
            <ThemedText style={[styles.title, { color: colors.primaryColor }]}>
                {t('edit_product.title')}
            </ThemedText>
            <TouchableOpacity
                style={[styles.shareButton, { borderColor: colors.borderColor }]}
                onPress={handleShare}
            >
                <Share2 size={20} color={colors.blackIcon} />
            </TouchableOpacity>
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
        paddingBottom: 5,
        borderBottomWidth: 1,
        paddingHorizontal: 8,
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
        fontWeight: '600',
    },
    shareButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
})

export default EditProductHeader
