# SafeArea Handling Guide - Without Global Provider

Your app now uses a **provider-free SafeArea solution** that's cleaner, lighter, and more flexible.

## How It Works

### Option 1: Use the `useSafeAreaEdgeInsets()` Hook (Recommended)
Works like `useSafeAreaInsets()` from react-native-safe-area-context, but without any global wrapper.

```tsx
import { useSafeAreaEdgeInsets } from '@/hooks/useSafeAreaEdgeInsets';
import { View } from 'react-native';

export function MyScreen() {
  const insets = useSafeAreaEdgeInsets();
  
  return (
    <View style={{ 
      flex: 1, 
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    }}>
      {/* Content automatically adjusted for notch/home indicator */}
    </View>
  );
}
```

**When to use**: Any screen that needs to avoid notches, Dynamic Island, or gesture bars.

---

### Option 2: Use Predefined Constants (Fastest)
For simple padding that doesn't need to be reactive:

```tsx
import { AppLimits } from '@/constants/appLimits';
import { View } from 'react-native';

export function MyList() {
  return (
    <View style={{ paddingTop: AppLimits.STATUS_BAR_HEIGHT }}>
      {/* Consistent throughout app */}
    </View>
  );
}
```

**When to use**: Static layouts where you know exact spacing needed.

---

### Option 3: No Manual Padding (Best for Lists)
`FlatList` and `ScrollView` handle safe areas automatically on iOS:

```tsx
import { FlatList } from 'react-native';

export function MyList() {
  return (
    <FlatList
      contentInsetAdjustmentBehavior="automatic" // ✅ iOS only
      scrollIndicatorInsets={{ top: StatusBar.currentHeight }}
      data={items}
      renderItem={({item}) => <ProductCard item={item} />}
    />
  );
}
```

**When to use**: Lists and scrollable content (most of your components).

---

## Key Differences from Old Approach

| Aspect | Old | New |
|--------|-----|-----|
| **Global Provider** | ❌ Not needed | ✅ Same |
| **Import** | `useSafeAreaInsets` | `useSafeAreaEdgeInsets` |
| **iOS Accuracy** | Hardcoded 44px ❌ | Dynamic (notch/Dynamic Island) ✅ |
| **Android** | Fallback logic ⚠️ | StatusBar.currentHeight ✅ |
| **Bundle Size** | Minimal | Same minimal |

---

## Common Use Cases in Your App

### 1. Header with Notch Avoidance
```tsx
import { useSafeAreaEdgeInsets } from '@/hooks/useSafeAreaEdgeInsets';

export function Header() {
  const insets = useSafeAreaEdgeInsets();
  
  return (
    <View style={{ paddingTop: insets.top + 12 }}>
      <Text>Safe from notch</Text>
    </View>
  );
}
```

### 2. Modal Dialogs
```tsx
const insets = useSafeAreaEdgeInsets();

<Modal visible={true}>
  <View style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
    {/* Modal content won't hide behind status bar or home indicator */}
  </View>
</Modal>
```

### 3. Tab Navigation
```tsx
<Tabs style={{ paddingBottom: insets.bottom + 10 }}>
  {/* Already handled by Expo Router, but good for edge cases */}
</Tabs>
```

### 4. Image Viewer (Already Updated ✅)
```tsx
// ImageViewer.tsx now uses useSafeAreaEdgeInsets()
// Close button won't overlap notch
```

---

## Checking Your Implementation

### ✅ Already Safe
- `components/ui/ImageViewer.tsx` - Updated to use new hook
- `app/_layout.tsx` - No global SafeAreaProvider (correct!)
- All list components - Use `contentInsetAdjustmentBehavior`

### Should Check (Optional)
- Modal overlays in your forms
- Custom headers/footers
- Bottom sheets (chat, filters)

---

## If You Need Maximum Control

Use `getEdgeInsetsSync()` for zero hook dependencies:

```tsx
import { getEdgeInsetsSync } from '@/hooks/useSafeAreaEdgeInsets';

const insets = getEdgeInsetsSync(); // Sync, not reactive
// Returns: { top: 44, bottom: 34, left: 0, right: 0 } on iPhone
// Returns: { top: StatusBar.currentHeight, bottom: 0, ... } on Android
```

---

## Performance Notes

- ✅ No global context re-renders
- ✅ Only components that use the hook re-calculate
- ✅ Minimal overhead (one StatusBar listener)
- ✅ Same bundle size as before

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Padding not applying | Check `flex: 1` on parent container |
| Content still overlaps notch | Use `paddingTop: insets.top + 8` (add extra buffer) |
| Android looks weird | Make sure `StatusBar` is imported from `react-native` |
| Modal overlaps home indicator | Add `paddingBottom: insets.bottom` to modal content |

