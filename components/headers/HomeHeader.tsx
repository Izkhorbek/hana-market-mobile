import { useThemeColors } from '@/hooks/use-theme-colors'
import Feather from '@expo/vector-icons/Feather'
import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import { ChevronDown, MapPin, Search } from 'lucide-react-native'
import React from 'react'
import { Platform, StyleSheet, TouchableOpacity } from 'react-native'
import { ThemedText } from '../themed-text'
import { ThemedView } from '../themed-view'

const HomeHeader = () => {
	const colors = useThemeColors()

	const handleNeighborhoodPress = () => {
		router.push('/(settings)/manage')
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
				<MapPin size={20} color={colors.primaryColor} />
				<ThemedText style={[styles.currentCity, { color: colors.blackIcon }]}>Toshkent</ThemedText>
				<ChevronDown size={18} color={colors.textMuted} />
			</TouchableOpacity>
			<ThemedView style={styles.searchContainer}>
				<TouchableOpacity>
					<Feather name='menu' size={25} color={colors.blackIcon} />
				</TouchableOpacity>
				<TouchableOpacity>
					<Search size={25} color={colors.blackIcon} />
				</TouchableOpacity>
				<TouchableOpacity>
					<Ionicons name='notifications-outline' size={25} color={colors.blackIcon} />
				</TouchableOpacity>
			</ThemedView>
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	container: {
		height: Platform.OS === 'ios' ? 100 : 80,
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'flex-end',
		justifyContent: 'space-between',
		paddingBottom: 8,
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
