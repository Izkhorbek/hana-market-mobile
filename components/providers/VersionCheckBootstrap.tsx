import { appService } from '@/api/services/app.service'
import CustomAlert from '@/components/ui/CustomAlert'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/constants/localization'
import { useTranslations } from '@/hooks/use-translation'
import type { VersionCheckResponse } from '@/types'
import { getAppBuild, getAppPlatform, getAppVersion } from '@/utils/appVersion'
import { logger } from '@/utils/logger'
import React, { useEffect, useState } from 'react'
import { Linking } from 'react-native'

// Run-once-per-launch guard. Module scope survives component remounts within a
// session, so the network call fires at most once per app launch.
let versionCheckStarted = false

// Optional-update builds already dismissed this session — never re-prompt them.
// (Force updates are intentionally NOT tracked here: they must be able to
// reappear.)
const dismissedOptionalBuilds = new Set<number>()

function normalizeLocale(lng: string | undefined): SupportedLanguage {
  const short = lng?.split('-')[0] ?? ''
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(short)
    ? (short as SupportedLanguage)
    : 'uz'
}

type Mode = 'none' | 'optional' | 'forced'

/**
 * Null-until-needed bootstrap — mirrors ChatBootstrap / NotificationBootstrap.
 * Mounted once in app/_layout.tsx.
 *
 * Runs the backend version policy check once per launch and renders a blocking
 * (force) or dismissable (optional) CustomAlert as needed. A CustomAlert is an
 * RN Modal (portaled above the whole tree), so a force-update overlay covers
 * every screen. A failed/absent policy (e.g. iOS 404) never blocks the app.
 */
export function VersionCheckBootstrap() {
  const { t, i18n } = useTranslations()
  const [mode, setMode] = useState<Mode>('none')
  const [result, setResult] = useState<VersionCheckResponse | null>(null)

  useEffect(() => {
    if (versionCheckStarted) return
    versionCheckStarted = true

    let cancelled = false

    void (async () => {
      try {
        const build = getAppBuild()
        const res = await appService.checkAppVersion({
          platform: getAppPlatform(),
          version: getAppVersion(),
          // Omit `build` entirely when it can't be resolved numerically rather
          // than sending NaN — the backend then gates on version alone.
          ...(build != null ? { build } : {}),
          locale: normalizeLocale(i18n.language),
        })
        if (cancelled) return

        console.log('Version check request', getAppVersion(), build, getAppPlatform(), i18n.language, res.data?.data)
        console.log('Version check response', res.data?.data)
        const data = res.data?.data
        if (!data) return

        if (data.update_required) {
          setResult(data)
          setMode('forced')
        } else if (data.update_recommended) {
          if (dismissedOptionalBuilds.has(data.latest_build)) return
          setResult(data)
          setMode('optional')
        }
        // Otherwise up to date → render nothing.
      } catch (err) {
        // Never block the app on a failed/missing policy.
        logger.warn(err, { code: 'VERSION_CHECK_FAILED' })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [i18n.language])

  const openStore = () => {
    const url = result?.store_url
    if (url) Linking.openURL(url).catch(() => {})
  }

  if (mode === 'none' || !result) return null

  const message = result.message?.trim() || t('update.default_message')

  // ── Force update: non-dismissable, single Update button. Pressing Update
  //    sends the user to the store but keeps the overlay up (they still can't
  //    use this build). Backdrop press and Android back are neutralised.
  if (mode === 'forced') {
    return (
      <CustomAlert
        visible
        type="warning"
        title={t('update.required_title')}
        message={message}
        primaryButtonText={t('update.update_button')}
        onPrimaryPress={openStore}
        onDismiss={() => {}}
        dismissOnBackdrop={false}
      />
    )
  }

  // ── Optional update: dismissable, Update + Later. Once dismissed (either
  //    button or backdrop), remember the build so it won't re-prompt this
  //    session.
  const dismissOptional = () => {
    dismissedOptionalBuilds.add(result.latest_build)
    setMode('none')
  }

  return (
    <CustomAlert
      visible
      type="info"
      title={t('update.optional_title')}
      message={message}
      primaryButtonText={t('update.update_button')}
      secondaryButtonText={t('update.later_button')}
      onPrimaryPress={() => {
        openStore()
        dismissOptional()
      }}
      onSecondaryPress={dismissOptional}
      onDismiss={dismissOptional}
      dismissOnBackdrop
    />
  )
}
