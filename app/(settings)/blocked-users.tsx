import { useBlockedUsersQuery, useUnblockUserMutation } from '@/api/hooks'
import RemoteImage from '@/components/shared/RemoteImage'
import { useThemeColors } from '@/hooks/use-theme-colors'
import { useTranslations } from '@/hooks/use-translation'
import type { BlockedUserDto } from '@/types'
import { router } from 'expo-router'
import { ArrowLeft, ShieldOff } from 'lucide-react-native'
import React, { useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const BlockedUsersPage: React.FC = () => {
  const colors = useThemeColors()
  const { t } = useTranslations()
  const insets = useSafeAreaInsets()
  const [unblockingId, setUnblockingId] = useState<number | null>(null)

  const { data, isLoading, isRefetching, refetch } = useBlockedUsersQuery({
    page: 1,
    pageSize: 50,
  })
  const blocked = data?.data?.data?.items ?? []

  const { mutate: unblock } = useUnblockUserMutation({
    onSettled: () => setUnblockingId(null),
  })

  const handleUnblock = (item: BlockedUserDto) => {
    if (unblockingId) return
    setUnblockingId(item.user_id)
    unblock({ blocked_user_id: item.user_id })
  }

  const renderItem = ({ item }: { item: BlockedUserDto }) => {
    const isUnblocking = unblockingId === item.user_id
    const initial = (item.username || '?').charAt(0).toUpperCase()
    return (
      <View style={[styles.row, { borderBottomColor: colors.borderColor }]}>
        {item.profile_image_url ? (
          <RemoteImage style={styles.avatar} src={item.profile_image_url} resizeMode="cover" />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.primaryColor + '22' }]}>
            <Text style={[styles.avatarText, { color: colors.primaryColor }]}>{initial}</Text>
          </View>
        )}
        <View style={styles.rowText}>
          <Text style={[styles.username, { color: colors.text }]} numberOfLines={1}>
            {item.username || t('chat_room.unknown_user')}
          </Text>
          {item.reason ? (
            <Text style={[styles.reason, { color: colors.textMuted }]} numberOfLines={1}>
              {item.reason}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={[styles.unblockBtn, { borderColor: colors.primaryColor }]}
          onPress={() => handleUnblock(item)}
          disabled={isUnblocking}
          activeOpacity={0.7}
        >
          {isUnblocking ? (
            <ActivityIndicator size="small" color={colors.primaryColor} />
          ) : (
            <Text style={[styles.unblockText, { color: colors.primaryColor }]}>
              {t('block.unblock')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    )
  }

  const renderEmpty = () => {
    if (isLoading) return null
    return (
      <View style={styles.emptyBox}>
        <ShieldOff size={44} color={colors.textMuted} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {t('block.empty_title')}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
          {t('block.empty_subtitle')}
        </Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.profileBackground }]}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('block.blocked_users_title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primaryColor} />
        </View>
      ) : (
        <FlatList
          data={blocked}
          keyExtractor={(item) => String(item.user_id)}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty()}
          contentContainerStyle={[
            blocked.length === 0 ? styles.emptyListContent : styles.listContent,
            { paddingBottom: insets.bottom + 16 },
          ]}
          refreshing={isRefetching}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

export default BlockedUsersPage

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  headerSpacer: { width: 24 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingTop: 4 },
  emptyListContent: { flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700' },
  rowText: { flex: 1 },
  username: { fontSize: 15, fontWeight: '600' },
  reason: { fontSize: 12, marginTop: 2 },
  unblockBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    minWidth: 84,
    alignItems: 'center',
  },
  unblockText: { fontSize: 13, fontWeight: '600' },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 6, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
})
