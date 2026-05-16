import { useProductsBySellerQuery } from '@/api/hooks'
import ProductCard from '@/components/shared/Cards/ProductCard'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import React, { useEffect, useMemo, useState } from 'react'
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

interface SellerProductItem {
    id: number
    title: string | null
    description: string | null
    moljal: string | null
    main_image_url: string | null
    is_free: boolean
    price: string | null
    status: string | null
    distance: string | null
    view_count?: number | null
    views_count?: number | null
    likes_count: number | null
    created_ago: string | null
}

const PAGE_SIZE = 20

const SellerProductsPage: React.FC = () => {
    const { sellerId, sellerName } = useLocalSearchParams<{ sellerId?: string; sellerName?: string }>()
    const parsedSellerId = sellerId ? parseInt(sellerId, 10) : 0
    const colors = useThemeColors()
    const { t } = useTranslations()
    const insets = useSafeAreaInsets()

    const [page, setPage] = useState(1)
    const [products, setProducts] = useState<SellerProductItem[]>([])

    const { data, isFetching, isError, refetch } = useProductsBySellerQuery({
        sellerId: parsedSellerId,
        page,
        pageSize: PAGE_SIZE,
        querySettings: { enabled: parsedSellerId > 0 },
    })

    const pageData = data?.data?.data
    const pageItems: SellerProductItem[] = pageData?.items ?? []
    const totalRecords = pageData?.total_records ?? 0

    useEffect(() => {
        if (page === 1) {
            setProducts(pageItems)
            return
        }

        if (pageItems.length === 0) return

        setProducts((prev) => {
            const seenIds = new Set(prev.map((item) => item.id))
            const nextItems = pageItems.filter((item) => !seenIds.has(item.id))
            return [...prev, ...nextItems]
        })
    }, [page, pageItems])

    const hasMore = products.length < totalRecords
    const isInitialLoading = isFetching && page === 1 && products.length === 0
    const isRefreshing = isFetching && page === 1 && products.length > 0
    const isLoadingMore = isFetching && page > 1

    const sellerLabel = useMemo(() => {
        if (typeof sellerName === 'string' && sellerName.trim().length > 0) return sellerName
        return null
    }, [sellerName])

    const handleOpenProduct = (id: number) => {
        router.push(`/product/${id}`)
    }

    const handleLoadMore = () => {
        if (!hasMore || isFetching || parsedSellerId <= 0) return
        setPage((prev) => prev + 1)
    }

    const handleRefresh = async () => {
        setPage(1)
        setProducts([])
        await refetch()
    }

    const renderEmptyState = () => {
        if (isInitialLoading) return null

        return (
            <View style={styles.emptyBox}>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    {t('home.empty_state')}
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.subText ?? colors.textMuted }]}>
                    {t('home.empty_state_sub')}
                </Text>
            </View>
        )
    }

    if (isError && products.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: colors.profileBackground }]}>
                <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.borderColor }]}>
                    <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
                        <ArrowLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>{t('product_detail.more_from_seller')}</Text>
                    <View style={styles.headerSpacer} />
                </View>
                <View style={styles.emptyBox}>
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('home.error')}</Text>
                    <TouchableOpacity
                        style={[styles.retryButton, { backgroundColor: colors.primaryColor }]}
                        onPress={() => refetch()}
                    >
                        <Text style={styles.retryButtonText}>{t('home.retry')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        )
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.profileBackground}]}>
            <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.borderColor }]}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerTextWrap}>
                    <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                        {t('product_detail.more_from_seller')}
                    </Text>
                    {sellerLabel ? (
                        <Text style={[styles.headerSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
                            {sellerLabel}
                        </Text>
                    ) : null}
                </View>
                <View style={styles.headerSpacer} />
            </View>

            {isInitialLoading ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size='large' color={colors.primaryColor} />
                </View>
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={(item) => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom }]}
                    renderItem={({ item }) => (
                        <ProductCard
                            title={item.title ?? ''}
                            description={item.description ?? ''}
                            distance={item.distance ?? ''}
                            status={item.status ?? ''}
                            main_image_url={item.main_image_url ?? ''}
                            created_ago={item.created_ago ?? ''}
                            moljal={item.moljal ?? ''}
                            is_free={item.is_free}
                            price={item.price ?? ''}
                            likes_count={item.likes_count ?? 0}
                            view_count={item.view_count ?? item.views_count ?? 0}
                            onPress={() => handleOpenProduct(item.id)}
                        />
                    )}
                    ListEmptyComponent={renderEmptyState()}
                    ListFooterComponent={isLoadingMore ? <ActivityIndicator style={styles.footerLoader} color={colors.primaryColor} /> : null}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.35}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            tintColor={colors.primaryColor}
                        />
                    }
                />
            )}
        </View>
    )
}

export default SellerProductsPage

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTextWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    headerSubtitle: {
        fontSize: 12,
    },
    headerSpacer: {
        width: 24,
        height: 24,
    },
    listContent: {
        paddingTop: 8,
        paddingBottom: 16,
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
    footerLoader: {
        paddingVertical: 16,
    },
})