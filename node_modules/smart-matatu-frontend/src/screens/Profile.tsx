import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { 
  User, 
  History, 
  Heart, 
  BarChart3, 
  Edit3, 
  Save, 
  X,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  Star,
  RefreshCw
} from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import apiService from '../services/api'
import { Report, Route } from '../types'
import { useTranslation } from '../hooks/useTranslation'

export default function Profile() {
  const { t } = useTranslation()
  const { state, setUser } = useApp()
  const [activeTab, setActiveTab] = useState<'profile' | 'reports' | 'favorites' | 'analytics'>('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Profile editing state
  const [profileData, setProfileData] = useState({
    displayName: state.user?.displayName || '',
    email: state.user?.email || ''
  })
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(state.user?.avatarUrl || null)

  // Sync avatar URL when user state changes
  useEffect(() => {
    if (state.user?.avatarUrl) {
      setAvatarUrl(state.user.avatarUrl)
    }
  }, [state.user?.avatarUrl])
  
  // Reports state
  const [reports, setReports] = useState<Report[]>([])
  const [reportsLoading, setReportsLoading] = useState(false)
  
  // Favorites state
  const [favoriteRoutes, setFavoriteRoutes] = useState<Route[]>([])
  const [favoritesLoading, setFavoritesLoading] = useState(false)
  
  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalReports: 0,
    reportsThisMonth: 0,
    favoriteRoutesCount: 0,
    averageRating: 0,
    mostReportedRoute: null as string | null
  })

  // Load user reports
  const loadReports = useCallback(async () => {
    if (!state.user) return
    
    setReportsLoading(true)
    try {
      const response = await apiService.getUserReports(state.user._id)
      if (response.success && response.data) {
        setReports(response.data.reports || [])
      }
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setReportsLoading(false)
    }
  }, [state.user])

  // Load favorite routes
  const loadFavorites = useCallback(async () => {
    if (!state.user) return
    
    setFavoritesLoading(true)
    try {
      const response = await apiService.getFavoriteRoutes(state.user._id)
      if (response.success && response.data) {
        setFavoriteRoutes(response.data.routes || [])
      }
    } catch (error) {
      console.error('Error loading favorites:', error)
    } finally {
      setFavoritesLoading(false)
    }
  }, [state.user])

  // Load analytics
  const loadAnalytics = useCallback(async () => {
    if (!state.user) return
    
    try {
      const response = await apiService.getUserAnalytics(state.user._id)
      if (response.success && response.data) {
        setAnalytics(response.data)
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    }
  }, [state.user])

  // Remove favorite route
  const removeFavorite = useCallback(async (routeId: string) => {
    if (!state.user) return
    
    try {
      const response = await apiService.removeFavoriteRoute(state.user._id, routeId)
      if (response.success) {
        // Refresh favorites list
        loadFavorites()
      }
    } catch (error) {
      console.error('Error removing favorite:', error)
    }
  }, [state.user, loadFavorites])

  // Load data when component mounts or user changes
  useEffect(() => {
    if (state.user) {
      loadReports()
      loadFavorites()
      loadAnalytics()
    }
  }, [state.user, loadReports, loadFavorites, loadAnalytics])

  // Load data when active tab changes
  useEffect(() => {
    if (state.user) {
      switch (activeTab) {
        case 'reports':
          loadReports()
          break
        case 'favorites':
          loadFavorites()
          break
        case 'analytics':
          loadAnalytics()
          break
        default:
          break
      }
    }
  }, [activeTab, state.user, loadReports, loadFavorites, loadAnalytics])

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!state.user) return

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await apiService.updateProfile(state.user._id, profileData)
      if (response.success && response.data) {
        setUser(response.data.user)
        setSuccess(true)
        setIsEditing(false)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(t('profile.updateError'))
      }
    } catch (error) {
      console.error('Profile update error:', error)
      setError(t('profile.updateError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    try {
      setUploading(true)
      // For now, create a temporary URL for the uploaded image
      const tempUrl = URL.createObjectURL(file)
      setAvatarUrl(tempUrl)
      
      // Try to upload to backend, but fallback to temp URL if it fails
      try {
        const resp = await apiService.uploadFile(file, 'profile')
        if ((resp as any)?.success && (resp as any)?.data?.url) {
          const url = (resp as any).data.url
          setAvatarUrl(url)
          // Persist avatar to user profile
          await apiService.updateProfile(state.user!._id, { displayName: state.user!.displayName, email: state.user!.email, avatarUrl: url })
          setUser({ ...(state.user as any), avatarUrl: url })
        } else {
          // Fallback: save temp URL to profile (for demo purposes)
          await apiService.updateProfile(state.user!._id, { displayName: state.user!.displayName, email: state.user!.email, avatarUrl: tempUrl })
          setUser({ ...(state.user as any), avatarUrl: tempUrl })
        }
      } catch (uploadError) {
        console.log('Upload endpoint not available, using temporary URL')
        // Fallback: save temp URL to profile (for demo purposes)
        await apiService.updateProfile(state.user!._id, { displayName: state.user!.displayName, email: state.user!.email, avatarUrl: tempUrl })
        setUser({ ...(state.user as any), avatarUrl: tempUrl })
      }
    } catch (err) {
      console.error('Photo change failed', err)
    } finally {
      setUploading(false)
    }
  }

  // Add a simple URL input method as an alternative
  const handleAvatarUrlChange = async (url: string) => {
    try {
      setUploading(true)
      setAvatarUrl(url)
      // Update profile with the new avatar URL
      await apiService.updateProfile(state.user!._id, { displayName: state.user!.displayName, email: state.user!.email, avatarUrl: url })
      setUser({ ...(state.user as any), avatarUrl: url })
    } catch (err) {
      console.error('Avatar URL update failed', err)
    } finally {
      setUploading(false)
    }
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }))
  }


  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (!state.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('profile.pleaseLogin')}</h2>
          <p className="text-gray-600 mb-4">{t('profile.loginRequired')}</p>
          <Link to="/login" className="btn btn-primary">
            {t('profile.goToLogin')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-primary-500 flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-16 h-16 object-cover" />
              ) : (
                <User className="w-8 h-8 text-white" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{state.user.displayName}</h1>
              <p className="text-gray-600">{state.user.email}</p>
              <p className="text-sm text-gray-500 capitalize">{t('profile.role')}: {state.user.role}</p>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn btn-ghost btn-sm"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              {isEditing ? t('common.cancel') : t('profile.personalInfo.editProfile')}
            </button>
            <div className="ml-4 flex flex-col space-y-2">
              <label className="btn btn-outline btn-sm cursor-pointer">
                {uploading ? t('profile.personalInfo.uploading') : t('profile.personalInfo.uploadPhoto')}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="url"
                  placeholder="Or enter image URL"
                  className="px-2 py-1 text-xs border rounded w-48"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const target = e.target as HTMLInputElement;
                      if (target.value) {
                        handleAvatarUrlChange(target.value);
                        target.value = '';
                      }
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    if (input?.value) {
                      handleAvatarUrlChange(input.value);
                      input.value = '';
                    }
                  }}
                  className="btn btn-ghost btn-xs"
                  disabled={uploading}
                >
                  Set
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'profile', name: t('profile.tabs.personal'), icon: User },
                { id: 'reports', name: t('profile.tabs.reports'), icon: History },
                { id: 'favorites', name: t('profile.tabs.favorites'), icon: Heart },
                { id: 'analytics', name: t('profile.tabs.analytics'), icon: BarChart3 }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                {isEditing ? (
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    {error && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                          <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                          <p className="text-sm text-red-800">{error}</p>
                        </div>
                      </div>
                    )}
                    
                    {success && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                          <p className="text-sm text-green-800">Profile updated successfully!</p>
                        </div>
                      </div>
                    )}

                    <div>
                      <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('profile.personalInfo.displayName')}
                      </label>
                      <input
                        type="text"
                        id="displayName"
                        name="displayName"
                        value={profileData.displayName}
                        onChange={handleInputChange}
                        className="input w-full"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('profile.personalInfo.email')}
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleInputChange}
                        className="input w-full"
                        required
                      />
                    </div>

                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="btn btn-primary"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="btn btn-ghost"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">{t('profile.accountInformation')}</h3>
                      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">{t('profile.personalInfo.displayName')}</dt>
                          <dd className="mt-1 text-sm text-gray-900">{state.user.displayName}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">{t('profile.personalInfo.email')}</dt>
                          <dd className="mt-1 text-sm text-gray-900">{state.user.email}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">{t('profile.accountType')}</dt>
                          <dd className="mt-1 text-sm text-gray-900 capitalize">{state.user.role}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">{t('profile.memberSince')}</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {new Date(state.user.createdAt || Date.now()).toLocaleDateString('en-KE')}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{t('profile.myTripReports')}</h3>
                  <button
                    onClick={loadReports}
                    disabled={reportsLoading}
                    className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${reportsLoading ? 'animate-spin' : ''}`} />
                    <span>{t('profile.refresh')}</span>
                  </button>
                </div>
                {reportsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">{t('profile.noReportsYet')}</p>
                    <Link to="/report" className="btn btn-primary">
                      {t('profile.submitFirstReport')}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">
                                Route {report.routeId}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(report.severity)}`}>
                                {report.severity}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDate(report.createdAt)}
                              </div>
                              <span className="capitalize">Type: {report.reportType}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Favorites Tab */}
            {activeTab === 'favorites' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{t('profile.favoriteRoutes')}</h3>
                  <button
                    onClick={loadFavorites}
                    disabled={favoritesLoading}
                    className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${favoritesLoading ? 'animate-spin' : ''}`} />
                    <span>{t('profile.refresh')}</span>
                  </button>
                </div>
                {favoritesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  </div>
                ) : favoriteRoutes.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">{t('profile.noFavoriteRoutes')}</p>
                    <Link to="/map" className="btn btn-primary">
                      {t('profile.exploreRoutes')}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {favoriteRoutes.map((route) => (
                      <div key={route._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">{route.name}</h4>
                            <p className="text-sm text-gray-600">{route.operator}</p>
                            <p className="text-xs text-gray-500">Route {route.routeNumber}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/map?route=${route._id}`}
                              className="btn btn-ghost btn-sm"
                            >
                              View
                            </Link>
                            <button
                              onClick={() => removeFavorite(route._id)}
                              className="btn btn-ghost btn-sm text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">{t('profile.yourAnalytics')}</h3>
                  <button
                    onClick={loadAnalytics}
                    className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>{t('profile.refresh')}</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <History className="w-8 h-8 text-blue-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-600">{t('profile.totalReports')}</p>
                        <p className="text-2xl font-bold text-blue-900">{analytics.totalReports}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <Clock className="w-8 h-8 text-green-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-600">{t('profile.thisMonth')}</p>
                        <p className="text-2xl font-bold text-green-900">{analytics.reportsThisMonth}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <Heart className="w-8 h-8 text-purple-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-purple-600">{t('profile.favorites')}</p>
                        <p className="text-2xl font-bold text-purple-900">{analytics.favoriteRoutesCount}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <Star className="w-8 h-8 text-yellow-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-yellow-600">{t('profile.avgRating')}</p>
                        <p className="text-2xl font-bold text-yellow-900">{analytics.averageRating.toFixed(1)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {analytics.mostReportedRoute && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Most Reported Route</h4>
                    <p className="text-sm text-gray-600">{analytics.mostReportedRoute}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
