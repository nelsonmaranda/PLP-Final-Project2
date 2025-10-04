import { MapPin, Mail, Phone, Globe } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'

export default function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="bg-gray-900 text-white" role="contentinfo">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <span className="text-xl font-bold">Smart Matatu</span>
            </div>
            <p className="text-gray-400 text-sm">
              {t('footer.description')}
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Visit our website"
              >
                <Globe className="w-5 h-5" aria-hidden="true" />
              </a>
              <a 
                href="mailto:contact@smart-matatu.ke" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Send us an email"
              >
                <Mail className="w-5 h-5" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer.quickLinks')}</h3>
            <nav aria-label="Footer navigation">
              <ul className="space-y-2">
                <li><a href="/" className="text-gray-400 hover:text-white transition-colors">{t('navigation.home')}</a></li>
                <li><a href="/map" className="text-gray-400 hover:text-white transition-colors">{t('navigation.map')}</a></li>
                <li><a href="/report" className="text-gray-400 hover:text-white transition-colors">{t('navigation.report')}</a></li>
                <li><a href="/login" className="text-gray-400 hover:text-white transition-colors">{t('navigation.login')}</a></li>
              </ul>
            </nav>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer.services')}</h3>
            <nav aria-label="Services navigation">
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t('footer.routePlanning')}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t('footer.safetyReports')}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t('footer.realTimeUpdates')}</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">{t('footer.analytics')}</a></li>
              </ul>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer.contact')}</h3>
            <address className="not-italic">
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" aria-hidden="true" />
                  <span className="text-gray-400">Western Heights, Muthithi Rd, Westlands</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" aria-hidden="true" />
                  <button 
                    onClick={() => {
                      // Open email client with pre-filled subject and body
                      window.location.href = 'mailto:contact@smart-matatu.ke?subject=Smart Matatu Inquiry&body=Hello, I would like to get in touch regarding Smart Matatu services.'
                    }}
                    className="text-gray-400 hover:text-white transition-colors text-left"
                  >
                    contact@smart-matatu.ke
                  </button>
                </li>
                <li className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" aria-hidden="true" />
                  <button 
                    onClick={() => window.open(`tel:+254763612953`, '_blank')}
                    className="text-gray-400 hover:text-white transition-colors text-left"
                  >
                    +254 763 612 953
                  </button>
                </li>
              </ul>
            </address>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Smart Matatu. {t('footer.allRightsReserved')}
            </p>
            <nav className="flex space-x-6 mt-4 md:mt-0" aria-label="Legal links">
              <a href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">{t('footer.privacyPolicy')}</a>
              <a href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">{t('footer.termsOfService')}</a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}