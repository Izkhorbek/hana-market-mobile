import RemoteImage from '@/components/shared/RemoteImage'
import type { EServiceCategory } from '@/constants/enums'
import { getServiceCategoryVisual } from '@/constants/serviceCategories'
import { Colors } from '@/constants/theme'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import Ionicons from '@expo/vector-icons/Ionicons'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { Phone } from 'lucide-react-native'
import React, { memo } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface ServiceCardProps {
	title: string
	category?: EServiceCategory
	category_name: string
	main_image_url: string
	price: string
	price_type_name?: string
	moljal: string
	distance: string
	created_ago: string
	onPress?: () => void
	onCallPress?: () => void
}

/** One service row in the service feed — same layout as the product card. */
const ServiceCardComponent: React.FC<ServiceCardProps> = ({
	title,
	category,
	category_name,
	main_image_url,
	price,
	price_type_name,
	moljal,
	distance,
	created_ago,
	onPress,
	onCallPress,
}) => {
	const colors = useThemeColors()
	const { t } = useTranslations()
	const visual = getServiceCategoryVisual(category)
	const { Icon: CategoryIcon } = visual

	return (
		<TouchableOpacity
			style={[styles.container, { borderColor: colors.borderColor }]}
			activeOpacity={0.8}
			onPress={onPress}
		>
			{/* Service image — squared off on purpose, no corner radius. With no
			    photo the category's own icon stands in, so the row still reads. */}
			{main_image_url ? (
				<RemoteImage
					src={main_image_url}
					style={styles.image}
					resizeMode='cover'
					cachePolicy='disk'
					requestedWidth={260}
					requestedHeight={260}
					requestedQuality={65}
				/>
			) : (
				<View style={[styles.image, styles.categoryTile, { backgroundColor: visual.bg }]}>
					<CategoryIcon size={44} color={visual.color} strokeWidth={1.6} />
				</View>
			)}

			<View style={styles.content}>
				<View>
					<Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
						{title}
					</Text>

					{!!category_name && (
						<View style={styles.categoryRow}>
							<CategoryIcon size={13} color={visual.color} strokeWidth={2} />
							<Text style={[styles.category, { color: colors.subText }]} numberOfLines={1}>
								{category_name}
							</Text>
						</View>
					)}

					{/* Distance and time row */}
					<View style={styles.infoRow}>
						{!!distance && (
							<View style={styles.infoItem}>
								<MaterialIcons name='location-on' size={14} color={colors.subText} />
								<Text style={[styles.infoText, { color: colors.subText }]}>{distance}</Text>
							</View>
						)}
						{!!created_ago && (
							<View style={styles.infoItem}>
								<Ionicons name='time-outline' size={14} color={colors.subText} />
								<Text style={[styles.infoText, { color: colors.subText }]}>{created_ago}</Text>
							</View>
						)}
					</View>

					{!!moljal && (
						<Text style={[styles.address, { color: colors.subText }]} numberOfLines={1}>
							{moljal}
						</Text>
					)}
				</View>

				{/* Price and call row */}
				<View style={styles.footer}>
					<Text style={[styles.price, { color: colors.text }]} numberOfLines={1}>
						{price || t('service.negotiable')}
						{!!price_type_name && (
							<Text style={[styles.priceType, { color: colors.subText }]}>
								{' · '}
								{price_type_name}
							</Text>
						)}
					</Text>
					<TouchableOpacity
						style={[styles.callBtn, { backgroundColor: colors.primaryColor }]}
						onPress={onCallPress}
						hitSlop={8}
						activeOpacity={0.85}
					>
						<Phone size={14} color='#fff' />
						<Text style={styles.callBtnText}>{t('service.call')}</Text>
					</TouchableOpacity>
				</View>
			</View>
		</TouchableOpacity>
	)
}

const ServiceCard = memo(ServiceCardComponent)

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		borderBottomWidth: 1,
		overflow: 'hidden',
		borderColor: Colors.light.borderColor,
		marginVertical: 0,
		paddingVertical: 12,
		marginHorizontal: 10,
	},
	image: {
		width: 130,
		height: 130,
	},
	categoryTile: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	content: {
		flex: 1,
		paddingLeft: 12,
		paddingVertical: 2,
		justifyContent: 'space-between',
	},
	title: {
		fontSize: 18,
		lineHeight: 23,
	},
	categoryRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 5,
		marginTop: 4,
	},
	category: {
		flex: 1,
		fontSize: 13,
	},
	infoRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 6,
		gap: 12,
	},
	infoItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 2,
	},
	infoText: {
		fontSize: 13,
		fontWeight: '400',
	},
	address: {
		fontSize: 13,
		fontWeight: '400',
		marginTop: 6,
	},
	footer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: 8,
	},
	price: {
		flex: 1,
		fontSize: 16,
		fontWeight: '700',
	},
	priceType: {
		fontSize: 12,
		fontWeight: '400',
	},
	callBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 5,
		paddingHorizontal: 12,
		paddingVertical: 7,
		borderRadius: 999,
	},
	callBtnText: {
		color: '#fff',
		fontSize: 13,
		fontWeight: '600',
	},
})

export default ServiceCard
