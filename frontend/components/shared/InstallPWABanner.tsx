'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPWABanner() {

  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null)

  const [visible, setVisible] = useState(false)

  useEffect(() => {

    const dismissed = localStorage.getItem('pwa-dismissed')

    if (dismissed) return

    const handler = (e: Event) => {

      e.preventDefault()

      setPromptEvent(e as BeforeInstallPromptEvent)

      const isMobile = /android|iphone|ipad/i.test(
        navigator.userAgent
      )

      if (isMobile) {
        setVisible(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () =>
      window.removeEventListener('beforeinstallprompt', handler)

  }, [])

  const install = async () => {

    if (!promptEvent) return

    await promptEvent.prompt()

    const result = await promptEvent.userChoice

    if (result.outcome === 'accepted') {
      setVisible(false)
    }
  }

  const dismiss = () => {

    localStorage.setItem('pwa-dismissed', 'true')

    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-5 left-5 right-5 bg-neutral-900 border border-neutral-700 rounded-xl p-4 flex items-center justify-between text-white z-50">

      <div>
        <p className="font-semibold">
          Install PrepTrack App
        </p>
        <p className="text-sm text-gray-400">
          Access your preparation OS like a native app
        </p>
      </div>

      <div className="flex gap-3">

        <button
          onClick={install}
          className="bg-indigo-600 px-4 py-2 rounded"
        >
          Install →
        </button>

        <button
          onClick={dismiss}
          className="text-gray-400"
        >
          ✕
        </button>

      </div>

    </div>
  )
}