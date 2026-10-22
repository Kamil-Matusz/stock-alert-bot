import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { pl } from './locales/pl'
import { en } from './locales/en'

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: { translation: typeof pl }
  }
}

export const languages = ['pl', 'en'] as const

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
})

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { pl: { translation: pl }, en: { translation: en } },
    supportedLngs: languages,
    fallbackLng: 'pl',
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
  })

export default i18n
