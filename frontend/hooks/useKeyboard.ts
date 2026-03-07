'use client'

import { useEffect } from 'react'

interface Options {
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
}

export function useKeyboard(
  key: string,
  handler: () => void,
  options: Options = {}
) {

  useEffect(() => {

    const listener = (event: KeyboardEvent) => {

      if (event.key.toLowerCase() !== key.toLowerCase()) return

      if (options.ctrl && !event.ctrlKey) return
      if (options.meta && !event.metaKey) return
      if (options.shift && !event.shiftKey) return

      event.preventDefault()

      handler()
    }

    window.addEventListener('keydown', listener)

    return () => window.removeEventListener('keydown', listener)

  }, [key, handler, options])
}