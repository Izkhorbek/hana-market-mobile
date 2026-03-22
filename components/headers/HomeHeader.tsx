import { HEADER_HEIGHT } from '@/constants/appLimits'
import { useThemeColors } from '@/hooks/use-theme-colors'
import Feather from '@expo/vector-icons/Feather'
import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import { ChevronDown, MapPin, Search } from 'lucide-react-native'
import React from 'react'
import { StyleSheet, TouchableOpacity } from 'react-native'
import { ThemedText } from '../themed-text'
import { ThemedView } from '../themed-view'

const HomeHeader = () => {
	const colors = useThemeColors()

	const handleNeighborhoodPress = () => {
		router.push('/(settings)/manage')
	}

	const handleSearchPress = () => {
		router.push('/search')
	}

	const handleCategoriesPress = () => {
		router.push('/categories')
	}

	return (
		<ThemedView
			style={[
				styles.container,
				{ backgroundColor: colors.background, borderBottomColor: colors.borderColor },
			]}
		>
			<TouchableOpacity
				style={styles.locationButton}
				onPress={handleNeighborhoodPress}
				activeOpacity={0.7}
			>
				<MapPin size={24} color={colors.primaryColor} />
				<ThemedText style={[styles.currentCity, { color: colors.blackIcon }]}>Toshkent</ThemedText>
				<ChevronDown size={24} color={colors.textMuted} />
			</TouchableOpacity>
			<ThemedView style={styles.searchContainer}>
				<TouchableOpacity onPress={handleCategoriesPress} activeOpacity={0.7}>
					<Feather name='menu' size={24} color={colors.blackIcon} />
				</TouchableOpacity>
				<TouchableOpacity onPress={handleSearchPress} activeOpacity={0.7}>
					<Search size={24} color={colors.blackIcon} />
				</TouchableOpacity>
				<TouchableOpacity>
					<Ionicons name='notifications-outline' size={24} color={colors.blackIcon} />
				</TouchableOpacity>
			</ThemedView>
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
		paddingBottom: 10,
		paddingHorizontal: 14,
		borderBottomWidth: 1,
	},
	locationButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	currentCity: {
		fontSize: 20,
		fontWeight: '600',
	},
	searchContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 20,
	},
})

export default HomeHeader
