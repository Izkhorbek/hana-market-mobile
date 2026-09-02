import { EServiceCategory } from '@/constants/enums'
import {
  Droplets,
  Ellipsis,
  GraduationCap,
  Hammer,
  LayoutGrid,
  Scissors,
  SprayCan,
  Sprout,
  Truck,
  WashingMachine,
  Zap,
} from 'lucide-react-native'

/** Icon + colours used to picture one service category. */
export interface ServiceCategoryVisual {
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>
  /** Icon colour. */
  color: string
  /** Soft tile background behind the icon. */
  bg: string
}

/**
 * Service categories are a client-side enum (no backend artwork like product
 * categories have), so each one gets an icon + colour pair here. One map, used
 * by the filter chips and by the card's no-photo tile, keeps a category looking
 * the same everywhere.
 */
export const SERVICE_CATEGORY_VISUALS: Record<EServiceCategory, ServiceCategoryVisual> = {
  [EServiceCategory.PLUMBER]: { Icon: Droplets, color: '#2563EB', bg: '#E5EDFD' },
  [EServiceCategory.ELECTRICIAN]: { Icon: Zap, color: '#D97706', bg: '#FEF3C7' },
  [EServiceCategory.REPAIR]: { Icon: Hammer, color: '#B45309', bg: '#FDECE4' },
  [EServiceCategory.CLEANING]: { Icon: SprayCan, color: '#0891B2', bg: '#DFF3F7' },
  [EServiceCategory.MOVING]: { Icon: Truck, color: '#4F46E5', bg: '#E8E7FD' },
  [EServiceCategory.TUTOR]: { Icon: GraduationCap, color: '#7C3AED', bg: '#EFE7FD' },
  [EServiceCategory.GARDENER]: { Icon: Sprout, color: '#16A34A', bg: '#DFF6E7' },
  [EServiceCategory.APPLIANCE]: { Icon: WashingMachine, color: '#0F766E', bg: '#DDF2EF' },
  [EServiceCategory.BEAUTY]: { Icon: Scissors, color: '#DB2777', bg: '#FCE7F1' },
  [EServiceCategory.OTHER]: { Icon: Ellipsis, color: '#6B7280', bg: '#EEF0F2' },
}

/** The "Barchasi" chip has no category of its own. */
export const ALL_SERVICES_VISUAL: ServiceCategoryVisual = {
  Icon: LayoutGrid,
  color: '#0F766E',
  bg: '#DDF2EF',
}

/** Visual for a category, falling back to "other" for an unknown value. */
export const getServiceCategoryVisual = (
  category: EServiceCategory | undefined,
): ServiceCategoryVisual =>
  (category != null && SERVICE_CATEGORY_VISUALS[category]) ||
  SERVICE_CATEGORY_VISUALS[EServiceCategory.OTHER]
