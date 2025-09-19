import { MapPin, Mail, Phone, Globe } from 'lucide-react'

export default function Footer() {
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
              Making Nairobi's transport system more reliable, safe, and accessible for everyone.
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
                href="mailto:hello@smart-matatu.ke" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Send us an email"
              >
                <Mail className="w-5 h-5" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <nav aria-label="Footer navigation">
              <ul className="space-y-2">
                <li><a href="/" className="text-gray-400 hover:text-white transition-colors">Home</a></li>
                <li><a href="/map" className="text-gray-400 hover:text-white transition-colors">Map</a></li>
                <li><a href="/report" className="text-gray-400 hover:text-white transition-colors">Report</a></li>
                <li><a href="/login" className="text-gray-400 hover:text-white transition-colors">Login</a></li>
              </ul>
            </nav>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <nav aria-label="Services navigation">
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Route Planning</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Safety Reports</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Real-time Updates</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Analytics</a></li>
              </ul>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <address className="not-italic">
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" aria-hidden="true" />
                  <span className="text-gray-400">Nairobi, Kenya</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" aria-hidden="true" />
                  <a 
                    href="mailto:hello@smart-matatu.ke" 
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    hello@smart-matatu.ke
                  </a>
                </li>
                <li className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" aria-hidden="true" />
                  <a 
                    href="tel:+254700000000" 
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    +254 700 000 000
                  </a>
                </li>
              </ul>
            </address>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Smart Matatu. All rights reserved.
            </p>
            <nav className="flex space-x-6 mt-4 md:mt-0" aria-label="Legal links">
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">SDG 11</a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}