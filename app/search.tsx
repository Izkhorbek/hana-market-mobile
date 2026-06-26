import { useCategoriesQuery, useInfiniteProductsQuery } from '@/api/hooks'
import ProductCard from '@/components/shared/Cards/ProductCard'
import MarketplaceEmptyState, { type EmptyReason } from '@/components/shared/MarketplaceEmptyState'
import { HEADER_HEIGHT } from '@/constants/appLimits'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useAuthStore } from '@/modules/Auth/auth-store'
import type { ApiResponse, Category, PaginatedResponse } from '@/types'
import { AxiosResponse } from 'axios'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Search } from 'lucide-react-native'
import React, { useEffect, useMemo, useState } from 'react'
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface ProductItem {
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

const DEFAULT_LAT = 41.311081
const DEFAULT_LNG = 69.240562
const PAGE_SIZE = 20
const DEBOUNCE_MS = 400

const SearchPage: React.FC = () => {
    const { t, locale } = useTranslations()
    const colors = useThemeColors()
    const insets = useSafeAreaInsets()
    const user = useAuthStore((s) => s.user)
    const { categoryId } = useLocalSearchParams<{ categoryId?: string }>()

    const [query, setQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)

    const userLat = user?.latitude ?? DEFAULT_LAT
    const userLng = user?.longitude ?? DEFAULT_LNG

    const { data: categoriesRes } = useCategoriesQuery()
    const categories = categoriesRes?.data?.data ?? []

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedQuery(query.trim())
        }, DEBOUNCE_MS)

        return () => clearTimeout(timeout)
    }, [query])

    useEffect(() => {
        if (!categoryId) return

        const parsedCategoryId = Number(categoryId)
        if (!Number.isFinite(parsedCategoryId) || parsedCategoryId <= 0) return

        setSelectedCategoryId((prev) => (prev === parsedCategoryId ? prev : parsedCategoryId))
    }, [categoryId])

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isFetching,
        isError,
        refetch,
    } = useInfiniteProductsQuery({
        params: {
            user_lat: userLat,
            user_long: userLng,
            page_size: PAGE_SIZE,
            search_query: debouncedQuery || undefined,
            category_id: selectedCategoryId ?? undefined,
        },
    })

    const products: ProductItem[] = useMemo(
        () =>
            data?.pages.flatMap(
                (page: AxiosResponse<ApiResponse<PaginatedResponse<any>>>) =>
                    page.data?.data?.items ?? [],
            ) ?? [],
        [data],
    )

    const isInitialLoading = isFetching && products.length === 0
    const isRefreshing = isFetching && !isFetchingNextPage && products.length > 0

    const getCategoryName = (category: Category) => (locale === 'ru' ? category.name_ru : category.name_uz)

    const categoryChips = useMemo(
        () => categories.map((item) => ({ id: item.id, name: getCategoryName(item) })),
        [categories, locale],
    )

    const renderCategoryChip = ({ item }: { item: { id: number; name: string } }) => {
        const isSelected = selectedCategoryId === item.id

        return (
            <TouchableOpacity
                activeOpacity={0.75}
                style={[
                    styles.categoryChip,
                    {
                        backgroundColor: isSelected ? `${colors.primaryColor}1A` : colors.background,
                        borderColor: isSelected ? colors.primaryColor : colors.borderColor,
                    },
                ]}
                onPress={() => setSelectedCategoryId(item.id)}
            >
                <Text
                    style={[
                        styles.categoryChipText,
                        { color: isSelected ? colors.primaryColor : colors.text },
                    ]}
                    numberOfLines={1}
                >
                    {item.name}
                </Text>
            </TouchableOpacity>
        )
    }

    const handleProductPress = (id: number) => {
        router.push(`/product/${id}`)
    }

    const handleLoadMore = () => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
        }
    }

    const handleClearFilters = () => {
        setQuery('')
        setDebouncedQuery('')
        setSelectedCategoryId(null)
    }

    const renderEmptyState = () => {
        if (isInitialLoading) return null

        // A query → no search results; an active category filter → too strict;
        // otherwise the (default) nearby browse is simply empty.
        const emptyReason: EmptyReason = debouncedQuery
            ? 'NO_SEARCH_RESULTS'
            : selectedCategoryId != null
                ? 'FILTER_TOO_STRICT'
                : 'NO_NEARBY_PRODUCTS'

        return (
            <MarketplaceEmptyState
                reason={emptyReason}
                onClearFilters={handleClearFilters}
                onExpandRadius={() => router.push('/(settings)/manage')}
                onCreateListing={() => router.push('/(post)/create')}
            />
        )
    }

    if (isError && products.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: colors.profileBackground }]}>
                <View style={[styles.searchHeader, { borderBottomColor: colors.borderColor, backgroundColor: colors.background }]}>
                    <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
                        <ArrowLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View style={[styles.searchInputWrap, { borderColor: colors.borderColor, backgroundColor: colors.profileBackground }]}>
                        <Search size={18} color={colors.textMuted} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            value={query}
                            onChangeText={setQuery}
                            placeholder={t('search_page.placeholder')}
                            placeholderTextColor={colors.textMuted}
                            returnKeyType='search'
                        />
                    </View>
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
            <View style={[styles.searchHeader, { borderBottomColor: colors.borderColor, backgroundColor: colors.background }]}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>

                <View style={[styles.searchInputWrap, { borderColor: colors.borderColor, backgroundColor: colors.profileBackground }]}>
                    <Search size={18} color={colors.textMuted} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        value={query}
                        onChangeText={setQuery}
                        placeholder={t('search_page.placeholder')}
                        placeholderTextColor={colors.textMuted}
                        returnKeyType='search'
                        autoCapitalize='none'
                        autoCorrect={false}
                    />
                </View>
            </View>

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
                        onPress={() => handleProductPress(item.id)}
                    />
                )}
                ListHeaderComponent={
                    <View style={styles.headerContent}>
                        <FlatList
                            horizontal
                            data={categoryChips}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderCategoryChip}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.categoriesContainer}
                        />
                        <Text style={[styles.resultsLabel, { color: colors.textMuted }]}>
                            {t('search_page.search_results')}
                        </Text>
                    </View>
                }
                ListEmptyComponent={renderEmptyState()}
                ListFooterComponent={
                    isFetchingNextPage ? (
                        <ActivityIndicator style={styles.footerLoader} color={colors.primaryColor} />
                    ) : null
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.4}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={refetch}
                        tintColor={colors.primaryColor}
                    />
                }
            />

            {isInitialLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size='large' color={colors.primaryColor} />
                </View>
            )}
        </View>
    )
}

export default SearchPage

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchHeader: {
        height: HEADER_HEIGHT + 20,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    searchInputWrap: {
        flex: 1,
        height: 44,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        height: '100%',
    },
    headerContent: {
        paddingTop: 12,
        paddingBottom: 4,
    },
    categoriesContainer: {
        paddingHorizontal: 10,
        gap: 8,
    },
    categoryChip: {
        height: 34,
        borderRadius: 18,
        borderWidth: 1,
        paddingHorizontal: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryChipText: {
        fontSize: 14,
        fontWeight: '500',
    },
    resultsLabel: {
        fontSize: 13,
        fontWeight: '500',
        paddingTop: 12,
        paddingHorizontal: 10,
    },
    listContent: {
        paddingBottom: 16,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyBox: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 56,
        paddingHorizontal: 24,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
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
