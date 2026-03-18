import { HEADER_HEIGHT, HEADER_PADDING_TOP } from '@/constants/appLimits'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { router } from 'expo-router'
import {
	ArrowLeft,
	Briefcase,
	Car,
	Clock3,
	House,
	Search,
	Smartphone,
	Sofa,
	X,
} from 'lucide-react-native'
import React, { useEffect, useMemo, useState } from 'react'
import {
	ActivityIndicator,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View
} from 'react-native'

type SearchCategory = 'cars' | 'real_estate' | 'jobs' | 'electronics' | 'furniture'

interface SearchRequestPayload {
	query: string
	category?: SearchCategory
	limit: number
	offset: number
}

interface SearchResultItem {
	id: string
	title: string
}

const DEBOUNCE_MS = 450

const SearchPage: React.FC = () => {
	const { t } = useTranslations()
	const colors = useThemeColors()

	const [query, setQuery] = useState('')
	const [debouncedQuery, setDebouncedQuery] = useState('')
	const [selectedCategory, setSelectedCategory] = useState<SearchCategory | undefined>(undefined)
	const [isLoading, setIsLoading] = useState(false)
	const [results, setResults] = useState<SearchResultItem[]>([])
	const [recentSearches, setRecentSearches] = useState<string[]>([
		'Nike Air Max',
		'iPhone 13',
		'Tesla Model S',
		'Samsung TV',
		'Leather Sofa',
	])

	const categories = useMemo(
		() => [
			{ key: 'cars' as const, label: t('search_page.categories.cars'), icon: Car },
			{ key: 'real_estate' as const, label: t('search_page.categories.real_estate'), icon: House },
			{ key: 'jobs' as const, label: t('search_page.categories.jobs'), icon: Briefcase },
			{ key: 'electronics' as const, label: t('search_page.categories.electronics'), icon: Smartphone },
			{ key: 'furniture' as const, label: t('search_page.categories.furniture'), icon: Sofa },
		],
		[t]
	)

	useEffect(() => {
		const timeout = setTimeout(() => {
			setDebouncedQuery(query.trim())
		}, DEBOUNCE_MS)
		return () => clearTimeout(timeout)
	}, [query])

	useEffect(() => {
		const runSearch = async () => {
			if (!debouncedQuery) {
				setResults([])
				return
			}
			setIsLoading(true)
			try {
				const payload: SearchRequestPayload = {
					query: debouncedQuery,
					category: selectedCategory,
					limit: 20,
					offset: 0,
				}
				const response = await searchMarketplace(payload)
				setResults(response)
			} finally {
				setIsLoading(false)
			}
		}
		runSearch()
	}, [debouncedQuery, selectedCategory])

	// Backend-ready request function.
	const searchMarketplace = async (payload: SearchRequestPayload): Promise<SearchResultItem[]> => {
		// TODO: replace with API call
		// const response = await fetch('YOUR_API_URL/search', {
		//   method: 'POST',
		//   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
		//   body: JSON.stringify(payload),
		// })
		// const data = await response.json()
		// return data.items
		await new Promise(resolve => setTimeout(resolve, 350))
		console.log('Search payload to backend:', payload)
		return [
			{ id: '1', title: `${payload.query} - result 1` },
			{ id: '2', title: `${payload.query} - result 2` },
			{ id: '3', title: `${payload.query} - result 3` },
		]
	}

	const handleSubmitSearch = () => {
		const value = query.trim()
		if (!value) return
		setRecentSearches(prev => [value, ...prev.filter(item => item !== value)].slice(0, 10))
		setDebouncedQuery(value)
	}

	const handleRecentPress = (value: string) => {
		setQuery(value)
	}

	return (
		<View style={[styles.container, { backgroundColor: colors.profileBackground }]}>
			<View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.borderColor }]}>
				<TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
					<ArrowLeft size={24} color={colors.text} />
				</TouchableOpacity>
				<Text style={[styles.headerTitle, { color: colors.text }]}>{t('search_page.title')}</Text>
				<TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
					<X size={24} color={colors.text} />
				</TouchableOpacity>
			</View>

			<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				<View style={[styles.searchInputWrap, { backgroundColor: colors.background, borderColor: colors.borderColor }]}>
					<Search size={20} color={colors.textMuted} />
					<TextInput
						style={[styles.searchInput, { color: colors.text }]}
						value={query}
						onChangeText={setQuery}
						placeholder={t('search_page.placeholder')}
						placeholderTextColor={colors.textMuted}
						returnKeyType='search'
						onSubmitEditing={handleSubmitSearch}
						autoCorrect={false}
						autoCapitalize='none'
					/>
				</View>

				<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
					{categories.map(category => {
						const Icon = category.icon
						const isSelected = selectedCategory === category.key
						return (
							<TouchableOpacity
								key={category.key}
								style={[
									styles.categoryChip,
									{
										backgroundColor: isSelected ? `${colors.primaryColor}15` : colors.background,
										borderColor: isSelected ? colors.primaryColor : colors.borderColor,
									},
								]}
								onPress={() => setSelectedCategory(prev => (prev === category.key ? undefined : category.key))}
								activeOpacity={0.7}
							>
								<Icon size={16} color={isSelected ? colors.primaryColor : colors.textMuted} />
								<Text style={[styles.categoryText, { color: isSelected ? colors.primaryColor : colors.text }]}>
									{category.label}
								</Text>
							</TouchableOpacity>
						)
					})}
				</ScrollView>

				{query.trim().length > 0 ? (
					<View style={styles.section}>
						<Text style={[styles.sectionTitle, { color: colors.text }]}>{t('search_page.search_results')}</Text>
						{isLoading ? (
							<View style={styles.loadingWrap}>
								<ActivityIndicator size='small' color={colors.primaryColor} />
							</View>
						) : (
							results.map(item => (
								<View key={item.id} style={styles.recentItem}>
									<Search size={18} color={colors.textMuted} />
									<Text style={[styles.recentText, { color: colors.text }]}>{item.title}</Text>
								</View>
							))
						)}
					</View>
				) : (
					<View style={styles.section}>
						<Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t('search_page.recent_searches')}</Text>
						{recentSearches.map(item => (
							<TouchableOpacity key={item} style={styles.recentItem} onPress={() => handleRecentPress(item)} activeOpacity={0.7}>
								<Clock3 size={18} color={colors.textMuted} />
								<Text style={[styles.recentText, { color: colors.text }]}>{item}</Text>
							</TouchableOpacity>
						))}
					</View>
				)}
			</ScrollView>
		</View>
	)
}

export default SearchPage

const styles = StyleSheet.create({
	container: { flex: 1 },
	header: {
		height: HEADER_HEIGHT,
		paddingTop: HEADER_PADDING_TOP,
		paddingHorizontal: 16,
		paddingBottom: 12,
		borderBottomWidth: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	headerTitle: { fontSize: 30 - 10, fontWeight: '700' },
	content: { padding: 16, paddingBottom: 40 },
	searchInputWrap: {
		borderWidth: 1,
		borderRadius: 14,
		height: 52,
		paddingHorizontal: 14,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	searchInput: { flex: 1, fontSize: 20 - 3, height: '100%' },
	categoriesRow: { gap: 10, paddingTop: 14, paddingBottom: 8 },
	categoryChip: {
		height: 40,
		paddingHorizontal: 14,
		borderRadius: 12,
		borderWidth: 1,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	categoryText: { fontSize: 16 },
	section: { marginTop: 20 },
	sectionTitle: { fontSize: 28 - 8, fontWeight: '500', marginBottom: 12 },
	recentItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingVertical: 12,
	},
	recentText: { fontSize: 29 - 9, fontWeight: '500' },
	loadingWrap: { paddingVertical: 10, alignItems: 'flex-start' },
})
