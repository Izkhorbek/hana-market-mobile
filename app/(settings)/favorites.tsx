import { useLikedProductsQuery } from '@/api/hooks'
import ProductCard from '@/components/shared/Cards/ProductCard'
import { HEADER_HEIGHT, HEADER_PADDING_TOP } from '@/constants/appLimits'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { LikedProductDto } from '@/types'
import { router } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import React, { useMemo } from 'react'
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

const FavoritesPage: React.FC = () => {
    const colors = useThemeColors()
    const { t } = useTranslations()
    const insets = useSafeAreaInsets()

    const { data, isFetching, isError, refetch } = useLikedProductsQuery({
        querySettings: { staleTime: 1000 * 30 },
    })

    const products: LikedProductDto[] = useMemo(() => data?.data?.data ?? [], [data])

    const isInitialLoading = isFetching && products.length === 0
    const isRefreshing = isFetching && products.length > 0

    const handleOpenProduct = (productId: number) => {
        router.push(`/product/${productId}`)
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
                    <Text style={[styles.headerTitle, { color: colors.text }]}>{t('profile.favorites')}</Text>
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
        <View style={[styles.container, { backgroundColor: colors.profileBackground }]}>
            <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.borderColor }]}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
                    <ArrowLeft size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                    {t('profile.favorites')}
                </Text>
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
                            distance=''
                            status={item.status ?? ''}
                            main_image_url={item.main_image_url ?? ''}
                            created_ago={item.created_ago ?? ''}
                            moljal=''
                            is_free={!item.price}
                            price={item.price ?? ''}
                            likes_count={item.likes_count ?? 0}
                            view_count={0}
                            onPress={() => handleOpenProduct(item.product_id || item.id)}
                        />
                    )}
                    ListEmptyComponent={renderEmptyState()}
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

export default FavoritesPage

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: HEADER_HEIGHT,
        paddingTop: HEADER_PADDING_TOP,
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
})
