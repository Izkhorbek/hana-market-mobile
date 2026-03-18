import { HapticTab } from '@/components/haptic-tab';
import HomeHeader from '@/components/headers/HomeHeader';
import TabIcon from '@/components/shared/TabIcon';
import { TAB_FOOTER_HEIGHT } from '@/constants/appLimits';
import { useThemeColors } from '@/hooks/use-theme-colors';
import { useTranslations } from '@/hooks/use-translation';
import { Tabs } from 'expo-router';
import { House, Map, MessageSquare, UserRound } from 'lucide-react-native';
import React from 'react';


export default function TabLayout() {
  const colors = useThemeColors();
  const { t } = useTranslations();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 15,
          backgroundColor: colors.taBarBg,
          height: TAB_FOOTER_HEIGHT,
          borderTopWidth: 1,
          borderTopColor: colors.borderColor,
          boxShadow: "none",
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 0,
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          tabBarShowLabel: false,
          headerShown: true,
          header(props) {
            return <HomeHeader />
          },
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={House} focused={focused} title={t('tabs.home')} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          tabBarShowLabel: false,
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={Map} focused={focused} title={t('tabs.map')} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarShowLabel: false,
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={MessageSquare} focused={focused} title={t('tabs.chat')} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarShowLabel: false,
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={UserRound} focused={focused} title={t('tabs.profile')} color={color} />,
        }}
      />
    </Tabs>
  );
}
