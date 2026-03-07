import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PrepTrack — Placement OS',
    short_name: 'PrepTrack',
    description: 'Your personal placement preparation operating system',

    start_url: '/dashboard',
    display: 'standalone',

    background_color: '#08080f',
    theme_color: '#6366f1',

    orientation: 'portrait-primary',

    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icons/icon-96.png',
        sizes: '96x96',
        type: 'image/png'
      }
    ],

    shortcuts: [
      {
        name: "Today's Revision",
        short_name: 'Revision',
        url: '/revision'
      },
      {
        name: 'Quick Goal Check',
        short_name: 'Goals',
        url: '/goals'
      },
      {
        name: 'Add Problem',
        short_name: 'Add Problem',
        url: '/coding?action=add'
      }
    ],

    categories: ['education', 'productivity']
  }
}