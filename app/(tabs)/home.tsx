
import ProductsList from '@/components/Lists/ProductsList';
import { ThemedView } from '@/components/themed-view';
import { AppLimits } from '@/constants/appLimits';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTranslations } from '@/hooks/use-translation';
import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Briefcase, Car, ChevronRight, Package } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

// ── Types ─────────────────────────────────────────────────────────────────────
type PostType = 'things' | 'cars' | 'works';

interface CategoryOption {
  id: PostType;
  labelKey: string;
  descKey: string;
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;
  iconBg: string;
  iconColor: string;
}



export default function HomeScreen() {
  const colors = useThemeColors();
  const colorScheme = useColorScheme();
  const { t } = useTranslations();

  const [activeFilter, setActiveFilter] = useState('all');
  const [sheetVisible, setSheetVisible] = useState(false);

  // Slide-up animation
  const slideAnim = useRef(new Animated.Value(AppLimits.Home.
    SHEET_HEIGHT)).current;

  const openSheet = () => {
    setSheetVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  };

  const closeSheet = (onDone?: () => void) => {
    Animated.timing(slideAnim, {
      toValue: AppLimits.Home.SHEET_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setSheetVisible(false);
      slideAnim.setValue(AppLimits.Home.SHEET_HEIGHT);
      onDone?.();
    });
  };

  const handleSelect = (type: PostType) => {
    closeSheet(() => {
      router.push({ pathname: '/(post)/create', params: { type } });
    });
  };

  const categories: CategoryOption[] = [
    {
      id: 'things',
      labelKey: 'post.things',
      descKey: 'post.things_desc',
      Icon: Package,
      iconBg: colors.tabIconBackground,
      iconColor: colors.tabIconSelected,
    },
    {
      id: 'cars',
      labelKey: 'post.cars',
      descKey: 'post.cars_desc',
      Icon: Car,
      iconBg: '#E8F0FE',
      iconColor: '#4285F4',
    },
    {
      id: 'works',
      labelKey: 'post.works',
      descKey: 'post.works_desc',
      Icon: Briefcase,
      iconBg: '#FFF3E0',
      iconColor: '#FF9500',
    },
  ];

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <ProductsList
        selectedFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* ── Floating Action Button ─────────────────────────────────────── */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primaryColor }]}
          onPress={openSheet}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Create Post Bottom Sheet ───────────────────────────────────── */}
      <Modal
        visible={sheetVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => closeSheet()}
      >
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={() => closeSheet()} />

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: colors.background, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Drag handle */}
          <View style={styles.dragHandle}>
            <View style={[styles.handleBar, { backgroundColor: colors.borderColor }]} />
          </View>

          {/* Title row */}
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>
              {t('post.what_posting')}
            </Text>
            <TouchableOpacity onPress={() => closeSheet()} hitSlop={12}>
              <Feather name="x" size={20} color={colors.icon} />
            </TouchableOpacity>
          </View>

          {/* Category rows */}
          <View style={styles.categoryList}>
            {categories.map((cat, index) => {
              const { Icon } = cat;
              const isLast = index === categories.length - 1;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryRow,
                    !isLast && styles.categoryRowBorder,
                    { borderBottomColor: colors.borderColor },
                  ]}
                  onPress={() => handleSelect(cat.id)}
                  activeOpacity={0.7}
                >
                  {/* Icon bubble */}
                  <View style={[styles.iconBubble, { backgroundColor: cat.iconBg }]}>
                    <Icon size={22} color={cat.iconColor} strokeWidth={1.8} />
                  </View>

                  {/* Text */}
                  <View style={styles.categoryText}>
                    <Text style={[styles.categoryLabel, { color: colors.text }]}>
                      {t(cat.labelKey)}
                    </Text>
                    <Text style={[styles.categoryDesc, { color: colors.subText }]}>
                      {t(cat.descKey)}
                    </Text>
                  </View>

                  {/* Chevron */}
                  <ChevronRight size={18} color={colors.icon} strokeWidth={2} />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* iOS safe area padding */}
          {Platform.OS === 'ios' && <View style={styles.iosBottom} />}
        </Animated.View>
      </Modal>

      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },

  // ── FAB ───────────────────────────────────────────────────────────────────
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },

  // ── Bottom sheet ──────────────────────────────────────────────────────────
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 8,
    // subtle shadow for the sheet
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 20,
  },
  dragHandle: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },

  // ── Category list ─────────────────────────────────────────────────────────
  categoryList: {
    marginTop: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  categoryRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBubble: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryText: {
    flex: 1,
    gap: 2,
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  categoryDesc: {
    fontSize: 12,
    lineHeight: 16,
  },

  // iOS safe area
  iosBottom: {
    height: 20,
  },
});
