import { useInfiniteMyComplaintsQuery } from '@/api/hooks/useComplaint'
import ComplaintCard from '@/components/shared/Cards/ComplaintCard'
import { HEADER_HEIGHT } from '@/constants/appLimits'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import type { ComplaintResponseDto } from '@/types'
import { router } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import React, { useCallback, useMemo, useRef } from 'react'
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const PAGE_SIZE = 20

const MyComplaintPage: React.FC = () => {
    const colors = useThemeColors()
    const { t } = useTranslations()
    const insets = useSafeAreaInsets()
    const loadMoreInFlightRef = useRef(false)

    const {
        data,
        isFetching,
        isFetchingNextPage,
        isError,
        hasNextPage,
        fetchNextPage,
        refetch,
    } = useInfiniteMyComplaintsQuery({ pageSize: PAGE_SIZE })

    const complaints: ComplaintResponseDto[] = useMemo(
        () => data?.pages.flatMap((page) => page.data?.data ?? []) ?? [],
        [data],
    )

    const isInitialLoading = isFetching && complaints.length === 0 && !isError
    const isRefreshing = isFetching && complaints.length > 0 && !isFetchingNextPage

    const handleLoadMore = useCallback(() => {
        if (loadMoreInFlightRef.current || !hasNextPage || isFetchingNextPage) return
        loadMoreInFlightRef.current = true
        fetchNextPage().finally(() => {
            loadMoreInFlightRef.current = false
        })
    }, [hasNextPage, isFetchingNextPage, fetchNextPage])

    const renderItem = useCallback(
        ({ item }: { item: ComplaintResponseDto }) => <ComplaintCard item={item} />,
        [],
    )

    const keyExtractor = useCallback((item: ComplaintResponseDto) => item.id.toString(), [])

    const ListFooterComponent = isFetchingNextPage ? (
        <ActivityIndicator
            size='small'
            color={colors.primaryColor}
            style={styles.footerSpinner}
        />
    ) : null

    const renderEmptyState = () => {
        if (isInitialLoading) return null
        return (
            <View style={styles.emptyBox}>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    {t('my_complaints.empty_title')}
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.subText ?? colors.textMuted }]}>
                    {t('my_complaints.empty_subtitle')}
                </Text>
            </View>
        )
    }

    if (isError && complaints.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: colors.profileBackground }]}>
                <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.borderColor }]}>
                    <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
                        <ArrowLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        {t('my_complaints.title')}
                    </Text>
                    <View style={styles.headerSpacer} />
                </View>

                <View style={styles.emptyBox}>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>
                        {t('my_complaints.error')}
                    </Text>
                    <TouchableOpacity
                        style={[styles.retryButton, { backgroundColor: colors.primaryColor }]}
                        onPress={() => refetch()}
                    >
                        <Text style={styles.retryButtonText}>{t('my_complaints.retry')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.profileBackground }]}>
            <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.borderColor }]}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                    {t('my_complaints.title')}
                </Text>
                <View style={styles.headerSpacer} />
            </View>

            {isInitialLoading ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size='large' color={colors.primaryColor} />
                </View>
            ) : (
                <FlatList
                    data={complaints}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 16 }]}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.4}
                    ListEmptyComponent={renderEmptyState()}
                    ListFooterComponent={ListFooterComponent}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={refetch}
                            tintColor={colors.primaryColor}
                        />
                    }
                />
            )}
        </View>
    )
}

export default MyComplaintPage

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: HEADER_HEIGHT,
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '700',
    },
    headerSpacer: {
        width: 24,
        height: 24,
    },
    listContent: {
        paddingTop: 8,
    },
    loadingBox: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyBox: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
        paddingHorizontal: 24,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 13,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    footerSpinner: {
        paddingVertical: 16,
    },
})
