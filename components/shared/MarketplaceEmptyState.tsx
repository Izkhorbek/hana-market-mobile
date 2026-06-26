import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import {
  Compass,
  MapPin,
  PackageOpen,
  SearchX,
  SlidersHorizontal,
  Store,
  type LucideIcon,
} from 'lucide-react-native'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

/**
 * Contextual, positively-framed empty states for the marketplace lists.
 *
 * Reusable + dependency-light (theme colors + lucide icons already in the app).
 * The component owns COPY and LAYOUT only; every action is a caller-supplied
 * handler. A button is rendered ONLY when its handler is provided, so each
 * screen decides which actions are available (deferred actions simply stay
 * hidden — see docs/marketplace-empty-state-implementation-report.md).
 */
export type EmptyReason =
  | 'NO_LOCATION'
  | 'NO_NEARBY_PRODUCTS'
  | 'NO_CATEGORY_PRODUCTS'
  | 'NO_SEARCH_RESULTS'
  | 'FILTER_TOO_STRICT'
  | 'NEW_REGION'

export interface MarketplaceEmptyStateProps {
  reason: EmptyReason
  isLoggedIn?: boolean
  onEnableLocation?: () => void
  onSelectManualLocation?: () => void
  onExpandRadius?: () => void
  onClearFilters?: () => void
  onCreateListing?: () => void
  onBrowseCategories?: () => void
  onShareApp?: () => void
}

type ActionSlot = 'enableLocation' | 'manualLocation' | 'expandRadius' | 'clearFilters' | 'createListing' | 'browseCategories' | 'shareApp'

interface ReasonConfig {
  icon: LucideIcon
  i18nKey: string
  /** Up to two preferred actions, primary first. */
  primary: ActionSlot
  secondary: ActionSlot
}

// Each reason maps to its icon, its i18n sub-key and the two actions it offers.
const REASONS: Record<EmptyReason, ReasonConfig> = {
  NO_LOCATION: {
    icon: MapPin,
    i18nKey: 'no_location',
    primary: 'enableLocation',
    secondary: 'manualLocation',
  },
  NO_NEARBY_PRODUCTS: {
    icon: Store,
    i18nKey: 'no_nearby',
    primary: 'expandRadius',
    secondary: 'createListing',
  },
  NO_CATEGORY_PRODUCTS: {
    icon: PackageOpen,
    i18nKey: 'no_category',
    primary: 'createListing',
    secondary: 'browseCategories',
  },
  NO_SEARCH_RESULTS: {
    icon: SearchX,
    i18nKey: 'no_search',
    primary: 'clearFilters',
    secondary: 'expandRadius',
  },
  FILTER_TOO_STRICT: {
    icon: SlidersHorizontal,
    i18nKey: 'filter_too_strict',
    primary: 'clearFilters',
    secondary: 'expandRadius',
  },
  NEW_REGION: {
    icon: Compass,
    i18nKey: 'new_region',
    primary: 'createListing',
    secondary: 'shareApp',
  },
}

const MarketplaceEmptyState: React.FC<MarketplaceEmptyStateProps> = ({
  reason,
  onEnableLocation,
  onSelectManualLocation,
  onExpandRadius,
  onClearFilters,
  onCreateListing,
  onBrowseCategories,
  onShareApp,
}) => {
  const { t } = useTranslations()
  const colors = useThemeColors()

  const config = REASONS[reason]
  const Icon = config.icon
  const base = `empty_states.${config.i18nKey}`

  // Resolve an action slot to its handler + label. Returns null when the caller
  // did not wire that action, so the button is hidden.
  const handlers: Record<ActionSlot, (() => void) | undefined> = {
    enableLocation: onEnableLocation,
    manualLocation: onSelectManualLocation,
    expandRadius: onExpandRadius,
    clearFilters: onClearFilters,
    createListing: onCreateListing,
    browseCategories: onBrowseCategories,
    shareApp: onShareApp,
  }

  const primaryHandler = handlers[config.primary]
  const secondaryHandler = handlers[config.secondary]

  return (
    <View style={styles.container}>
      <View style={[styles.iconBubble, { backgroundColor: colors.tabIconBackground }]}>
        <Icon size={32} color={colors.primaryColor} strokeWidth={1.8} />
      </View>

      <Text style={[styles.title, { color: colors.text }]}>
        {t(`${base}.title`)}
      </Text>
      <Text style={[styles.description, { color: colors.subText }]}>
        {t(`${base}.description`)}
      </Text>

      <View style={styles.actions}>
        {primaryHandler && (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primaryColor }]}
            onPress={primaryHandler}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryText}>{t(`${base}.primary`)}</Text>
          </TouchableOpacity>
        )}

        {secondaryHandler && (
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.borderColor }]}
            onPress={secondaryHandler}
            activeOpacity={0.7}
          >
            <Text style={[styles.secondaryText, { color: colors.text }]}>
              {t(`${base}.secondary`)}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 64,
    paddingHorizontal: 28,
  },
  iconBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  actions: {
    width: '100%',
    maxWidth: 340,
    gap: 10,
  },
  primaryBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: '600',
  },
})

export default MarketplaceEmptyState
