export async function requestNotificationPermission(): Promise<boolean> {

  if (!('Notification' in window)) return false

  const permission = await Notification.requestPermission()

  return permission === 'granted'
}


export async function scheduleRevisionReminder(
  time: string,
  topicsDue: number = 0
): Promise<void> {

  if (!('serviceWorker' in navigator)) return

  const permission = await requestNotificationPermission()

  if (!permission) return

  const [hour, minute] = parseTime(time)

  const now = new Date()

  const reminder = new Date()

  reminder.setHours(hour)
  reminder.setMinutes(minute)
  reminder.setSeconds(0)

  if (reminder.getTime() < now.getTime()) {
    reminder.setDate(reminder.getDate() + 1)
  }

  const delay = reminder.getTime() - now.getTime()

  const registration = await navigator.serviceWorker.ready

  setTimeout(() => {

    registration.showNotification('PrepTrack Reminder', {
      body: `Time to revise! You have ${topicsDue} topics due today.`,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      tag: 'revision-reminder',
      requireInteraction: true
    })

  }, delay)
}


export function cancelScheduledReminder(): void {

  if (!('serviceWorker' in navigator)) return

  navigator.serviceWorker.ready.then((registration) => {

    registration.getNotifications({
      tag: 'revision-reminder'
    }).then((notifications) => {

      notifications.forEach((n) => n.close())

    })

  })
}


function parseTime(time: string): [number, number] {

  const match = time.match(/(\d+)\s*(AM|PM)/i)

  if (!match) return [21, 0]

  let hour = parseInt(match[1])
  const period = match[2].toUpperCase()

  if (period === 'PM' && hour !== 12) hour += 12
  if (period === 'AM' && hour === 12) hour = 0

  return [hour, 0]
}