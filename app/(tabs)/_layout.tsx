import { HapticTab } from '@/components/haptic-tab';
import HomeHeader from '@/components/headers/HomeHeader';
import TabIcon from '@/components/shared/TabIcon';
import { Colors } from '@/constants/theme';
import { useTranslations } from '@/hooks/use-translation';
import { Tabs } from 'expo-router';
import { House, Map, MessageSquare, UserRound } from 'lucide-react-native';
import React from 'react';
import { Platform, useColorScheme } from 'react-native';


export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslations();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tabIconSelected,
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 15,
          backgroundColor: Colors.light.taBarBg,
          height: Platform.OS === 'ios' ? 90 : 120,
          borderTopWidth: 1,
          borderTopColor: Colors.light.borderColor,
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
