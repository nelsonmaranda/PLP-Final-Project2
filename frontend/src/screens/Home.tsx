import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, BarChart3, Shield, Users, Clock, Star, ArrowRight } from 'lucide-react'
import apiService from '../services/api'
import { useTranslation } from '../hooks/useTranslation'
import { useSWR } from '../hooks/useSWR'

export default function Home() {
  const { t } = useTranslation()
  const [apiStatus, setApiStatus] = useState<'loading' | 'online' | 'offline'>('loading')

  // Use SWR for analytics data with retry and caching
  const { data: analyticsData } = useSWR(
    'homepage-analytics',
    () => apiService.getHomepageAnalytics(),
    {
      retryCount: 3,
      retryDelay: 1000,
      refreshInterval: 30000, // Refresh every 30 seconds
      onError: (error) => console.warn('Analytics fetch failed:', error)
    }
  )

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const res = await apiService.getHealth()
        setApiStatus(res?.success ? 'online' : 'offline')
      } catch {
        setApiStatus('offline')
      }
    }
    checkApiStatus()
  }, [])

  const statsData = analyticsData?.data || {
    totalRoutes: 0,
    totalReports: 0,
    averageScore: 0,
    totalUsers: 0
  }

  const stats = [
    { label: t('home.activeRoutes'), value: statsData.totalRoutes.toLocaleString(), icon: MapPin },
    { label: t('home.reportsToday'), value: statsData.totalReports.toLocaleString(), icon: BarChart3 },
    { label: t('home.safetyRating'), value: `${(statsData.averageScore || 0).toFixed(1)}★`, icon: Shield },
    { label: t('home.activeUsers'), value: statsData.totalUsers.toLocaleString(), icon: Users },
  ]

  const features = [
    {
      title: t('home.realTimeTracking'),
      description: t('home.realTimeTrackingDesc'),
      icon: Clock,
    },
    {
      title: t('home.safetyReports'),
      description: t('home.safetyReportsDesc'),
      icon: Shield,
    },
    {
      title: t('home.reliabilityScores'),
      description: t('home.reliabilityScoresDesc'),
      icon: Star,
    },
    {
      title: t('home.communityInsights'),
      description: t('home.communityInsightsDesc'),
      icon: Users,
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero" role="banner">
        <div className="hero-content">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              {t('home.title')}
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              {t('home.subtitle')}
            </p>
            
            {/* API Status */}
            <div className="mb-8" role="status" aria-live="polite">
              {apiStatus === 'loading' && (
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-100 text-yellow-800">
                  <div className="loading-spinner mr-2" aria-hidden="true"></div>
                  {t('home.checkingStatus')}
                </div>
              )}
              {apiStatus === 'online' && (
                <div className="status-online">
                  {t('home.systemOnline')}
                </div>
              )}
              {apiStatus === 'offline' && (
                <div className="status-offline">
                  {t('home.systemOffline')}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/map" className="btn btn-primary btn-lg">
                {t('home.viewMap')}
                <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
              </Link>
              <Link to="/report" className="btn btn-outline btn-lg">
                {t('home.reportTrip')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section bg-white" aria-labelledby="stats-heading">
        <div className="container">
          <h2 id="stats-heading" className="sr-only">Platform Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4">
                    <Icon className="w-6 h-6 text-primary-600" aria-hidden="true" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section bg-gray-50" aria-labelledby="features-heading">
        <div className="container">
          <div className="text-center mb-12">
            <h2 id="features-heading" className="text-3xl font-bold text-gray-900 mb-4">
              {t('home.howItWorks')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('home.howItWorksDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <article key={feature.title} className="card">
                  <div className="card-content text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-secondary-100 rounded-lg mb-4">
                      <Icon className="w-6 h-6 text-secondary-600" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-primary-600" aria-labelledby="cta-heading">
        <div className="container text-center">
          <h2 id="cta-heading" className="text-3xl font-bold text-white mb-4">
            {t('home.readyToStart')}
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            {t('home.readyToStartDesc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="btn btn-secondary btn-lg">
              {t('home.signUpNow')}
            </Link>
            <Link to="/map" className="btn btn-outline btn-lg text-white border-white hover:bg-white hover:text-primary-600">
              {t('home.exploreMap')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
