import { HapticTab } from '@/components/haptic-tab'
import HomeHeader from '@/components/headers/HomeHeader'
import TabIcon from '@/components/shared/TabIcon'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { useChatStore } from '@/modules/Chat/chat-store'
import { Tabs } from 'expo-router'
import { Building2, House, MessageSquare, UserRound } from 'lucide-react-native'
import React from 'react'
import { StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function TabLayout() {
  const colors = useThemeColors()
  const { t } = useTranslations()
  const insets = useSafeAreaInsets()
  const unreadCount = useChatStore((s) => s.unreadCount)

    // Tab bar uchun to'g'ri height hisoblash
  const TAB_BAR_HEIGHT = 66 // asosiy content height
  const tabBarHeight = TAB_BAR_HEIGHT 

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.borderColor,
          elevation: 0,
           shadowOpacity: 0,         // iOS shadow olib tashlash
          paddingTop: 10,
          paddingBottom: insets.bottom,  // navigation bar uchun joy qo'shish
          height: tabBarHeight,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          headerShown: true,
          header() {
            return <HomeHeader />
          },
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={House} focused={focused} title={t('tabs.home')} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="mahalla"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={Building2} focused={focused} title={t('mahalla.tab')} color={color} />
          ),
        }}
      />

      {/* Map moved into Bozor as a button — hidden from the tab bar but still a
          route (product "view on map" links keep working). */}
      <Tabs.Screen name="map" options={{ href: null }} />

      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              Icon={MessageSquare}
              focused={focused}
              title={t('tabs.chat')}
              color={color}
              badgeCount={unreadCount}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={UserRound} focused={focused} title={t('tabs.profile')} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
