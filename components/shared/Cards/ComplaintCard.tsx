import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import type { ComplaintResponseDto } from '@/types'
import { parseBackendDateTime } from '@/utils/dateTime'
import React, { memo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface ComplaintCardProps {
    item: ComplaintResponseDto
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    pending: { bg: '#FEF3C7', text: '#B45309' },
    resolved: { bg: '#D1FAE5', text: '#065F46' },
    rejected: { bg: '#FEE2E2', text: '#B91C1C' },
}

const STATUS_COLORS_DARK: Record<string, { bg: string; text: string }> = {
    pending: { bg: '#451A03', text: '#FCD34D' },
    resolved: { bg: '#064E3B', text: '#6EE7B7' },
    rejected: { bg: '#450A0A', text: '#FCA5A5' },
}

const ComplaintCard: React.FC<ComplaintCardProps> = ({ item }) => {
    const colors = useThemeColors()
    const { t } = useTranslations()

    const isDark = colors.background === '#0D0D0D' || colors.background === '#1a1a1a' || colors.background === '#000000'
    const statusMap = isDark ? STATUS_COLORS_DARK : STATUS_COLORS

    const normalizedStatus = (item.status ?? '').toLowerCase()
    const statusColor = statusMap[normalizedStatus] ?? { bg: `${colors.textMuted}22`, text: colors.textMuted }

    const statusLabel = (() => {
        switch (normalizedStatus) {
            case 'pending': return t('my_complaints.status_pending')
            case 'resolved': return t('my_complaints.status_resolved')
            case 'rejected': return t('my_complaints.status_rejected')
            default: return item.status ?? ''
        }
    })()

    const formattedDate = (() => {
        try {
            return parseBackendDateTime(item.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            })
        } catch {
            return item.created_at ?? ''
        }
    })()

    const typeName = item.complaint_type?.display_name || item.complaint_type?.name || ''

    return (
        <View style={[styles.card, { backgroundColor: colors.card ?? colors.background, borderColor: colors.borderColor }]}>
            {/* Header row */}
            <View style={styles.headerRow}>
                <Text style={[styles.typeName, { color: colors.text }]} numberOfLines={1}>
                    {typeName}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                    <Text style={[styles.statusText, { color: statusColor.text }]}>
                        {statusLabel}
                    </Text>
                </View>
            </View>

            {/* Reference row */}
            {item.reported_product_id != null && (
                <Text style={[styles.reference, { color: colors.subText ?? colors.textMuted }]}>
                    {t('my_complaints.reported_product', { id: item.reported_product_id })}
                </Text>
            )}
            {item.reported_user_id != null && item.reported_product_id == null && (
                <Text style={[styles.reference, { color: colors.subText ?? colors.textMuted }]}>
                    {t('my_complaints.reported_user', { id: item.reported_user_id })}
                </Text>
            )}

            {/* Description */}
            <Text
                style={[styles.description, { color: colors.subText ?? colors.textMuted }]}
                numberOfLines={2}
            >
                {item.description?.trim() || t('my_complaints.no_description')}
            </Text>

            {/* Date */}
            <Text style={[styles.date, { color: colors.textMuted }]}>
                {formattedDate}
            </Text>
        </View>
    )
}

export default memo(ComplaintCard)

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 12,
        marginVertical: 6,
        borderRadius: 14,
        borderWidth: 1,
        padding: 14,
        gap: 6,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    typeName: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    reference: {
        fontSize: 13,
    },
    description: {
        fontSize: 13,
        lineHeight: 19,
    },
    date: {
        fontSize: 12,
        marginTop: 2,
    },
})
