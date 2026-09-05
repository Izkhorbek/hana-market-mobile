import { useDeleteServiceMutation, useMyServicesQuery } from '@/api/hooks'
import MyServiceCard from '@/components/shared/Cards/MyServiceCard'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import type { ServiceListItemDto } from '@/types'
import { type Href, router } from 'expo-router'
import { ArrowLeft, Plus } from 'lucide-react-native'
import React, { useMemo, useState } from 'react'
import {
	ActivityIndicator,
	Alert,
	FlatList,
	RefreshControl,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'

/**
 * The provider's own services, with delete.
 *
 * No status tabs, unlike my-listings: `ServiceListItemDto` carries no `status`,
 * so there is nothing to say whether a service is active or hidden — see the
 * note in the service handoff. Editing arrives with its own screen.
 */
const MyServicesPage = () => {
	const { t } = useTranslations()
	const colors = useThemeColors()
	const [deletingId, setDeletingId] = useState<number | null>(null)

	const { data, isLoading, refetch, isRefetching } = useMyServicesQuery({
		querySettings: { refetchOnMount: 'always' },
	})

	const { mutate: deleteService } = useDeleteServiceMutation({
		onSuccess: () => {
			Alert.alert(t('edit_profile.success'), t('my_services.delete_success'))
			refetch()
		},
		onError: () => {
			Alert.alert(t('edit_profile.error'), t('my_services.delete_error'))
		},
		onSettled: () => setDeletingId(null),
	})

	const services: ServiceListItemDto[] = useMemo(() => data?.data?.data ?? [], [data])

	// Opens the public detail so the provider sees exactly what a neighbour sees.
	const handlePress = (id: number) => router.push(`/service/${id}` as Href)

	const handleMenuPress = (service: ServiceListItemDto) => {
		if (deletingId) return

		Alert.alert(t('my_services.actions_title'), service.title ?? '', [
			{ text: t('common.cancel'), style: 'cancel' },
			{
				text: t('my_services.edit'),
				onPress: () => router.push(`/(post)/edit-service/${service.id}` as Href),
			},
			{
				text: t('my_services.delete'),
				style: 'destructive',
				onPress: () => confirmDelete(service),
			},
		])
	}

	const confirmDelete = (service: ServiceListItemDto) => {
		Alert.alert(t('my_services.delete_confirm_title'), t('my_services.delete_confirm_message'), [
			{ text: t('common.cancel'), style: 'cancel' },
			{
				text: t('my_services.delete'),
				style: 'destructive',
				onPress: () => {
					setDeletingId(service.id)
					deleteService(service.id)
				},
			},
		])
	}

	const renderItem = ({ item }: { item: ServiceListItemDto }) => (
		<MyServiceCard
			id={String(item.id)}
			title={item.title ?? ''}
			category={item.category}
			category_name={item.category_name ?? ''}
			image={item.main_image_url ?? ''}
			price={item.price ?? ''}
			price_type_name={item.price_type_name ?? undefined}
			created_ago={item.created_ago ?? ''}
			onPress={() => handlePress(item.id)}
			onMenuPress={() => handleMenuPress(item)}
		/>
	)

	const renderEmptyState = () => (
		<View style={styles.emptyContainer}>
			{isLoading ? (
				<ActivityIndicator size='large' color={colors.primaryColor} />
			) : (
				<>
					<Text style={[styles.emptyText, { color: colors.textMuted }]}>
						{t('my_services.empty_state')}
					</Text>
					<TouchableOpacity
						style={[styles.emptyBtn, { backgroundColor: colors.primaryColor }]}
						onPress={() => router.push('/create-service' as Href)}
						activeOpacity={0.85}
					>
						<Text style={styles.emptyBtnText}>{t('service.post_service')}</Text>
					</TouchableOpacity>
				</>
			)}
		</View>
	)

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
				<TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={10}>
					<ArrowLeft size={24} color={colors.text} />
				</TouchableOpacity>
				<Text style={[styles.headerTitle, { color: colors.text }]}>
					{t('my_services.title')}
				</Text>
				<TouchableOpacity
					onPress={() => router.push('/create-service' as Href)}
					style={styles.headerBtn}
					hitSlop={10}
				>
					<Plus size={22} color={colors.primaryColor} />
				</TouchableOpacity>
			</View>

			<FlatList
				data={services}
				renderItem={renderItem}
				keyExtractor={(item) => String(item.id)}
				contentContainerStyle={styles.listContent}
				showsVerticalScrollIndicator={false}
				ListEmptyComponent={renderEmptyState}
				refreshControl={
					<RefreshControl
						refreshing={isRefetching}
						onRefresh={refetch}
						tintColor={colors.primaryColor}
						colors={[colors.primaryColor]}
					/>
				}
			/>
		</View>
	)
}

export default MyServicesPage

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	headerBtn: {
		width: 40,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center',
	},
	headerTitle: {
		fontSize: 17,
		fontWeight: '600',
		letterSpacing: -0.2,
	},
	listContent: {
		flexGrow: 1,
		paddingBottom: 24,
	},
	emptyContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingTop: 80,
		paddingHorizontal: 32,
		gap: 16,
	},
	emptyText: {
		fontSize: 14,
		textAlign: 'center',
	},
	emptyBtn: {
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 12,
	},
	emptyBtnText: {
		color: '#fff',
		fontSize: 14,
		fontWeight: '600',
	},
})
