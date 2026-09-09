import { useDeleteServiceMutation, useMyServicesQuery, useUpdateServiceMutation } from '@/api/hooks'
import MyServiceCard from '@/components/shared/Cards/MyServiceCard'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import type { ServiceListItemDto, ServiceStatus } from '@/types'
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

interface TabItem {
	key: ServiceStatus
	label: string
}

/**
 * The provider's own services, split Active / Hidden like my-listings.
 *
 * `/service/my` returns each row's `status`, so hiding is a visible state the
 * provider can undo — which is also how a photo gets replaced: post the service
 * again with the right photos, then hide or delete the old one.
 */
const MyServicesPage = () => {
	const { t } = useTranslations()
	const colors = useThemeColors()
	const [activeTab, setActiveTab] = useState<ServiceStatus>('active')
	const [deletingId, setDeletingId] = useState<number | null>(null)
	const [statusChangingId, setStatusChangingId] = useState<number | null>(null)

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

	// The hook invalidates MY_SERVICES itself, so the list refreshes on its own.
	const { mutate: updateService } = useUpdateServiceMutation({
		onSuccess: (_response, variables) => {
			const hidden = variables.data.status === 'hidden'
			Alert.alert(
				t('edit_profile.success'),
				hidden ? t('my_services.hide_success') : t('my_services.unhide_success'),
			)
		},
		onError: () => {
			Alert.alert(t('edit_profile.error'), t('my_services.status_error'))
		},
		onSettled: () => setStatusChangingId(null),
	})

	const allServices: ServiceListItemDto[] = useMemo(() => data?.data?.data ?? [], [data])

	const services = useMemo(
		() => allServices.filter((service) => service.status === activeTab),
		[allServices, activeTab],
	)

	const tabs: TabItem[] = [
		{ key: 'active', label: t('my_services.tab_active') },
		{ key: 'hidden', label: t('my_services.tab_hidden') },
	]

	const busy = deletingId !== null || statusChangingId !== null

	// Opens the public detail so the provider sees exactly what a neighbour sees.
	const handlePress = (id: number) => router.push(`/service/${id}` as Href)

	/** Flips one service between active and hidden. */
	const setStatus = (service: ServiceListItemDto, status: ServiceStatus) => {
		setStatusChangingId(service.id)
		updateService({ id: service.id, data: { status } })
	}

	const handleMenuPress = (service: ServiceListItemDto) => {
		if (busy) return

		const isHidden = service.status === 'hidden'

		Alert.alert(t('my_services.actions_title'), service.title ?? '', [
			{ text: t('common.cancel'), style: 'cancel' },
			{
				text: t('my_services.edit'),
				onPress: () => router.push(`/(post)/edit-service/${service.id}` as Href),
			},
			{
				text: isHidden ? t('my_services.unhide') : t('my_services.hide'),
				onPress: () => setStatus(service, isHidden ? 'active' : 'hidden'),
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
			) : activeTab === 'hidden' ? (
				<Text style={[styles.emptyText, { color: colors.textMuted }]}>
					{t('my_services.empty_hidden')}
				</Text>
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

			<View style={styles.tabsContainer}>
				{tabs.map((tab) => {
					const isActive = activeTab === tab.key
					return (
						<TouchableOpacity
							key={tab.key}
							style={[
								styles.tab,
								isActive && { borderBottomColor: colors.primaryColor },
							]}
							onPress={() => setActiveTab(tab.key)}
							activeOpacity={0.7}
						>
							<Text
								style={[
									styles.tabText,
									{ color: isActive ? colors.text : colors.textMuted },
									isActive && styles.activeTabText,
								]}
								numberOfLines={1}
							>
								{tab.label}
							</Text>
						</TouchableOpacity>
					)
				})}
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
	tabsContainer: {
		flexDirection: 'row',
		paddingHorizontal: 10,
	},
	tab: {
		flex: 1,
		paddingVertical: 12,
		alignItems: 'center',
		borderBottomWidth: 2,
		borderBottomColor: 'transparent',
	},
	tabText: {
		fontSize: 15,
		fontWeight: '500',
	},
	activeTabText: {
		fontWeight: '600',
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
