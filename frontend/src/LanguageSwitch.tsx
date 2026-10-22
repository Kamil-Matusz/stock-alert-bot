import { SegmentedControl } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { languages } from './i18n'

export function LanguageSwitch() {
  const { i18n } = useTranslation()

  return (
    <SegmentedControl
      size="xs"
      value={i18n.resolvedLanguage}
      onChange={(lng) => void i18n.changeLanguage(lng)}
      data={languages.map((lng) => ({ value: lng, label: lng.toUpperCase() }))}
    />
  )
}
