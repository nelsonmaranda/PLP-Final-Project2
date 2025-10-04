import { useTranslation } from '../hooks/useTranslation'
import { useApp } from '../contexts/AppContext'
import { languageStrings } from '../contexts/AppContext'
import { MapPin, Languages } from 'lucide-react'

export default function PrivacyPolicy() {
  const { t, language } = useTranslation()
  const { state, setLanguage } = useApp()
  
  // Get current language legal arrays directly from exported languageStrings
  const currentStrings = languageStrings[language]?.legal?.privacyPolicy

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto bg-white shadow rounded-lg overflow-hidden">
        {/* Header with branding */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{t('legal.privacyPolicy.title')}</h1>
                <p className="text-primary-100">{t('legal.privacyPolicy.lastUpdated')}: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Languages className="w-5 h-5" />
              <select 
                value={state.language} 
                onChange={(e) => setLanguage(e.target.value as 'en' | 'sw')}
                className="bg-white bg-opacity-20 border border-white border-opacity-30 rounded px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              >
                <option value="en">English</option>
                <option value="sw">Kiswahili</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
              {t('legal.privacyPolicy.introduction.title')}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {t('legal.privacyPolicy.introduction.content')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
              {t('legal.privacyPolicy.dataCollection.title')}
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              {(currentStrings?.dataCollection?.items ?? []).map((item: string, index: number) => (
                <li key={index} className="leading-relaxed">{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
              {t('legal.privacyPolicy.dataUsage.title')}
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              {(currentStrings?.dataUsage?.items ?? []).map((item: string, index: number) => (
                <li key={index} className="leading-relaxed">{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
              {t('legal.privacyPolicy.sharing.title')}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {t('legal.privacyPolicy.sharing.content')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
              {t('legal.privacyPolicy.retention.title')}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {t('legal.privacyPolicy.retention.content')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
              {t('legal.privacyPolicy.rights.title')}
            </h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              {(currentStrings?.rights?.items ?? []).map((item: string, index: number) => (
                <li key={index} className="leading-relaxed">{item}</li>
              ))}
            </ul>
          </section>

          <section className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <div className="w-2 h-2 bg-primary-500 rounded-full mr-3"></div>
              {t('legal.privacyPolicy.contact.title')}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {t('legal.privacyPolicy.contact.content')}
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}


