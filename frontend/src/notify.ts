import { notifications } from '@mantine/notifications'

export function notifyError(message: string) {
  notifications.show({ color: 'red', title: 'Błąd', message })
}

export function notifySuccess(message: string) {
  notifications.show({ color: 'teal', message })
}
