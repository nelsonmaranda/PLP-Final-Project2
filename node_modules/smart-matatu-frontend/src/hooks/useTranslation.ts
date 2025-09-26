import { useApp } from '../contexts/AppContext'
import { languageStrings } from '../contexts/AppContext'

export function useTranslation() {
  const { state } = useApp()
  const currentLanguage = state.language || 'en'
  
  const t = (key: string): string => {
    const keys = key.split('.')
    let value: any = languageStrings[currentLanguage]
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        // Fallback to English if key not found
        value = languageStrings.en
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey]
          } else {
            return key // Return key if not found in either language
          }
        }
        break
      }
    }
    
    return typeof value === 'string' ? value : key
  }
  
  return { t, language: currentLanguage }
}
