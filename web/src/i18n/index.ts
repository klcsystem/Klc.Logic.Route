import { createContext, useContext } from 'react'
import en from './en'
import tr from './tr'
import type { Translations } from './en'

export type Lang = 'en' | 'tr'

export const translations: Record<Lang, Translations> = { en, tr }

export interface I18nContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: Translations
}

export const I18nContext = createContext<I18nContextType>({
  lang: 'tr',
  setLang: () => {},
  t: tr,
})

export function useI18n() {
  return useContext(I18nContext)
}

export { en, tr }
export type { Translations }
