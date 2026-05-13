import { HapticTab } from '@/components/haptic-tab'
import HomeHeader from '@/components/headers/HomeHeader'
import TabIcon from '@/components/shared/TabIcon'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import { Tabs } from 'expo-router'
import { House, Map, MessageSquare, UserRound } from 'lucide-react-native'
import React from 'react'
import { StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const TAB_BAR_BASE_HEIGHT = 60

export default function TabLayout() {
  const colors = useThemeColors()
  const { t } = useTranslations()
  const insets = useSafeAreaInsets()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.taBarBg,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.borderColor,
          elevation: 0,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
          height: TAB_BAR_BASE_HEIGHT + insets.bottom,
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
        name="map"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={Map} focused={focused} title={t('tabs.map')} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon Icon={MessageSquare} focused={focused} title={t('tabs.chat')} color={color} />
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
