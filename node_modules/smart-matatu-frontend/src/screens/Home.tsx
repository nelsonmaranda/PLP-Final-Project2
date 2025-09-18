import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, BarChart3, Shield, Users, Clock, Star, ArrowRight } from 'lucide-react'

export default function Home() {
  const [apiStatus, setApiStatus] = useState<'loading' | 'online' | 'offline'>('loading')

  useEffect(() => {
    // Simulate API health check
    const checkApiStatus = async () => {
      try {
        // In a real app, this would call your API
        await new Promise(resolve => setTimeout(resolve, 1000))
        setApiStatus('online')
      } catch (error) {
        setApiStatus('offline')
      }
    }

    checkApiStatus()
  }, [])

  const stats = [
    { label: 'Active Routes', value: '15', icon: MapPin },
    { label: 'Reports Today', value: '234', icon: BarChart3 },
    { label: 'Safety Rating', value: '4.2★', icon: Shield },
    { label: 'Active Users', value: '1,200', icon: Users },
  ]

  const features = [
    {
      title: 'Real-time Route Tracking',
      description: 'Get live updates on matatu locations, delays, and availability.',
      icon: Clock,
    },
    {
      title: 'Safety Reports',
      description: 'Report and view safety incidents to help keep everyone safe.',
      icon: Shield,
    },
    {
      title: 'Reliability Scores',
      description: 'See which routes are most reliable based on community data.',
      icon: Star,
    },
    {
      title: 'Community Insights',
      description: 'Share experiences and help others make informed transport decisions.',
      icon: Users,
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Welcome to{' '}
              <span className="text-primary-600">Smart Matatu</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Find reliable and safe matatu routes across Nairobi with real-time updates, 
              community insights, and safety information.
            </p>
            
            {/* API Status */}
            <div className="mb-8">
              {apiStatus === 'loading' && (
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-100 text-yellow-800">
                  <div className="loading-spinner mr-2"></div>
                  Checking system status...
                </div>
              )}
              {apiStatus === 'online' && (
                <div className="status-online">
                  System Online - All services operational
                </div>
              )}
              {apiStatus === 'offline' && (
                <div className="status-offline">
                  System Offline - Limited functionality
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/map" className="btn btn-primary btn-lg">
                View Map
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link to="/report" className="btn btn-outline btn-lg">
                Report Trip
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section bg-white">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4">
                    <Icon className="w-6 h-6 text-primary-600" />
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
      <section className="section bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How Smart Matatu Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform combines community insights with real-time data to make 
              Nairobi's transport system more reliable and safe.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="card">
                  <div className="card-content text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-secondary-100 rounded-lg mb-4">
                      <Icon className="w-6 h-6 text-secondary-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-primary-600">
        <div className="container text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of Nairobi commuters who are already using Smart Matatu 
            to make their daily journeys safer and more reliable.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="btn btn-secondary btn-lg">
              Sign Up Now
            </Link>
            <Link to="/map" className="btn btn-outline btn-lg text-white border-white hover:bg-white hover:text-primary-600">
              Explore Map
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
