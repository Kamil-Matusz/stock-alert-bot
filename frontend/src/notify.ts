import { notifications } from '@mantine/notifications'
import i18n from './i18n'

export function notifyError(message: string) {
  notifications.show({ color: 'red', title: i18n.t('common.error'), message })
}

export function notifySuccess(message: string) {
  notifications.show({ color: 'teal', message })
}
