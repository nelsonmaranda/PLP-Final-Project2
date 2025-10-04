import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { User, UserSettings, LanguageStrings } from '../types'
import apiService from '../services/api'

// App State Interface
interface AppState {
  user: User | null
  isAuthenticated: boolean | undefined // undefined means not yet determined
  language: 'en' | 'sw'
  settings: UserSettings
  theme: 'light' | 'dark' | 'auto'
  notifications: boolean
  isLoading: boolean
  error: string | null
}

// Action Types
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_LANGUAGE'; payload: 'en' | 'sw' }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' | 'auto' }
  | { type: 'SET_NOTIFICATIONS'; payload: boolean }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<UserSettings> }
  | { type: 'LOGOUT' }
  | { type: 'RESET' }

// Load initial language from localStorage; default to English
const getInitialLanguage = (): 'en' | 'sw' => {
  try {
    const saved = localStorage.getItem('language')
    if (saved === 'en' || saved === 'sw') return saved as 'en' | 'sw'
    // If nothing saved, default to English
    const initial: 'en' | 'sw' = 'en'
    localStorage.setItem('language', initial)
    return initial
  } catch {
    return 'en'
  }
}

// Initial State
const initialState: AppState = {
  user: null,
  isAuthenticated: undefined, // Start as undefined to prevent flash
  language: getInitialLanguage(),
  settings: {
    language: getInitialLanguage(),
    notifications: {
      email: true,
      push: true,
      safety: true,
      updates: true,
    },
    privacy: {
      shareLocation: true,
      shareReports: true,
      analytics: true,
    },
    display: {
      theme: 'auto',
      mapStyle: 'default',
    },
  },
  theme: 'light',
  notifications: true,
  isLoading: true, // Start as loading
  error: null,
}

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false }
    
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: !!action.payload }
    
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload }
    
    case 'SET_LANGUAGE':
      return { 
        ...state, 
        language: action.payload,
        settings: { ...state.settings, language: action.payload }
      }
    
    case 'SET_THEME':
      return { 
        ...state, 
        theme: action.payload,
        settings: { ...state.settings, display: { ...state.settings.display, theme: action.payload } }
      }
    
    case 'SET_NOTIFICATIONS':
      return { 
        ...state, 
        notifications: action.payload,
        settings: { 
          ...state.settings, 
          notifications: { 
            ...state.settings.notifications, 
            push: action.payload 
          } 
        }
      }
    
    case 'UPDATE_SETTINGS':
      const newSettings = { ...state.settings, ...action.payload }
      return { 
        ...state, 
        settings: newSettings,
        language: newSettings.language || state.language
      }
    
    case 'LOGOUT':
      return { 
        ...state, 
        user: null, 
        isAuthenticated: false, 
        error: null 
      }
    
    case 'RESET':
      return initialState
    
    default:
      return state
  }
}

// Context
interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  // Actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setUser: (user: User | null) => void
  setLanguage: (language: 'en' | 'sw') => void
  setTheme: (theme: 'light' | 'dark' | 'auto') => void
  setNotifications: (notifications: boolean) => void
  updateSettings: (settings: Partial<UserSettings>) => void
  logout: () => void
  reset: () => void
  // Computed values
  isDarkMode: boolean
  currentLanguage: 'en' | 'sw'
}

const AppContext = createContext<AppContextType | undefined>(undefined)

// Provider Component
interface AppProviderProps {
  children: React.ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        // First check localStorage for existing token
        const token = localStorage.getItem('authToken')
        const storedUser = localStorage.getItem('user')
        
        if (token && storedUser) {
          try {
            // Parse and immediately set stored user for instant load
            const parsedUser = JSON.parse(storedUser)
            dispatch({ type: 'SET_USER', payload: parsedUser })
            dispatch({ type: 'SET_LOADING', payload: false })
            
            // Then refresh user data in background (no await)
            apiService.getCurrentUser()
              .then(user => {
                if (user) {
                  dispatch({ type: 'SET_USER', payload: user })
                  localStorage.setItem('user', JSON.stringify(user))
                } else {
                  // If API call fails, clear stored data and log out
                  console.warn('API call failed, clearing stored data')
                  localStorage.removeItem('authToken')
                  localStorage.removeItem('user')
                  dispatch({ type: 'SET_USER', payload: null })
                }
              })
              .catch(error => {
                // If API fails but token exists, keep using stored data
                // Only clear on 401 (handled by interceptor)
                console.warn('Failed to refresh user data:', error)
              })
          } catch (error) {
            // If parsing fails, clear stored data
            console.warn('Failed to parse stored user:', error)
            localStorage.removeItem('authToken')
            localStorage.removeItem('user')
            dispatch({ type: 'SET_USER', payload: null })
            dispatch({ type: 'SET_LOADING', payload: false })
          }
        } else {
          // No token/user, stop loading immediately
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      } catch (error) {
        console.error('Error loading user:', error)
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    loadUser()
  }, [])

  // Load settings from localStorage
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('appSettings')
        if (savedSettings) {
          const settings = JSON.parse(savedSettings)
          dispatch({ type: 'UPDATE_SETTINGS', payload: settings })
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }

    loadSettings()
  }, [])

  // Save settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('appSettings', JSON.stringify(state.settings))
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }, [state.settings])

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    if (state.theme === 'dark' || (state.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [state.theme])

  // Apply language to document
  useEffect(() => {
    document.documentElement.lang = state.language
  }, [state.language])

  // Action creators
  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }

  const setUser = (user: User | null) => {
    console.log('AppContext setUser called with:', user)
    dispatch({ type: 'SET_USER', payload: user })
  }

  const setLanguage = (language: 'en' | 'sw') => {
    try {
      localStorage.setItem('language', language)
    } catch (error) {
      console.error('Error saving language to localStorage:', error)
    }
    dispatch({ type: 'SET_LANGUAGE', payload: language })
  }

  const setTheme = (theme: 'light' | 'dark' | 'auto') => {
    dispatch({ type: 'SET_THEME', payload: theme })
  }

  const setNotifications = (notifications: boolean) => {
    dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications })
  }

  const updateSettings = (settings: Partial<UserSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings })
  }

  const logout = () => {
    apiService.logout()
    dispatch({ type: 'LOGOUT' })
  }

  const reset = () => {
    apiService.logout()
    dispatch({ type: 'RESET' })
  }

  // Computed values
  const isDarkMode = state.theme === 'dark' || (state.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const currentLanguage = state.language

  const value: AppContextType = {
    state,
    dispatch,
    setLoading,
    setError,
    setUser,
    setLanguage,
    setTheme,
    setNotifications,
    updateSettings,
    logout,
    reset,
    isDarkMode,
    currentLanguage,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

// Hook to use the context
export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

// Language strings
export const languageStrings: Record<'en' | 'sw', LanguageStrings> = {
  en: {
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      submit: 'Submit',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      refresh: 'Refresh',
    },
    navigation: {
      home: 'Home',
      map: 'Map',
      report: 'Report',
      login: 'Login',
      signup: 'Sign Up',
      admin: 'Admin',
      profile: 'Profile',
      settings: 'Settings',
      dashboard: 'Dashboard',
      analytics: 'Analytics',
      subscription: 'Subscription',
      saccoDashboard: 'SACCO Dashboard',
      authorityDashboard: 'Authority Dashboard',
      userManagement: 'User Management',
      adminPanel: 'Admin Panel',
      quickActions: 'Quick Actions',
      favorites: 'Favorites',
      reports: 'Reports',
      safety: 'Safety',
      predictions: 'Predictions',
      saccoManagement: 'SACCO Management',
      authorityTools: 'Authority Tools',
      fleetManagement: 'Fleet Management',
      compliance: 'Compliance',
      adminAnalytics: 'Admin Analytics',
      saccoAnalytics: 'SACCO Analytics',
      authorityAnalytics: 'Authority Analytics',
      moderatorAnalytics: 'Moderator Analytics',
      myAnalytics: 'My Analytics',
    },
    auth: {
      login: 'Login',
      signup: 'Sign Up',
      logout: 'Logout',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      displayName: 'Display Name',
      rememberMe: 'Remember Me',
      forgotPassword: 'Forgot Password?',
      createAccount: 'Create Account',
      alreadyHaveAccount: 'Already have an account?',
      dontHaveAccount: "Don't have an account?",
      loginTitle: 'Welcome Back',
      loginSubtitle: 'Sign in to your account to continue',
      signupTitle: 'Create Account',
      signupSubtitle: 'Join Smart Matatu and start your journey',
      emailPlaceholder: 'Enter your email',
      passwordPlaceholder: 'Enter your password',
      displayNamePlaceholder: 'Enter your display name',
      confirmPasswordPlaceholder: 'Confirm your password',
      organizationPlaceholder: 'Enter your organization (optional)',
      selectRole: 'Select your role',
      signIn: 'Sign In',
      signUp: 'Sign Up',
      creatingAccount: 'Creating account...',
      signingIn: 'Signing in...',
      loginSuccess: 'Login successful!',
      signupSuccess: 'Account created successfully!',
      loginError: 'Login failed. Please check your credentials.',
      signupError: 'Signup failed. Please try again.',
      emailRequired: 'Email is required',
      passwordRequired: 'Password is required',
      displayNameRequired: 'Display name is required',
      passwordTooShort: 'Password must be at least 8 characters',
      emailInvalid: 'Please enter a valid email address',
      passwordsDoNotMatch: 'Passwords do not match',
      resetPasswordTitle: 'Reset password',
      resetPasswordSubtitle: 'Enter your new password below.',
      forgotPasswordTitle: 'Forgot password',
      forgotPasswordSubtitle: 'Enter your email to receive a reset link.',
      sendResetLink: 'Send reset link',
      resetting: 'Resetting…',
      resetPassword: 'Reset password',
      verificationSent: 'Verification email sent. Please check your inbox.',
      verificationResent: 'Verification email sent. Please check your inbox.',
      backToLogin: 'Back to login',
    },
    map: {
      title: 'Nairobi Matatu Routes',
      loading: 'Loading routes...',
      noRoutes: 'No routes available',
      selectRoute: 'Select a route',
      viewDetails: 'View Details',
      reportTrip: 'Report Trip',
      filter: 'Filter',
      sort: 'Sort',
      toggleFilters: 'Toggle filter panel',
      toggleListView: 'Toggle list view',
      quickFilters: 'Quick Filters',
      highReliability: 'High Reliability (4+ stars)',
      safeRoutes: 'Safe Routes (4+ stars)',
      lowFare: 'Low Fare (Under 50 KES)',
      ofRoutes: '{current} of {total} routes',
      availableRoutes: 'Available Routes',
      filters: 'Filters',
      routeFilters: 'Route filters',
      fare: 'Fare',
      hours: 'Hours',
      stops: 'Stops',
      routeNo: 'Route No.',
      viewOnMap: 'View on Map',
      rate: 'Rate',
      tryAgain: 'Try Again',
      genericError: 'An error occurred',
      mapAria: 'Interactive map showing Nairobi matatu routes',
    },
    report: {
      title: 'Report Your Trip',
      route: 'Route',
      selectRoute: 'Select a route',
      saccoOptional: 'Matatu SACCO (optional)',
      selectSacco: 'Select SACCO',
      otherSacco: 'Other',
      specifyOtherSacco: 'Specify Other SACCO',
      otherSaccoPlaceholder: 'Enter SACCO name...',
      otherSaccoRequired: 'Please specify the SACCO name',
      direction: 'Direction',
      fromCBD: 'From CBD',
      toCBD: 'To CBD',
      alongRoute: 'Along this route',
      fare: 'Fare (KSh)',
      farePlaceholder: 'e.g., 80',
      reportType: 'Report Type',
      delay: 'Delay',
      overcrowding: 'Overcrowding',
      breakdown: 'Breakdown',
      safety: 'Safety issue',
      other: 'Other',
      severity: 'Severity',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      critical: 'Critical',
      anonymous: 'Submit anonymously',
      description: 'Description',
      descriptionPlaceholder: 'Describe the issue...',
      loading: 'Loading report form...',
      submit: 'Submit Report',
      success: 'Report submitted successfully',
    },
    analytics: {
      loading: 'Loading Advanced Analytics...',
      errorTitle: 'Error Loading Analytics',
      retry: 'Retry',
      headerTitle: 'Advanced Analytics',
      headerSubtitle: 'Comprehensive insights and predictions for route optimization',
      // keys already exist in types: recommendationsTitle, yourPreferences, recommendedRoutes
      tabs: {
        efficiency: 'Route Efficiency',
        predictions: 'Travel Predictions',
        trends: 'Trend Analysis',
        recommendations: 'Recommendations',
      },
      efficiencyTitle: 'Route Efficiency Scores',
      selectRoute: 'Select a route',
      refresh: 'Refresh',
      recommendationsTitle: 'Personalized Recommendations',
      yourPreferences: 'Your Preferences',
      prefEfficiency: 'Efficiency',
      prefSafety: 'Safety',
      prefCost: 'Cost',
      prefConvenience: 'Convenience',
      goodPerformance: 'Good performance',
      recommendedRoutes: 'Recommended Routes',
      travelPredictionsTitle: 'Travel Time Predictions',
      predict: 'Predict',
      fromStop: 'From stop',
      toStop: 'To stop',
      timeSlot: 'Time',
      minutesShort: 'min',
      confidence: 'confidence',
      optimistic: 'Optimistic',
      realistic: 'Realistic',
      pessimistic: 'Pessimistic',
      factors: 'Factors',
      alternativeRoutesTitle: 'Alternative Routes',
      find: 'Find',
      reasons: 'Reasons',
      trendAnalysisTitle: 'Trend Analysis',
      periodDaily: 'Daily',
      periodWeekly: 'Weekly',
      periodMonthly: 'Monthly',
      update: 'Update',
      routeTrends: 'Route Trends',
      current: 'Current',
      previous: 'Previous',
      insights: 'Insights',
      demandForecastsTitle: 'Demand Forecasts',
    },
    home: {
      title: 'Welcome to Smart Matatu',
      subtitle: 'Find reliable and safe matatu routes across Nairobi with real-time updates, community insights, and safety information.',
      viewMap: 'View Map',
      reportTrip: 'Report Trip',
      systemOnline: 'System Online - All services operational',
      systemOffline: 'System Offline - Limited functionality',
      checkingStatus: 'Checking system status...',
      activeRoutes: 'Active Routes',
      reportsToday: 'Reports Today',
      safetyRating: 'Safety Rating',
      activeUsers: 'Active Users',
      howItWorks: 'How Smart Matatu Works',
      howItWorksDesc: 'Our platform combines community insights with real-time data to make Nairobi\'s transport system more reliable and safe.',
      realTimeTracking: 'Real-time Route Tracking',
      realTimeTrackingDesc: 'Get live updates on matatu locations, delays, and availability.',
      safetyReports: 'Safety Reports',
      safetyReportsDesc: 'Report and view safety incidents to help keep everyone safe.',
      reliabilityScores: 'Reliability Scores',
      reliabilityScoresDesc: 'See which routes are most reliable based on community data.',
      communityInsights: 'Community Insights',
      communityInsightsDesc: 'Share experiences and help others make informed transport decisions.',
      readyToStart: 'Ready to Get Started?',
      readyToStartDesc: 'Join thousands of Nairobi commuters who are already using Smart Matatu to make their daily journeys safer and more reliable.',
      signUpNow: 'Sign Up Now',
      exploreMap: 'Explore Map',
    },
    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome back',
      smartRouteInsights: 'Smart Route Insights',
      weatherConditions: 'Weather Conditions',
      favoriteRoutes: 'Favorite Routes',
      recentReports: 'Recent Reports',
      viewAllReports: 'View All Reports',
      noReports: 'No recent reports',
      noFavorites: 'No favorite routes yet',
      addFavorites: 'Add some routes to your favorites to see them here',
      loading: 'Loading dashboard...',
      loadingYourDashboard: 'Loading your smart dashboard...',
      errorTitle: 'Dashboard Error',
      tryAgain: 'Try Again',
      headerSubtitle: "Here's your personalized matatu insights for today",
      currentWeather: 'Current Weather',
      humidityLabel: 'humidity',
      windSpeedLabel: 'km/h',
      activeRoutesTitle: 'Active Routes',
      routesMonitored: 'Routes monitored',
      avgFareTitle: 'Avg Fare',
      currentAverage: 'Current average',
      overallSafety: 'Overall safety',
      viewAllRoutesBtn: 'View All Routes',
      aiRecommendations: 'AI-powered recommendations for your daily commute',
      noInsights: 'No route insights available',
      exploreRoutes: 'Explore Routes',
      routeIdLabel: 'Route ID',
      crowdSuffix: 'crowd',
      crowdLow: 'Low crowd',
      crowdMedium: 'Medium crowd',
      crowdHigh: 'High crowd',
      predictedFareLabel: 'Predicted fare',
      safetyScoreLabel: 'Safety score',
      travelTimeLabel: 'Travel time',
      bestTimeLabel: 'Best time',
      routeLabel: 'Route',
      viewLabel: 'View',
      submitReportBtn: 'Submit Report',
      refresh: 'Refresh',
      quickActions: 'Quick Actions',
      quickViewMap: 'View Map',
      quickSubmitReport: 'Submit Report',
      quickViewProfile: 'View Profile',
      totalRoutes: 'Total Routes',
      activeReports: 'Active Reports',
      averageFare: 'Average Fare',
      safetyRating: 'Safety Rating',
      temperature: 'Temperature',
      humidity: 'Humidity',
      windSpeed: 'Wind Speed',
      routeName: 'Route Name',
      farePrediction: 'Fare Prediction',
      safetyScore: 'Safety Score',
      crowdDensity: 'Crowd Density',
      travelTime: 'Travel Time',
      recommendedTime: 'Recommended Time',
      alternativeRoutes: 'Alternative Routes',
      weatherImpact: 'Weather Impact',
      lastUpdated: 'Last Updated',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      excellent: 'Excellent',
      good: 'Good',
      average: 'Average',
    poor: 'Poor',
    veryPoor: 'Very Poor',
    },
    footer: {
      description: 'Making Nairobi\'s transport system more reliable, safe, and accessible for everyone.',
      quickLinks: 'Quick Links',
      services: 'Services',
      contact: 'Contact',
      routePlanning: 'Route Planning',
      safetyReports: 'Safety Reports',
      realTimeUpdates: 'Real-time Updates',
      analytics: 'Analytics',
      privacyPolicy: 'Privacy Policy',
      termsOfService: 'Terms of Service',
      allRightsReserved: 'All rights reserved.',
    },
    // Legal Pages
    legal: {
      privacyPolicy: {
        title: 'Privacy Policy',
        lastUpdated: 'Last updated',
        introduction: {
          title: 'Introduction',
          content: 'Smart Matatu collects and processes data to provide reliable public transport insights and services. This policy explains what data we collect, how we use it, and your rights.'
        },
        dataCollection: {
          title: 'Data We Collect',
          items: [
            'Account information (name, email, role, organization)',
            'Usage data (page views, actions, device information)',
            'Report submissions (type, description, location if provided)',
            'Payment and subscription metadata (status, amount, method)'
          ]
        },
        dataUsage: {
          title: 'How We Use Data',
          items: [
            'Provide and improve analytics and platform features',
            'Prevent abuse through rate limiting and security monitoring',
            'Process subscriptions and payments',
            'Communicate service updates and support'
          ]
        },
        sharing: {
          title: 'Sharing & Disclosure',
          content: 'We do not sell personal data. We may share data with trusted processors (e.g., hosting, email, and payment providers) under strict contracts, or when required by law.'
        },
        retention: {
          title: 'Data Retention',
          content: 'We retain data only as long as necessary to provide the service and meet legal obligations. You may request deletion of your account data.'
        },
        rights: {
          title: 'Your Rights',
          items: [
            'Access, update, or delete your personal data',
            'Opt-out of non-essential communications',
            'Request data export'
          ]
        },
        contact: {
          title: 'Contact',
          content: 'For privacy requests, contact: nelsonmaranda2@gmail.com'
        }
      },
      termsOfService: {
        title: 'Terms of Service',
        lastUpdated: 'Last updated',
        acceptance: {
          title: 'Acceptance of Terms',
          content: 'By accessing or using Smart Matatu, you agree to these Terms and our Privacy Policy.'
        },
        useOfService: {
          title: 'Use of Service',
          items: [
            'Provide accurate information when creating an account',
            'Do not abuse reporting or rating mechanisms',
            'Comply with applicable laws when using the platform'
          ]
        },
        subscriptions: {
          title: 'Subscriptions & Payments',
          content: 'Paid plans provide additional features. Fees are billed in KES and are non-refundable once the billing period begins, except where required by law.'
        },
        content: {
          title: 'Content',
          content: 'You retain rights to content you submit. By submitting reports or ratings, you grant us a license to use the data to provide and improve the service.'
        },
        disclaimers: {
          title: 'Disclaimers',
          content: 'The service is provided "as is" without warranties. We do not guarantee accuracy of third‑party data or uninterrupted availability.'
        },
        liability: {
          title: 'Limitation of Liability',
          content: 'To the maximum extent permitted by law, Smart Matatu will not be liable for indirect or consequential damages.'
        },
        termination: {
          title: 'Termination',
          content: 'We may suspend or terminate access for violations of these Terms or harmful activity.'
        },
        contact: {
          title: 'Contact',
          content: 'Questions about these Terms: nelsonmaranda2@gmail.com'
        }
      }
    },
    sacco: {
      loading: 'Loading SACCO Dashboard...',
      title: 'SACCO Dashboard',
      subtitle: 'Manage your fleet, drivers, and routes',
      date7d: 'Last 7 days',
      date30d: 'Last 30 days',
      date90d: 'Last 90 days',
      refresh: 'Refresh',
      tabs: {
        overview: 'Overview',
        routes: 'Route Performance',
        drivers: 'Driver Management',
        feedback: 'Customer Feedback',
        fleet: 'Fleet Management',
      },
      metrics: {
        activeRoutes: 'Active Routes',
        activeDrivers: 'Active Drivers',
        totalRevenue7d: 'Total Revenue (7d)',
        avgRating: 'Avg Rating',
      },
      revenueTooltip: 'Estimated: unique devices reporting on each route in the last 7 days × route fare. This is a directional proxy, not audited revenue.',
      fleetStatus: 'Fleet Status',
      activeVehicles: 'Active Vehicles',
      ofTotal: 'of {total} total',
      maintenanceDue: 'Maintenance Due',
      vehiclesNeedService: 'vehicles need service',
      utilizationRate: 'Utilization Rate',
      averageFleetUsage: 'average fleet usage',
      routePerformance: 'Route Performance',
      table: {
        route: 'Route',
        efficiency: 'Efficiency',
        revenue7d: 'Revenue (7d)',
        passengers: 'Passengers',
        onTime: 'On-Time %',
        safety: 'Safety',
        trend: 'Trend',
      },
      driverPerformance: 'Driver Performance',
      driversTable: {
        driver: 'Driver',
        safetyScore: 'Safety Score',
        onTime: 'On-Time %',
        rating: 'Rating',
        incidents: 'Incidents',
        status: 'Status',
        routes: 'Routes',
      },
      customerFeedback: 'Customer Feedback',
      filters: {
        allStatus: 'All Status',
        pending: 'Pending',
        inProgress: 'In Progress',
        resolved: 'Resolved',
      },
      resolvedInDays: 'Resolved in {days} days',
      fleetOverview: 'Fleet Overview',
      totalVehicles: 'Total Vehicles',
      averageAge: 'Average Age',
      years: 'years',
      fleetUtilization: 'Fleet Utilization',
    },
    authority: {
      title: 'Transport Authority Dashboard',
      subtitle: 'Monitor compliance, incidents, and system metrics',
      loading: 'Loading Authority Dashboard...',
      last7Days: 'Last 7 days',
      last30Days: 'Last 30 days',
      last90Days: 'Last 90 days',
      refresh: 'Refresh',
      tabs: {
        compliance: 'Compliance',
        incidents: 'Incidents',
        metrics: 'System Metrics',
        reports: 'Reports & Export',
        audit: 'Audit Log',
        system: 'System Health',
      },
      kpiCards: {
        totalSaccos: 'Total SACCOs',
        compliantSaccos: 'Compliant SACCOs',
        activeIncidents: 'Active Incidents',
        systemUptime: 'System Uptime',
      },
      complianceTable: {
        title: 'SACCO Compliance Status',
        sacco: 'SACCO',
        licenseStatus: 'License Status',
        safetyScore: 'Safety Score',
        incidentCount: 'Incidents',
        lastInspection: 'Last Inspection',
        violations: 'Violations',
        status: 'Status',
      },
      complianceStatus: {
        compliant: 'Compliant',
        warning: 'Warning',
        nonCompliant: 'Non-Compliant',
        valid: 'Valid',
        expired: 'Expired',
        pending: 'Pending',
        unknown: 'Unknown',
      },
      incidentsTable: {
        title: 'Safety Incidents',
        route: 'Route',
        type: 'Type',
        severity: 'Severity',
        description: 'Description',
        location: 'Location',
        reportedAt: 'Reported At',
        assignedTo: 'Assigned To',
        resolution: 'Resolution',
        resolvedAt: 'Resolved At',
        allSeverity: 'All Severity',
        allStatus: 'All Status',
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        critical: 'Critical',
        reported: 'Reported',
        investigating: 'Investigating',
        resolved: 'Resolved',
        closed: 'Closed',
      },
      systemMetrics: {
        title: 'System Metrics',
        totalUsers: 'Total Users',
        activeReports: 'Active Reports',
        totalRoutes: 'Total Routes',
        systemUptime: 'System Uptime',
        dataQuality: 'Data Quality',
        averageResponseTime: 'Average Response Time',
      },
      performance: {
        title: 'Performance',
        systemUptime: 'System Uptime',
        avgResponseTime: 'Avg Response Time',
        dataQuality: 'Data Quality',
      },
      reports: {
        title: 'Data Export & Reports',
        complianceReport: {
          title: 'Compliance Report',
          description: 'SACCO compliance data',
        },
        safetyIncidents: {
          title: 'Safety Incidents',
          description: 'Incident reports and data',
        },
        systemAnalytics: {
          title: 'System Analytics',
          description: 'Performance metrics',
        },
        exportCsv: 'Export CSV',
        exportXls: 'Export XLS',
      },
      auditTable: {
        title: 'System Audit Logs',
        action: 'Action',
        user: 'User',
        timestamp: 'Timestamp',
        details: 'Details',
        ipAddress: 'IP Address',
        status: 'Status',
        success: 'Success',
        failed: 'Failed',
        warning: 'Warning',
      },
      systemHealth: {
        title: 'System Health',
        systemUptime: 'System Uptime',
        dataQuality: 'Data Quality',
        averageResponseTime: 'Average Response Time',
      },
      userActivity: {
        title: 'User Activity',
        totalUsers: 'Total Users',
        activeReports: 'Active Reports',
        totalRoutes: 'Total Routes',
      },
    },
    userManagement: {
      title: 'User Management',
      subtitle: 'Manage users, roles, and permissions',
      loading: 'Loading Users...',
      refresh: 'Refresh',
      addUser: 'Add User',
      search: 'Search',
      searchPlaceholder: 'Search users...',
      statusLabel: 'Status',
      role: 'Role',
      requestedRole: 'Requested Role',
      organization: 'Organization',
      created: 'Created',
      tabs: {
        users: 'Users',
        roles: 'Roles',
      },
      table: {
        displayName: 'Display Name',
        email: 'Email',
        role: 'Role',
        status: 'Status',
        actions: 'Actions',
      },
      actions: {
        editUser: 'Edit User',
        deleteUser: 'Delete User',
        viewProfile: 'View Profile',
        approve: 'Approve',
        reject: 'Reject',
        edit: 'Edit',
      },
      status: {
        active: 'Active',
        pending: 'Pending',
        suspended: 'Suspended',
        rejected: 'Rejected',
      },
      roles: {
        admin: 'Admin',
        moderator: 'Moderator',
        sacco: 'SACCO',
        authority: 'Authority',
        user: 'User',
      },
      deleteConfirm: {
        title: 'Confirm Delete User',
        message: 'Are you sure you want to delete this user? This action cannot be undone.',
        cancel: 'Cancel',
        delete: 'Delete',
      },
      messages: {
        userDeleted: 'User deleted successfully',
        userUpdated: 'User updated successfully',
        userCreated: 'User created successfully',
        userApproved: 'User approved successfully',
        userRejected: 'User rejected successfully',
        deleteError: 'Failed to delete user',
        updateError: 'Failed to update user',
        createError: 'Failed to create user',
        approveError: 'Failed to approve user',
        rejectError: 'Failed to reject user',
        fetchError: 'Failed to fetch users',
        loadError: 'Failed to load users',
      },
      rejectionReason: 'Rejection reason:',
      modals: {
        addUser: {
          title: 'Add User',
          fullName: 'Full name',
          email: 'Email',
          password: 'Temporary password',
          organization: 'Organization (optional)',
          cancel: 'Cancel',
          create: 'Create',
        },
        editUser: {
          title: 'Edit User',
          fullName: 'Full name',
          email: 'Email',
          organization: 'Organization (optional)',
          cancel: 'Cancel',
          save: 'Save',
        },
      },
      filters: {
        searchUsers: 'Search users...',
        filterByRole: 'Filter by role',
        filterByStatus: 'Filter by status',
        allRoles: 'All Roles',
        allStatus: 'All Status',
        applyFilters: 'Apply Filters',
        clearFilters: 'Clear Filters',
      },
      noUsers: 'No users found',
      noUsersMessage: 'Try adjusting your search or filter criteria.',
    },
    admin: {
      title: 'Admin Dashboard',
      subtitle: 'System administration and management',
      loading: 'Loading Admin Dashboard...',
      stats: {
        totalRoutes: 'Total Routes',
        activeRoutes: 'Active Routes',
        totalReports: 'Total Reports',
        safetyIssues: 'Safety Issues',
        totalUsers: 'Total Users',
        systemUptime: 'System Uptime',
      },
      seedRoutes: 'Seed Curated CBD Routes',
      seeding: 'Seeding…',
      runSeed: 'Run Seed',
      seedDescription: 'Seeds about 50 CBD routes in small chunks. Requires admin login.',
      tools: 'Tools',
      routeEditor: 'Route Editor',
      routeManagement: 'Route Management',
      addRoute: 'Add Route',
      addNewRoute: 'Add New Route',
      routeName: 'Route Name',
      routeNamePlaceholder: 'e.g., Route 42 - Thika Road',
      description: 'Description',
      descriptionPlaceholder: 'Route description',
      cancel: 'Cancel',
      route: 'Route',
      reliability: 'Reliability',
      safety: 'Safety',
      reports: 'Reports',
      statusLabel: 'Status',
      actions: 'Actions',
      activate: 'Activate',
      deactivate: 'Deactivate',
      status: {
        active: 'Active',
        inactive: 'Inactive',
        maintenance: 'Maintenance',
      },
      quickActions: {
        title: 'Quick Actions',
        addRoute: 'Add Route',
        manageUsers: 'Manage Users',
        viewReports: 'View Reports',
        systemSettings: 'System Settings',
      },
      recentActivity: {
        title: 'Recent Activity',
        noActivity: 'No recent activity',
      },
      pendingReports: 'Pending Reports',
      noPendingReports: 'No pending reports',
    },
    profile: {
      title: 'Profile',
      subtitle: 'Manage your account settings',
      loading: 'Loading Profile...',
      pleaseLogin: 'Please log in',
      loginRequired: 'You need to be logged in to view your profile.',
      goToLogin: 'Go to Login',
      role: 'Role',
      updateError: 'Failed to update profile. Please try again.',
      myTripReports: 'My Trip Reports',
      favoriteRoutes: 'Favorite Routes',
      ratedRoutes: 'Rated Routes',
      noFavoriteRoutes: 'No favorite routes yet',
      noRatedRoutes: 'No rated routes yet',
      exploreRoutes: 'Explore Routes',
    yourAnalytics: 'Your Analytics',
    totalReports: 'Total Reports',
    favorites: 'Favorites',
    accountInformation: 'Account Information',
    accountType: 'Account Type',
    memberSince: 'Member Since',
    noReportsYet: 'No reports submitted yet',
    submitFirstReport: 'Submit Your First Report',
    thisMonth: 'This Month',
    avgRating: 'Avg Rating',
    refresh: 'Refresh',
    debugUser: 'Debug User',
    debugReports: 'Debug Reports',
    fixReports: 'Fix Reports',
    fixScores: 'Fix Scores',
    fixRateLimits: 'Fix Rate Limits',
      tabs: {
        personal: 'Personal Information',
        security: 'Security',
        reports: 'My Reports',
        favorites: 'Favorites',
        analytics: 'Analytics',
      },
      personalInfo: {
        displayName: 'Display Name',
        email: 'Email Address',
        role: 'Role',
        organization: 'Organization',
        uploadPhoto: 'Upload Photo',
        editProfile: 'Edit Profile',
        uploading: 'Uploading...',
        saveChanges: 'Save Changes',
        orEnterImageUrl: 'Or enter image URL',
        set: 'Set',
        deletePhoto: 'Delete Photo',
        admin: 'Admin',
        rated: 'Rated',
        youRatedThisRoute: 'You rated this route',
        view: 'View',
        mostReportedRoute: 'Most Reported Route',
      },
      security: {
        changePassword: 'Change Password',
        oldPassword: 'Current Password',
        newPassword: 'New Password',
        confirmNewPassword: 'Confirm New Password',
        updatePassword: 'Update Password',
      },
      messages: {
        profileUpdated: 'Profile updated successfully',
        profileError: 'Failed to update profile',
        passwordUpdated: 'Password updated successfully',
        passwordError: 'Failed to update password',
        passwordMismatch: 'Passwords do not match',
        passwordTooShort: 'Password must be at least 8 characters',
        currentPasswordIncorrect: 'Current password is incorrect',
        newPasswordSameAsOld: 'New password must be different from current password',
        uploadingImage: 'Uploading image...',
        imageUploadError: 'Failed to upload image',
        avatarUpdateError: 'Failed to update profile with new avatar',
      },
    },
    subscription: {
      title: 'Choose Your Plan',
      subtitle: 'Select the perfect plan for your transportation needs. Upgrade anytime to unlock premium features.',
      currentPlan: 'Current Plan',
      status: 'Status',
      expires: 'Expires',
      features: 'Active Features',
      popular: 'Popular',
      free: 'Free',
      month: 'month',
      current: 'Current Plan',
      processing: 'Processing...',
      getStarted: 'Get Started',
      upgrade: 'Upgrade Now',
      featureComparison: 'Feature Comparison',
      basicReports: 'Basic Reports',
      unlimitedReports: 'Unlimited Reports',
      advancedAnalytics: 'Advanced Analytics',
      prioritySupport: 'Priority Support',
      apiAccess: 'API Access',
      faq: 'Frequently Asked Questions',
      faq1: {
        question: 'Can I change my plan anytime?',
        answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.'
      },
      faq2: {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards, M-Pesa, Airtel Money, and bank transfers.'
      },
      faq3: {
        question: 'Is there a free trial?',
        answer: 'Yes, all paid plans come with a 7-day free trial. No credit card required.'
      },
      featureNames: {
        advancedAnalytics: 'Advanced Analytics',
        prioritySupport: 'Priority Support',
        customBranding: 'Custom Branding',
        apiAccess: 'API Access',
        unlimitedReports: 'Unlimited Reports'
      },
      adminAccess: 'Admin Access',
      planTypes: {
        free: 'Free',
        premium: 'Premium',
        sacco: 'SACCO',
        enterprise: 'Enterprise'
      },
      statusTypes: {
        active: 'Active',
        inactive: 'Inactive',
        expired: 'Expired',
        pending: 'Pending'
      },
      plans: {
        free: {
          name: 'Free',
          features: {
            basicInfo: 'Basic route information',
            reports: 'Submit 5 reports per month',
            support: 'Community support'
          }
        },
        premium: {
          name: 'Premium',
          features: {
            unlimitedReports: 'Unlimited reports',
            advancedAnalytics: 'Advanced analytics',
            prioritySupport: 'Priority support',
            realTimeNotifications: 'Real-time notifications'
          }
        },
        sacco: {
          name: 'SACCO',
          features: {
            allPremium: 'All Premium features',
            revenueAnalytics: 'Revenue analytics',
            customBranding: 'Custom branding',
            apiAccess: 'API access',
            dedicatedSupport: 'Dedicated support'
          }
        },
        enterprise: {
          name: 'Enterprise',
          features: {
            allSacco: 'All SACCO features',
            whiteLabel: 'White-label solution',
            customIntegrations: 'Custom integrations',
            support247: '24/7 support',
            slaGuarantee: 'SLA guarantee'
          }
        }
      },
      daysRemaining: 'Days Remaining',
      totalSubscription: 'Total Subscription',
      yearly: 'Yearly',
      selectPlan: 'Select Plan',
      days: 'days',
    },
    payment: {
      title: 'Complete Your Payment',
      subtitle: 'Secure payment for your {plan} subscription',
      orderSummary: 'Order Summary',
      planLabel: '{plan} Plan',
      monthly: 'Monthly subscription',
      free: 'Free',
      perMonth: 'per month',
      planFeatures: 'Plan Features:',
      paymentMethod: 'Payment Method',
      card: 'Credit/Debit Card',
      mpesa: 'M-Pesa',
      airtel: 'Airtel Money',
      backToPlans: 'Back to Plans',
      processingPayment: 'Processing Payment...',
      activateFreePlan: 'Activate Free Plan',
      payAmount: 'Pay KES {amount}',
      secureNote: 'Your payment information is secure and encrypted',
      subscriptionWord: 'subscription',
      errors: {
        invalidData: 'Invalid payment data. Please select a plan again.',
        createFailed: 'Failed to create payment. Please try again.',
        paymentFailed: 'Payment failed. Please try again.',
        confirmFailed: 'Payment confirmation failed. Please try again.',
        header: 'Payment Error'
      }
    },
    analyticsDashboard: {
      title: 'Analytics Dashboard',
      subtitle: 'Monitor system performance and user engagement',
      last7Days: 'Last 7 Days',
      last30Days: 'Last 30 Days',
      error: 'Error Loading Analytics',
      totalEvents: 'Total Events',
      activeUsers: 'Active Users',
      avgEngagement: 'Avg Engagement',
      performanceScore: 'Performance Score',
      eventTypes: 'Event Types',
      performanceMetrics: 'Performance Metrics',
      metric: 'Metric',
      value: 'Value',
      endpoint: 'Endpoint',
      timestamp: 'Timestamp',
      noMetrics: 'No Performance Metrics',
      noMetricsDesc: 'Performance metrics will appear here as the system collects data.',
      // User Metrics
      userMetrics: {
        title: 'User Metrics',
        totalUsers: 'Total Users',
        activeUsers: 'Active Users',
        newUsers: 'New Users',
        userRoles: 'User Roles'
      },
      // Route Metrics
      routeMetrics: {
        title: 'Route Metrics',
        totalRoutes: 'Total Routes',
        activeRoutes: 'Active Routes',
        topOperators: 'Top Operators'
      },
      // Report Metrics
      reportMetrics: {
        title: 'Report Metrics',
        totalReports: 'Total Reports',
        recentReports: 'Recent Reports',
        reportsByType: 'Reports by Type',
        reportsBySeverity: 'Reports by Severity',
        reportsByStatus: 'Reports by Status'
      },
      // Rating Metrics
      ratingMetrics: {
        title: 'Rating Metrics',
        totalRatings: 'Total Ratings',
        averageRating: 'Average Rating',
        topRatedRoutes: 'Top Rated Routes',
        routeName: 'Route Name',
        routeNumber: 'Route Number',
        operator: 'Operator',
        avgRating: 'Avg Rating'
      },
      // Subscription Metrics
      subscriptionMetrics: {
        title: 'Subscription Metrics',
        totalSubscriptions: 'Total Subscriptions',
        activeSubscriptions: 'Active Subscriptions',
        subscriptionsByPlan: 'Subscriptions by Plan'
      },
      // Payment Metrics
      paymentMetrics: {
        title: 'Payment Metrics',
        totalPayments: 'Total Payments',
        successfulPayments: 'Successful Payments',
        successRate: 'Success Rate',
        totalRevenue: 'Total Revenue',
        paymentsByMethod: 'Payments by Method'
      },
      // Traffic Metrics
      trafficMetrics: {
        title: 'Traffic Metrics',
        totalRoutesWithTraffic: 'Total Routes with Traffic',
        averageCongestion: 'Average Congestion',
        congestionIndex: 'Congestion Index',
        trafficFactor: 'Traffic Factor'
      },
      // Geographic Analytics
      geographicAnalytics: {
        title: 'Geographic Analytics',
        reportHotspots: 'Report Hotspots'
      },
      // Time Analytics
      timeAnalytics: {
        title: 'Time Analytics',
        reportsByHour: 'Reports by Hour'
      },
      // Metric Type Names
      metricTypes: {
        apiResponseTime: 'API Response Time',
        pageLoadTime: 'Page Load Time',
        errorRate: 'Error Rate',
        userEngagement: 'User Engagement'
      },
      // Report Types
      reportTypes: {
        crowding: 'Crowding',
        overcrowding: 'Overcrowding',
        delay: 'Delay',
        safety: 'Safety',
        breakdown: 'Breakdown',
        other: 'Other'
      },
      // Severity Levels
      severityLevels: {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        critical: 'Critical'
      },
      // User Roles
      userRoles: {
        admin: 'Admin',
        user: 'User',
        moderator: 'Moderator',
        sacco: 'SACCO',
        authority: 'Authority'
      },
      // Subscription Plans
      subscriptionPlans: {
        free: 'Free',
        premium: 'Premium',
        sacco: 'SACCO',
        enterprise: 'Enterprise'
      }
    },
    userAnalytics: {
      title: 'Your Personal Analytics',
      subtitle: 'Insights and recommendations tailored for you',
      last7Days: 'Last 7 Days',
      last30Days: 'Last 30 Days',
      last90Days: 'Last 90 Days',
      refresh: 'Refresh',
      error: 'Failed to load user analytics',
      retry: 'Retry',
      loading: 'Loading Your Personal Analytics...',
      // Personal Stats
      personalStats: {
        totalReports: 'Total Reports',
        totalRatings: 'Total Ratings',
        favoriteRoutes: 'Favorite Routes',
        activityScore: 'Activity Score',
        reportsThisMonth: 'this month',
        avgRating: 'Avg',
        savedRoutes: 'Saved routes',
        veryActiveUser: 'Very active user'
      },
      // Route Insights
      routeInsights: {
        title: 'Your Route Insights',
        mostReportedRoute: 'Most Reported Route',
        bestRatedRoute: 'Best Rated Route',
        reports: 'reports',
        last: 'last',
        stars: 'stars',
        ratings: 'ratings'
      },
      // Recent Activity
      recentActivity: {
        title: 'Recent Activity',
        reportedDelay: 'Reported delay',
        ratedStars: 'Rated 5 stars',
        reportedSafetyIssue: 'Reported safety issue'
      },
      // Safety Insights
      safetyInsights: {
        title: 'Safety Insights',
        safetyReports: 'Safety Reports',
        delayReports: 'Delay Reports',
        resolvedReports: 'Resolved Reports',
        averageResponseTime: 'Average Response Time'
      },
      // Recommendations
      recommendations: {
        title: 'Recommended Routes',
        suggestedRoutes: 'Suggested Routes',
        highlyRatedByUsers: 'Highly rated by users',
        reliableAndPunctual: 'Reliable and punctual',
        safetyTips: 'Safety Tips',
        avoidPeakHours: 'Avoid peak hours (7-9 AM, 5-7 PM) for better safety',
        bestSafetyRecord: 'Route 15 has the best safety record in your area',
        reportImmediately: 'Report any safety concerns immediately for faster response'
      },
      // Peak Hours
      peakHours: {
        title: 'Peak Hours & Recommendations',
        highTraffic: 'High traffic, allow extra time',
        peakHours: 'Peak hours, consider alternative routes'
      }
    },
    saccoDashboard: {
      title: 'SACCO Dashboard',
      dashboardTitle: 'Dashboard',
      subtitle: 'SACCO Performance Analytics & Insights',
      dataSource: 'Data Source: Real-time database analytics',
      last7Days: 'Last 7 Days',
      last30Days: 'Last 30 Days',
      last90Days: 'Last 90 Days',
      refresh: 'Refresh',
      loadingAnalytics: 'Loading SACCO Analytics...',
      totalRoutes: 'Total Routes',
      avgRating: 'Avg Rating',
      totalReports: 'Total Reports',
      marketRank: 'Market Rank',
      active: 'active',
      outOf: 'out of',
      perDay: 'per day',
      ofSaccos: 'SACCOs',
      reportsByType: 'Reports by Type',
      reportsBySeverity: 'Reports by Severity',
      // Route Performance Analysis
      routePerformanceAnalysis: 'Route Performance Analysis',
      route: 'Route',
      overallRating: 'Overall Rating',
      safety: 'Safety',
      punctuality: 'Punctuality',
      comfort: 'Comfort',
      totalRatings: 'Total Ratings',
      // Revenue Analytics
      totalRevenue: 'Total Revenue',
      avgDailyRevenue: 'Avg Daily Revenue',
      revenueDays: 'Revenue Days',
      dailyRevenueTrends: 'Daily Revenue Trends',
      // Market Position
      yourPerformance: 'Your Performance',
      marketRanking: 'Market Ranking:',
      marketAverage: 'Market Average:',
      top5Saccos: 'Top 5 SACCOs',
      // Geographic Insights
      incidentHotspots: 'Incident Hotspots',
      peakHoursAnalysis: 'Peak Hours Analysis',
      error: 'Failed to load SACCO analytics',
      retry: 'Retry',
      loading: 'Loading SACCO Analytics...',
      usingSampleData: 'Using sample data - real data unavailable',
      // Overview Tab
      overview: {
        title: 'Overview',
        totalRoutes: 'Total Routes',
        active: 'active',
        avgRating: 'Avg Rating',
        outOf: 'out of 5.0',
        totalReports: 'Total Reports',
        perDay: 'per day',
        marketRank: 'Market Rank',
        ofSaccos: 'of 6 SACCOs',
        reportsByType: 'Reports by Type',
        reportsBySeverity: 'Reports by Severity'
      },
      // Route Performance Tab
      routePerformance: {
        title: 'Route Performance',
        topRatedRoutes: 'Top Rated Routes',
        routeName: 'Route Name',
        routeNumber: 'Route Number',
        avgRating: 'Avg Rating',
        totalRatings: 'Total Ratings',
        avgReliability: 'Avg Reliability',
        avgSafety: 'Avg Safety',
        avgPunctuality: 'Avg Punctuality',
        avgComfort: 'Avg Comfort'
      },
      // Incident Reports Tab
      incidentReports: {
        title: 'Incident Reports',
        recentReports: 'Recent Reports',
        reportType: 'Report Type',
        severity: 'Severity',
        location: 'Location',
        reportedAt: 'Reported At',
        status: 'Status'
      },
      // Revenue Analytics Tab
      revenueAnalytics: {
        title: 'Revenue Analytics',
        dailyRevenue: 'Daily Revenue',
        totalRevenue: 'Total Revenue',
        avgDailyRevenue: 'Avg Daily Revenue',
        revenueTrend: 'Revenue Trend'
      },
      // Market Position Tab
      marketPosition: {
        title: 'Market Position',
        competitiveAnalysis: 'Competitive Analysis',
        saccoRanking: 'SACCO Ranking',
        totalSaccos: 'Total SACCOs',
        performanceVsMarket: 'Performance vs Market',
        saccoReports: 'SACCO Reports',
        marketAvg: 'Market Avg'
      },
      // Geographic Insights Tab
      geographicInsights: {
        title: 'Geographic Insights',
        hotspots: 'Hotspots',
        totalLocations: 'Total Locations',
        latitude: 'Latitude',
        longitude: 'Longitude',
        incidentCount: 'Incident Count',
        types: 'Types'
      }
    },
    authorityDashboard: {
      title: 'Authority Planning Dashboard',
      subtitle: 'Strategic Planning & Regulatory Insights',
      last7Days: 'Last 7 Days',
      last30Days: 'Last 30 Days',
      last90Days: 'Last 90 Days',
      refresh: 'Refresh',
      loadingInsights: 'Loading Authority Planning Insights...',
      critical: 'critical',
      avgRisk: 'Avg Risk:',
      highRiskAreas: 'High risk areas',
      systemEfficiency: 'System efficiency',
      focusAreas: 'Focus Areas',
      recommendedActions: 'Recommended Actions',
      avgDailyReports: 'Avg Daily Reports',
      trendDirection: 'Trend Direction',
      totalReportsLabel: 'Total Reports',
      criticalSaccos: 'Critical SACCOs',
      avgReportsPerSacco: 'Avg Reports per SACCO',
      strategicFocusAreas: 'Strategic Focus Areas',
      incidents: 'incidents',
      reports: 'reports',
      priorityScoreLabel: 'Priority Score:',
      totalReportsCount: 'Total Reports:',
      criticalReportsLabel: 'Critical Reports:',
      error: 'Failed to load authority insights',
      retry: 'Retry',
      loading: 'Loading Authority Insights...',
      // Strategic Overview Tab
      strategicOverview: {
        title: 'Strategic Overview',
        keyPerformanceIndicators: 'Key Performance Indicators',
        totalSaccos: 'Total SACCOs',
        totalRoutes: 'Total Routes',
        totalReports: 'Total Reports',
        criticalIncidents: 'Critical Incidents',
        focusAreas: 'Focus Areas',
        recommendedActions: 'Recommended Actions',
        increaseMonitoring: 'Increase monitoring in high-risk geographic zones',
        implementInterventions: 'Implement targeted interventions for poor-performing SACCOs',
        focusResources: 'Focus resources on peak incident hours',
        developProtocols: 'Develop specific safety protocols for high-risk routes',
        establishWarning: 'Establish early warning systems for critical incidents'
      },
      // SACCO Performance Tab
      saccoPerformance: {
        title: 'SACCO Performance Analysis',
        topPerformers: 'Top Performers',
        poorPerformers: 'Poor Performers',
        averageReportsPerSacco: 'Average Reports per SACCO',
        criticalSaccos: 'Critical SACCOs',
        saccoName: 'SACCO Name',
        totalReports: 'Total Reports',
        criticalReports: 'Critical Reports',
        avgSeverity: 'Avg Severity',
        lastReport: 'Last Report'
      },
      // Route Risk Analysis Tab
      routeRiskAnalysis: {
        title: 'Route Risk Analysis',
        highRiskRoutes: 'High Risk Routes',
        totalRoutesAnalyzed: 'Total Routes Analyzed',
        averageRiskScore: 'Average Risk Score',
        criticalRoutes: 'Critical Routes',
        routeName: 'Route Name',
        routeNumber: 'Route Number',
        operator: 'Operator',
        totalIncidents: 'Total Incidents',
        criticalIncidents: 'Critical Incidents',
        safetyIncidents: 'Safety Incidents',
        accidentIncidents: 'Accident Incidents',
        riskScore: 'Risk Score',
        lastIncident: 'Last Incident'
      },
      // Geographic Insights Tab
      geographicInsights: {
        title: 'Geographic Risk Mapping',
        highRiskZones: 'High Risk Zones',
        totalRiskZones: 'Total Risk Zones',
        averageRiskLevel: 'Average Risk Level',
        latitude: 'Latitude',
        longitude: 'Longitude',
        totalIncidents: 'Total Incidents',
        criticalIncidents: 'Critical Incidents',
        incidentTypes: 'Incident Types',
        avgSeverity: 'Avg Severity',
        riskLevel: 'Risk Level'
      },
      // Temporal Patterns Tab
      temporalPatterns: {
        title: 'Temporal Pattern Analysis',
        peakHours: 'Peak Hours',
        peakDays: 'Peak Days',
        averageIncidentsPerHour: 'Average Incidents per Hour',
        peakHoursIdentified: 'Peak Hours Identified',
        hour: 'Hour',
        dayOfWeek: 'Day of Week',
        incidentCount: 'Incident Count',
        criticalCount: 'Critical Count',
        avgSeverity: 'Avg Severity'
      },
      // Compliance Trends Tab
      complianceTrends: {
        title: 'SACCO Compliance Trends',
        dailyTrends: 'Daily Trends',
        averageDailyReports: 'Average Daily Reports',
        trendDirection: 'Trend Direction',
        increasing: 'Increasing',
        decreasing: 'Decreasing',
        stable: 'Stable',
        day: 'Day',
        totalReports: 'Total Reports',
        totalCritical: 'Total Critical',
        saccoCount: 'SACCO Count',
        avgReportsPerSacco: 'Avg Reports per SACCO'
      },
      // Risk Indicators Tab
      riskIndicators: {
        title: 'Predictive Risk Indicators',
        topRisks: 'Top Risks',
        criticalRiskTypes: 'Critical Risk Types',
        averageRiskLevel: 'Average Risk Level',
        reportType: 'Report Type',
        totalCount: 'Total Count',
        criticalCount: 'Critical Count',
        avgSeverity: 'Avg Severity',
        trend: 'Trend'
      },
      // System Health Tab
      systemHealth: {
        title: 'System Health & Performance',
        totalReports: 'Total Reports',
        averageResponseTime: 'Average Response Time',
        resolutionRate: 'Resolution Rate',
        dataQuality: 'Data Quality'
      },
      // Resource Recommendations Tab
      resourceRecommendations: {
        title: 'Resource Allocation Recommendations',
        prioritySaccos: 'Priority SACCOs',
        totalResourcesNeeded: 'Total Resources Needed',
        highPriorityCount: 'High Priority Count',
        highPriorityCases: 'High Priority Cases',
        saccoName: 'SACCO Name',
        totalReports: 'Total Reports',
        criticalReports: 'Critical Reports',
        reportTypes: 'Report Types',
        priorityScore: 'Priority Score'
      }
    },
  },
  sw: {
    common: {
      loading: 'Inapakia...',
      error: 'Hitilafu',
      success: 'Imefanikiwa',
      cancel: 'Ghairi',
      save: 'Hifadhi',
      delete: 'Futa',
      edit: 'Hariri',
      view: 'Ona',
      close: 'Funga',
      back: 'Rudi',
      next: 'Ifuatayo',
      previous: 'Iliyotangulia',
      submit: 'Wasilisha',
      search: 'Tafuta',
      filter: 'Chuja',
      sort: 'Panga',
      refresh: 'Sasisha',
    },
    navigation: {
      home: 'Nyumbani',
      map: 'Ramani',
      report: 'Ripoti',
      login: 'Ingia',
      signup: 'Jisajili',
      admin: 'Msimamizi',
      profile: 'Wasifu',
      settings: 'Mipangilio',
      dashboard: 'Dashibodi',
      analytics: 'Uchambuzi',
      subscription: 'Mpango wa Malipo',
      saccoDashboard: 'Dashibodi ya SACCO',
      authorityDashboard: 'Dashibodi ya Mamlaka',
      userManagement: 'Usimamizi wa Watumiaji',
      adminPanel: 'Paneli ya Msimamizi',
      quickActions: 'Vitendo vya Haraka',
      favorites: 'Vipendwa',
      reports: 'Ripoti',
      safety: 'Usalama',
      predictions: 'Utabiri',
      saccoManagement: 'Usimamizi wa SACCO',
      authorityTools: 'Vifaa vya Mamlaka',
      fleetManagement: 'Usimamizi wa Gari',
      compliance: 'Utii',
      adminAnalytics: 'Uchambuzi wa Msimamizi',
      saccoAnalytics: 'Uchambuzi wa SACCO',
      authorityAnalytics: 'Uchambuzi wa Mamlaka',
      moderatorAnalytics: 'Uchambuzi wa Msimamizi',
      myAnalytics: 'Uchambuzi Wangu',
    },
    auth: {
      login: 'Ingia',
      signup: 'Jisajili',
      logout: 'Ondoka',
      email: 'Barua Pepe',
      password: 'Nenosiri',
      confirmPassword: 'Thibitisha Nenosiri',
      displayName: 'Jina la Maonyesho',
      rememberMe: 'Nikumbuke',
      forgotPassword: 'Umesahau Nenosiri?',
      createAccount: 'Unda Akaunti',
      alreadyHaveAccount: 'Una akaunti?',
      dontHaveAccount: 'Huna akaunti?',
      loginTitle: 'Karibu Tena',
      loginSubtitle: 'Ingia kwenye akaunti yako ili kuendelea',
      signupTitle: 'Unda Akaunti',
      signupSubtitle: 'Jiunge na Smart Matatu na uanze safari yako',
      emailPlaceholder: 'Ingiza barua pepe yako',
      passwordPlaceholder: 'Ingiza nenosiri lako',
      displayNamePlaceholder: 'Ingiza jina lako la maonyesho',
      confirmPasswordPlaceholder: 'Thibitisha nenosiri lako',
      organizationPlaceholder: 'Ingiza shirika lako (si lazima)',
      selectRole: 'Chagua jukumu lako',
      signIn: 'Ingia',
      signUp: 'Jisajili',
      creatingAccount: 'Inaunda akaunti...',
      signingIn: 'Inaingia...',
      loginSuccess: 'Umeingia kwa mafanikio!',
      signupSuccess: 'Akaunti imeundwa kwa mafanikio!',
      loginError: 'Kuingia kumeshindwa. Tafadhali angalia maelezo yako.',
      signupError: 'Kujisajili kumeshindwa. Tafadhali jaribu tena.',
      emailRequired: 'Barua pepe inahitajika',
      passwordRequired: 'Nenosiri linahitajika',
      displayNameRequired: 'Jina la maonyesho linahitajika',
      passwordTooShort: 'Nenosiri lazima liwe na angalau herufi 8',
      emailInvalid: 'Tafadhali ingiza barua pepe halali',
      passwordsDoNotMatch: 'Nenosiri halifanani',
      resetPasswordTitle: 'Weka upya nenosiri',
      resetPasswordSubtitle: 'Ingiza nenosiri jipya hapa chini.',
      forgotPasswordTitle: 'Umesahau nenosiri',
      forgotPasswordSubtitle: 'Ingiza barua pepe ili upokee kiungo cha kuweka upya.',
      sendResetLink: 'Tuma kiungo cha kuweka upya',
      resetting: 'Inarekebisha…',
      resetPassword: 'Weka upya nenosiri',
      verificationSent: 'Barua ya uthibitisho imetumwa. Tafadhali angalia kikasha chako.',
      verificationResent: 'Barua ya uthibitisho imetumwa. Tafadhali angalia kikasha chako.',
      backToLogin: 'Rudi kwenye kuingia',
    },
    map: {
      title: 'Njia za Matatu Nairobi',
      loading: 'Inapakia njia...',
      noRoutes: 'Hakuna njia zinazopatikana',
      selectRoute: 'Chagua njia',
      viewDetails: 'Ona Maelezo',
      reportTrip: 'Ripoti Safari',
      filter: 'Chuja',
      sort: 'Panga',
      toggleFilters: 'Washa/Zima paneli ya vichujio',
      toggleListView: 'Washa/Zima mwonekano wa orodha',
      quickFilters: 'Vichujio vya Haraka',
      highReliability: 'Kuegemea Juu (nyota 4+)',
      safeRoutes: 'Njia Salama (nyota 4+)',
      lowFare: 'Kodi ya Chini (chini ya KES 50)',
      ofRoutes: '{current} kati ya {total} njia',
      availableRoutes: 'Njia Zilizopo',
      filters: 'Vichujio',
      routeFilters: 'Vichujio vya njia',
      fare: 'Kodi',
      hours: 'Saa',
      stops: 'Vituo',
      routeNo: 'Nambari ya Njia',
      viewOnMap: 'Ona kwenye Ramani',
      rate: 'Kadiria',
      tryAgain: 'Jaribu Tena',
      genericError: 'Hitilafu imetokea',
      mapAria: 'Ramani shirikishi inayoonyesha njia za matatu Nairobi',
    },
    report: {
      title: 'Ripoti Safari Yako',
      route: 'Njia',
      selectRoute: 'Chagua njia',
      saccoOptional: 'SACCO ya Matatu (hiari)',
      selectSacco: 'Chagua SACCO',
      otherSacco: 'Nyingine',
      specifyOtherSacco: 'Taja SACCO Nyingine',
      otherSaccoPlaceholder: 'Ingiza jina la SACCO...',
      otherSaccoRequired: 'Tafadhali taja jina la SACCO',
      direction: 'Mwelekeo',
      fromCBD: 'Kutoka CBD',
      toCBD: 'Kwenda CBD',
      alongRoute: 'Kalongoni ya njia hii',
      fare: 'Kodi (KSh)',
      farePlaceholder: 'mf., 80',
      reportType: 'Aina ya Ripoti',
      delay: 'Kuchelewa',
      overcrowding: 'Msongamano Mkubwa',
      breakdown: 'Kuvunjika',
      safety: 'Suala la Usalama',
      other: 'Nyingine',
      severity: 'Ukali',
      low: 'Chini',
      medium: 'Wastani',
      high: 'Juu',
      critical: 'Hatari',
      anonymous: 'Wasilisha bila kujitambulisha',
      description: 'Maelezo',
      descriptionPlaceholder: 'Eleza tatizo...',
      loading: 'Inapakia fomu ya ripoti...',
      submit: 'Wasilisha Ripoti',
      success: 'Ripoti imewasilishwa kwa mafanikio',
    },
    analytics: {
      loading: 'Inapakia Uchambuzi wa Juu...',
      errorTitle: 'Hitilafu Wakati wa Kupakia Uchambuzi',
      retry: 'Jaribu Tena',
      headerTitle: 'Uchambuzi wa Juu',
      headerSubtitle: 'Maarifa kamili na utabiri wa kuboresha njia',
      // Swahili uses keys defined in types: recommendationsTitle, yourPreferences, recommendedRoutes
      tabs: {
        efficiency: 'Ufanisi wa Njia',
        predictions: 'Utabiri wa Safari',
        trends: 'Uchambuzi wa Mitindo',
        recommendations: 'Mapendekezo',
      },
      efficiencyTitle: 'Alama za Ufanisi wa Njia',
      selectRoute: 'Chagua njia',
      refresh: 'Sasisha',
      recommendationsTitle: 'Mapendekezo ya Kibinafsi',
      yourPreferences: 'Upendeleo Wako',
      prefEfficiency: 'Ufanisi',
      prefSafety: 'Usalama',
      prefCost: 'Gharama',
      prefConvenience: 'Urahisi',
      goodPerformance: 'Utendaji mzuri',
      recommendedRoutes: 'Njia Zilizopendekezwa',
      travelPredictionsTitle: 'Utabiri wa Muda wa Safari',
      predict: 'Tabiri',
      fromStop: 'Kituo cha Mwanzo',
      toStop: 'Kituo cha Mwisho',
      timeSlot: 'Muda',
      minutesShort: 'dak',
      confidence: 'uhakika',
      optimistic: 'Ya Kutosha',
      realistic: 'Halisi',
      pessimistic: 'Ya Tahadhari',
      factors: 'Vigezo',
      alternativeRoutesTitle: 'Njia Mbadala',
      find: 'Tafuta',
      reasons: 'Sababu',
      trendAnalysisTitle: 'Uchambuzi wa Mitindo',
      periodDaily: 'Kila siku',
      periodWeekly: 'Kila wiki',
      periodMonthly: 'Kila mwezi',
      update: 'Sasisha',
      routeTrends: 'Mitindo ya Njia',
      current: 'Sasa',
      previous: 'Iliyopita',
      insights: 'Maarifa',
      demandForecastsTitle: 'Utabiri wa Mahitaji',
    },
    home: {
      title: 'Karibu Smart Matatu',
      subtitle: 'Pata njia za matatu za kuegemea na salama Nairobi kwa masasisho ya wakati halisi, maarifa ya jamii, na taarifa za usalama.',
      viewMap: 'Ona Ramani',
      reportTrip: 'Ripoti Safari',
      systemOnline: 'Mfumo Uko Mtandaoni - Huduma zote zinatumika',
      systemOffline: 'Mfumo Haupo Mtandaoni - Utendaji mdogo',
      checkingStatus: 'Inachunguza hali ya mfumo...',
      activeRoutes: 'Njia Zinazotumika',
      reportsToday: 'Ripoti za Leo',
      safetyRating: 'Kiwango cha Usalama',
      activeUsers: 'Watumiaji Waliohai',
      howItWorks: 'Smart Matatu Inafanyaje Kazi',
      howItWorksDesc: 'Jukwaa letu linaunganisha maarifa ya jamii na data ya wakati halisi ili kufanya mfumo wa usafiri wa Nairobi uwe wa kuegemea na salama zaidi.',
      realTimeTracking: 'Kufuatilia Njia kwa Wakati Halisi',
      realTimeTrackingDesc: 'Pata masasisho ya moja kwa moja kuhusu maeneo ya matatu, ucheleweshaji, na upatikanaji.',
      safetyReports: 'Ripoti za Usalama',
      safetyReportsDesc: 'Ripoti na ona matukio ya usalama ili kusaidia kuhakikisha kila mtu ana usalama.',
      reliabilityScores: 'Alama za Kuegemea',
      reliabilityScoresDesc: 'Ona ni njia zipi za kuegemea zaidi kulingana na data ya jamii.',
      communityInsights: 'Maarifa ya Jamii',
      communityInsightsDesc: 'Shiriki uzoefu na usaidie wengine kufanya maamuzi ya usafiri yenye misingi.',
      readyToStart: 'Uko Tayari Kuanza?',
      readyToStartDesc: 'Jiunge na maelfu ya wasafiri wa Nairobi ambao tayari wanatumia Smart Matatu kufanya safari zao za kila siku ziwe salama na za kuegemea zaidi.',
      signUpNow: 'Jisajili Sasa',
      exploreMap: 'Chunguza Ramani',
    },
    dashboard: {
      title: 'Dashibodi',
      welcome: 'Karibu tena',
      smartRouteInsights: 'Maarifa ya Njia za Akili',
      weatherConditions: 'Hali ya Hewa',
      favoriteRoutes: 'Njia za Kupendeza',
      recentReports: 'Ripoti za Hivi Karibuni',
      viewAllReports: 'Ona Ripoti Zote',
      noReports: 'Hakuna ripoti za hivi karibuni',
      noFavorites: 'Hakuna njia za kupendeza bado',
      addFavorites: 'Ongeza njia kadhaa kwenye vipendeleo vyako ili uwaone hapa',
      loading: 'Inapakia dashibodi...',
      loadingYourDashboard: 'Inapakia dashibodi yako ya kisasa...',
      errorTitle: 'Hitilafu ya Dashibodi',
      tryAgain: 'Jaribu Tena',
      headerSubtitle: 'Hapa kuna maarifa yako ya kibinafsi ya matatu kwa leo',
      currentWeather: 'Hali ya Hewa ya Sasa',
      humidityLabel: 'unyevu',
      windSpeedLabel: 'km/h',
      activeRoutesTitle: 'Njia Zinazotumika',
      routesMonitored: 'Njia zinazofuatiliwa',
      avgFareTitle: 'Kodi ya Wastani',
      currentAverage: 'Wastani wa sasa',
      overallSafety: 'Usalama kwa ujumla',
      viewAllRoutesBtn: 'Ona Njia Zote',
      aiRecommendations: 'Mapendekezo yanayoendeshwa na AI kwa safari yako ya kila siku',
      noInsights: 'Hakuna maarifa ya njia yaliyopo',
      exploreRoutes: 'Chunguza Njia',
      routeIdLabel: 'Kitambulisho cha Njia',
      crowdSuffix: 'msongamano',
      crowdLow: 'Msongamano kidogo',
      crowdMedium: 'Msongamano wastani',
      crowdHigh: 'Msongamano kubwa',
      predictedFareLabel: 'Utabiri wa kodi',
      safetyScoreLabel: 'Alama ya usalama',
      travelTimeLabel: 'Muda wa kusafiri',
      bestTimeLabel: 'Muda bora',
      routeLabel: 'Njia',
      viewLabel: 'Ona',
      submitReportBtn: 'Wasilisha Ripoti',
      refresh: 'Sasisha',
      quickActions: 'Vitendo vya Haraka',
      quickViewMap: 'View Map',
      quickSubmitReport: 'Tuma Ripoti',
      quickViewProfile: 'View Profile',
      totalRoutes: 'Jumla ya Njia',
      activeReports: 'Ripoti Zinazotumika',
      averageFare: 'Kodi ya Wastani',
      safetyRating: 'Kiwango cha Usalama',
      temperature: 'Joto',
      humidity: 'Unyevu',
      windSpeed: 'Kasi ya Upepo',
      routeName: 'Jina la Njia',
      farePrediction: 'Utabiri wa Kodi',
      safetyScore: 'Alama ya Usalama',
      crowdDensity: 'Msongamano wa Watu',
      travelTime: 'Muda wa Kusafiri',
      recommendedTime: 'Muda wa Kupendekezwa',
      alternativeRoutes: 'Njia Mbadala',
      weatherImpact: 'Athari ya Hali ya Hewa',
      lastUpdated: 'Imesasishwa Mwisho',
      low: 'Msongamano Kidogo',
      medium: 'Msongamano Wastani',
      high: 'Msongamano Kubwa',
      excellent: 'Bora Sana',
      good: 'Nzuri',
      average: 'Wastani',
    poor: 'Duni',
    veryPoor: 'Duni Sana',
    },
    footer: {
      description: 'Kufanya mfumo wa usafiri wa Nairobi uwe wa kuegemea, salama, na wa kupatikana kwa kila mtu.',
      quickLinks: 'Viungo vya Haraka',
      services: 'Huduma',
      contact: 'Mawasiliano',
      routePlanning: 'Kupanga Njia',
      safetyReports: 'Ripoti za Usalama',
      realTimeUpdates: 'Masasisho ya Wakati Halisi',
      analytics: 'Uchambuzi',
      privacyPolicy: 'Sera ya Faragha',
      termsOfService: 'Masharti ya Huduma',
      allRightsReserved: 'Haki zote zimehifadhiwa.',
    },
    // Legal Pages
    legal: {
      privacyPolicy: {
        title: 'Sera ya Faragha',
        lastUpdated: 'Imesasishwa mwisho',
        introduction: {
          title: 'Utangulizi',
          content: 'Smart Matatu inakusanya na kuchakata data ili kutoa ufahamu wa usafiri wa umma wa kuegemea na huduma. Sera hii inaeleza data gani tunayokusanya, jinsi tunavyotumia, na haki zako.'
        },
        dataCollection: {
          title: 'Data Tunayokusanya',
          items: [
            'Taarifa za akaunti (jina, barua pepe, jukumu, shirika)',
            'Data ya matumizi (machapisho ya ukurasa, vitendo, taarifa za kifaa)',
            'Uwasilishaji wa ripoti (aina, maelezo, eneo ikiwa limepewa)',
            'Metadata ya malipo na usajili (hali, kiasi, njia)'
          ]
        },
        dataUsage: {
          title: 'Jinsi Tunavyotumia Data',
          items: [
            'Kutoa na kuboresha uchambuzi na vipengele vya jukwaa',
            'Kuzuia matumizi mabaya kupitia kikomo cha kiwango na ufuatiliaji wa usalama',
            'Kuchakata usajili na malipo',
            'Kuwasiliana masasisho ya huduma na msaada'
          ]
        },
        sharing: {
          title: 'Kushiriki na Kufichua',
          content: 'Hatuzui data ya kibinafsi. Tunaweza kushiriki data na wachakataji wa kuaminika (k.m., uwekaji wa jukwaa, barua pepe, na watoaji wa malipo) chini ya mikataba kali, au wakati inahitajika kisheria.'
        },
        retention: {
          title: 'Kuhifadhi Data',
          content: 'Tunahifadhi data kwa muda tu wa kutosha kutoa huduma na kukidhi majukumu ya kisheria. Unaweza kuomba kufutwa kwa data ya akaunti yako.'
        },
        rights: {
          title: 'Haki Zako',
          items: [
            'Kupata, kusasisha, au kufuta data yako ya kibinafsi',
            'Kujiondoa kutoka mawasiliano yasiyo ya lazima',
            'Kuomba kuhamishwa kwa data'
          ]
        },
        contact: {
          title: 'Mawasiliano',
          content: 'Kwa maombi ya faragha, wasiliana: nelsonmaranda2@gmail.com'
        }
      },
      termsOfService: {
        title: 'Masharti ya Huduma',
        lastUpdated: 'Imesasishwa mwisho',
        acceptance: {
          title: 'Kukubali Masharti',
          content: 'Kwa kufikia au kutumia Smart Matatu, unakubali Masharti haya na Sera yetu ya Faragha.'
        },
        useOfService: {
          title: 'Matumizi ya Huduma',
          items: [
            'Toa taarifa sahihi wakati wa kuunda akaunti',
            'Usitumie vibaya mifumo ya kuripoti au kukadiria',
            'Kufuata sheria zinazotumika wakati wa kutumia jukwaa'
          ]
        },
        subscriptions: {
          title: 'Usajili na Malipo',
          content: 'Mipango ya kulipia inatoa vipengele vya ziada. Ada zinalipwa kwa KES na hazirudishwi mara kipindi cha malipo kianza, isipokuwa pale inapohitajika kisheria.'
        },
        content: {
          title: 'Maudhui',
          content: 'Unahifadhi haki za maudhui unayowasilisha. Kwa kuwasilisha ripoti au makadirio, unatupa leseni ya kutumia data ili kutoa na kuboresha huduma.'
        },
        disclaimers: {
          title: 'Makanusho',
          content: 'Huduma inatolewa "kama ilivyo" bila dhamana. Hatuhakikishi usahihi wa data ya watu wa tatu au upatikanaji usio na kikomo.'
        },
        liability: {
          title: 'Kikomo cha Jukumu',
          content: 'Kwa kiwango cha juu kinachoruhusiwa kisheria, Smart Matatu haitakuwa na jukumu kwa uharibifu wa moja kwa moja au wa matokeo.'
        },
        termination: {
          title: 'Kusitisha',
          content: 'Tunaweza kusimamisha au kusitisha ufikiaji kwa ukiukaji wa Masharti haya au shughuli za kudhuru.'
        },
        contact: {
          title: 'Mawasiliano',
          content: 'Maswali kuhusu Masharti haya: nelsonmaranda2@gmail.com'
        }
      }
    },
    sacco: {
      loading: 'Inapakia Dashibodi ya SACCO...',
      title: 'Dashibodi ya SACCO',
      subtitle: 'Simamia magari, madereva, na njia zako',
      date7d: 'Siku 7 zilizopita',
      date30d: 'Siku 30 zilizopita',
      date90d: 'Siku 90 zilizopita',
      refresh: 'Sasisha',
      tabs: {
        overview: 'Muhtasari',
        routes: 'Utendaji wa Njia',
        drivers: 'Usimamizi wa Madereva',
        feedback: 'Maoni ya Wateja',
        fleet: 'Usimamizi wa Magari',
      },
      metrics: {
        activeRoutes: 'Njia Zinazotumika',
        activeDrivers: 'Madereva Hai',
        totalRevenue7d: 'Mapato Jumla (7d)',
        avgRating: 'Kiwango cha Wastani',
      },
      revenueTooltip: 'Makadirio: vifaa vya kipekee vilivyoripoti kwa kila njia katika siku 7 zilizopita × nauli ya njia. Hii ni rejea ya mwongozo, sio mapato yaliyokaguliwa.',
      fleetStatus: 'Hali ya Magari',
      activeVehicles: 'Magari Hai',
      ofTotal: 'kati ya jumla ya {total}',
      maintenanceDue: 'Matengenezo Yanahitajika',
      vehiclesNeedService: 'magari yanahitaji huduma',
      utilizationRate: 'Kiwango cha Matumizi',
      averageFleetUsage: 'matumizi ya wastani ya magari',
      routePerformance: 'Utendaji wa Njia',
      table: {
        route: 'Njia',
        efficiency: 'Ufanisi',
        revenue7d: 'Mapato (7d)',
        passengers: 'Abiria',
        onTime: 'Kwa Wakati %',
        safety: 'Usalama',
        trend: 'Mwelekeo',
      },
      driverPerformance: 'Utendaji wa Dereva',
      driversTable: {
        driver: 'Dereva',
        safetyScore: 'Alama ya Usalama',
        onTime: 'Kwa Wakati %',
        rating: 'Kiwango',
        incidents: 'Matukio',
        status: 'Hali',
        routes: 'Njia',
      },
      customerFeedback: 'Maoni ya Wateja',
      filters: {
        allStatus: 'Hali Zote',
        pending: 'Inasubiri',
        inProgress: 'Inaendelea',
        resolved: 'Imetatuliwa',
      },
      resolvedInDays: 'Imetatuliwa ndani ya siku {days}',
      fleetOverview: 'Muhtasari wa Magari',
      totalVehicles: 'Magari Jumla',
      averageAge: 'Umri wa Wastani',
      years: 'miaka',
      fleetUtilization: 'Matumizi ya Magari',
    },
    authority: {
      title: 'Dashibodi ya Mamlaka za Usafiri',
      subtitle: 'Fuatilia utii, matukio, na vipimo vya mfumo',
      loading: 'Inapakia Dashibodi ya Mamlaka...',
      last7Days: 'Siku 7 zilizopita',
      last30Days: 'Siku 30 zilizopita',
      last90Days: 'Siku 90 zilizopita',
      refresh: 'Sasisha',
      tabs: {
        compliance: 'Utii',
        incidents: 'Matukio',
        metrics: 'Vipimo vya Mfumo',
        reports: 'Ripoti na Uhamishaji',
        audit: 'Kumbukumbu za Ukaguzi',
        system: 'Afya ya Mfumo',
      },
      kpiCards: {
        totalSaccos: 'SACCO Jumla',
        compliantSaccos: 'SACCO Zinatii',
        activeIncidents: 'Matukio Hai',
        systemUptime: 'Muda wa Mfumo',
      },
      complianceTable: {
        title: 'Hali ya Utii wa SACCO',
        sacco: 'SACCO',
        licenseStatus: 'Hali ya Leseni',
        safetyScore: 'Alama ya Usalama',
        incidentCount: 'Matukio',
        lastInspection: 'Ukaguzi wa Mwisho',
        violations: 'Ukiukaji',
        status: 'Hali',
      },
      complianceStatus: {
        compliant: 'Anatii',
        warning: 'Onyo',
        nonCompliant: 'Hatatii',
        valid: 'Halali',
        expired: 'Imeisha',
        pending: 'Inasubiri',
        unknown: 'Haijulikani',
      },
      incidentsTable: {
        title: 'Matukio ya Usalama',
        route: 'Njia',
        type: 'Aina',
        severity: 'Ukali',
        description: 'Maelezo',
        location: 'Mahali',
        reportedAt: 'Iliripotiwa',
        assignedTo: 'Imepewa',
        resolution: 'Suluhisho',
        resolvedAt: 'Ilitatuliwa',
        allSeverity: 'Ukali Wote',
        allStatus: 'Hali Zote',
        low: 'Chini',
        medium: 'Wastani',
        high: 'Juu',
        critical: 'Muhimu',
        reported: 'Imeripotiwa',
        investigating: 'Inachunguzwa',
        resolved: 'Imesuluhishwa',
        closed: 'Imezimwa',
      },
      systemMetrics: {
        title: 'Vipimo vya Mfumo',
        totalUsers: 'Watumiaji Jumla',
        activeReports: 'Ripoti Hai',
        totalRoutes: 'Njia Jumla',
        systemUptime: 'Muda wa Mfumo',
        dataQuality: 'Ubora wa Data',
        averageResponseTime: 'Muda wa Wastani wa Majibu',
      },
      performance: {
        title: 'Utendaji',
        systemUptime: 'Muda wa Mfumo',
        avgResponseTime: 'Muda wa Wastani wa Majibu',
        dataQuality: 'Ubora wa Data',
      },
      reports: {
        title: 'Uhamishaji wa Data na Ripoti',
        complianceReport: {
          title: 'Ripoti ya Utii',
          description: 'Data ya utii wa SACCO',
        },
        safetyIncidents: {
          title: 'Matukio ya Usalama',
          description: 'Ripoti na data ya matukio',
        },
        systemAnalytics: {
          title: 'Uchambuzi wa Mfumo',
          description: 'Vipimo vya utendaji',
        },
        exportCsv: 'Hamisha CSV',
        exportXls: 'Hamisha XLS',
      },
      auditTable: {
        title: 'Kumbukumbu za Ukaguzi wa Mfumo',
        action: 'Kitendo',
        user: 'Mtumiaji',
        timestamp: 'Wakati',
        details: 'Maelezo',
        ipAddress: 'Anwani ya IP',
        status: 'Hali',
        success: 'Imefanikiwa',
        failed: 'Imeshindwa',
        warning: 'Onyo',
      },
      systemHealth: {
        title: 'Afya ya Mfumo',
        systemUptime: 'Muda wa Mfumo',
        dataQuality: 'Ubora wa Data',
        averageResponseTime: 'Muda wa Wastani wa Majibu',
      },
      userActivity: {
        title: 'Shughuli za Watumiaji',
        totalUsers: 'Watumiaji Jumla',
        activeReports: 'Ripoti Hai',
        totalRoutes: 'Njia Jumla',
      },
    },
    userManagement: {
      title: 'Usimamizi wa Watumiaji',
      subtitle: 'Simamia watumiaji, majukumu, na ruhusa',
      loading: 'Inapakia Watumiaji...',
      refresh: 'Sasisha',
      addUser: 'Ongeza Mtumiaji',
      search: 'Tafuta',
      searchPlaceholder: 'Tafuta watumiaji...',
      statusLabel: 'Status',
      role: 'Jukumu',
      requestedRole: 'Jukumu linalohitajika',
      organization: 'Shirika',
      created: 'Imeundwa',
      tabs: {
        users: 'Watumiaji',
        roles: 'Majukumu',
      },
      table: {
        displayName: 'Jina la Maonyesho',
        email: 'Barua Pepe',
        role: 'Jukumu',
        status: 'Status',
        actions: 'Actions',
      },
      actions: {
        editUser: 'Edit User',
        deleteUser: 'Delete User',
        viewProfile: 'View Profile',
        approve: 'Approve',
        reject: 'Reject',
        edit: 'Edit',
      },
      status: {
        active: 'Hai',
        pending: 'Inasubiri',
        suspended: 'Imesimamishwa',
        rejected: 'Imekataliwa',
      },
      roles: {
        admin: 'Msimamizi',
        moderator: 'Mdhibiti',
        sacco: 'SACCO',
        authority: 'Mamlaka',
        user: 'Mtumiaji',
      },
      deleteConfirm: {
        title: 'Thibitisha Kufuta Mtumiaji',
        message: 'Una uhakika unataka kumfuta mtumiaji huyu? Kitendo hiki hakiwezi kurudishwa.',
        cancel: 'Ghairi',
        delete: 'Futa',
      },
      messages: {
        userDeleted: 'Mtumiaji amefutwa kwa mafanikio',
        userUpdated: 'Mtumiaji amesasishwa kwa mafanikio',
        userCreated: 'Mtumiaji ameundwa kwa mafanikio',
        userApproved: 'Mtumiaji ameidhinishwa kwa mafanikio',
        userRejected: 'Mtumiaji amekataliwa kwa mafanikio',
        deleteError: 'Imeshindwa kumfuta mtumiaji',
        updateError: 'Imeshindwa kumsasisha mtumiaji',
        createError: 'Imeshindwa kumunda mtumiaji',
        approveError: 'Imeshindwa kumidhinisha mtumiaji',
        rejectError: 'Imeshindwa kumkataa mtumiaji',
        fetchError: 'Imeshindwa kupata watumiaji',
        loadError: 'Imeshindwa kupakia watumiaji',
      },
      rejectionReason: 'Rejection reason:',
      modals: {
        addUser: {
          title: 'Ongeza Mtumiaji',
          fullName: 'Jina kamili',
          email: 'Barua pepe',
          password: 'Nenosiri la muda',
          organization: 'Shirika (si lazima)',
          cancel: 'Ghairi',
          create: 'Unda',
        },
        editUser: {
          title: 'Hariri Mtumiaji',
          fullName: 'Jina kamili',
          email: 'Barua pepe',
          organization: 'Shirika (si lazima)',
          cancel: 'Ghairi',
          save: 'Hifadhi',
        },
      },
      filters: {
        searchUsers: 'Tafuta watumiaji...',
        filterByRole: 'Chuja kwa jukumu',
        filterByStatus: 'Chuja kwa hali',
        allRoles: 'Majukumu Yote',
        allStatus: 'Hali Zote',
        applyFilters: 'Tumia Vichujio',
        clearFilters: 'Futa Vichujio',
      },
      noUsers: 'Hakuna watumiaji waliopatikana',
      noUsersMessage: 'Jaribu kubadilisha vigezo vya utafutaji au uchujaji.',
    },
    admin: {
      title: 'Dashibodi ya Msimamizi',
      subtitle: 'Utawala na usimamizi wa mfumo',
      loading: 'Inapakia Dashibodi ya Msimamizi...',
      stats: {
        totalRoutes: 'Jumla ya Njia',
        activeRoutes: 'Njia Zinazotumika',
        totalReports: 'Ripoti Jumla',
        safetyIssues: 'Masuala ya Usalama',
        totalUsers: 'Watumiaji Jumla',
        systemUptime: 'Muda wa Mfumo',
      },
      seedRoutes: 'Ingiza Njia za CBD',
      seeding: 'Inaingiza…',
      runSeed: 'Anzisha',
      seedDescription: 'Inaingiza takriban njia 50 za CBD kwa mafungu madogo. Inahitaji kuingia kama msimamizi.',
      tools: 'Zana',
      routeEditor: 'Kihariri cha Njia',
      routeManagement: 'Usimamizi wa Njia',
      addRoute: 'Ongeza Njia',
      addNewRoute: 'Ongeza Njia Mpya',
      routeName: 'Jina la Njia',
      routeNamePlaceholder: 'mf., Njia 42 - Thika Road',
      description: 'Maelezo',
      descriptionPlaceholder: 'Maelezo ya njia',
      cancel: 'Ghairi',
      route: 'Njia',
      reliability: 'Uhakika',
      safety: 'Usalama',
      reports: 'Ripoti',
      statusLabel: 'Hali',
      actions: 'Vitendo',
      activate: 'Washa',
      deactivate: 'Zima',
      status: {
        active: 'Inatumika',
        inactive: 'Imesitishwa',
        maintenance: 'Matengenezo',
      },
      quickActions: {
        title: 'Vitendo vya Haraka',
        addRoute: 'Ongeza Njia',
        manageUsers: 'Simamia Watumiaji',
        viewReports: 'Tazama Ripoti',
        systemSettings: 'Mipangilio ya Mfumo',
      },
      recentActivity: {
        title: 'Shughuli za Hivi Karibuni',
        noActivity: 'Hakuna shughuli za hivi karibuni',
      },
      pendingReports: 'Ripoti Zisizokaguliwa',
      noPendingReports: 'Hakuna ripoti zinazosubiri',
    },
    profile: {
      title: 'Wasifu',
      subtitle: 'Simamia mipangilio ya akaunti yako',
      loading: 'Inapakia Wasifu...',
      pleaseLogin: 'Tafadhali ingia',
      loginRequired: 'Unahitaji kuingia ili kuona wasifu wako.',
      goToLogin: 'Nenda Kuingia',
      role: 'Jukumu',
      updateError: 'Imeshindwa kusasisha wasifu. Tafadhali jaribu tena.',
      myTripReports: 'Ripoti za Safari Zangu',
      favoriteRoutes: 'Njia Zinazopendwa',
      ratedRoutes: 'Njia Zilizopimwa',
      noFavoriteRoutes: 'Hakuna njia zinazopendwa bado',
      noRatedRoutes: 'Hakuna njia zilizopimwa bado',
      exploreRoutes: 'Chunguza Njia',
    yourAnalytics: 'Uchambuzi Wako',
    totalReports: 'Ripoti Jumla',
    favorites: 'Vipendwa',
    accountInformation: 'Maelezo ya Akaunti',
    accountType: 'Aina ya Akaunti',
    memberSince: 'Mwanachama Tangu',
    noReportsYet: 'Hakuna ripoti zilizowasilishwa bado',
    submitFirstReport: 'Wasilisha Ripoti Yako ya Kwanza',
    thisMonth: 'Mwezi Huu',
    avgRating: 'Alama ya Wastani',
    refresh: 'Sasisha',
    debugUser: 'Chunguza Mtumiaji',
    debugReports: 'Chunguza Ripoti',
    fixReports: 'Sahihisha Ripoti',
    fixScores: 'Sahihisha Alama',
    fixRateLimits: 'Sahihisha Kikomo cha Kiwango',
      tabs: {
        personal: 'Maelezo ya Kibinafsi',
        security: 'Usalama',
        reports: 'Ripoti Zangu',
        favorites: 'Vipendwa',
        analytics: 'Uchambuzi',
      },
      personalInfo: {
        displayName: 'Jina la Maonyesho',
        email: 'Anwani ya Barua Pepe',
        role: 'Jukumu',
        organization: 'Shirika',
        uploadPhoto: 'Pakia Picha',
        editProfile: 'Hariri Wasifu',
        uploading: 'Inapakia...',
        saveChanges: 'Hifadhi Mabadiliko',
        orEnterImageUrl: 'Au ingiza URL ya picha',
        set: 'Weka',
        deletePhoto: 'Futa Picha',
        admin: 'Msimamizi',
        rated: 'Imepimwa',
        youRatedThisRoute: 'Ulipima njia hii',
        view: 'Ona',
        mostReportedRoute: 'Njia Iliyoripotiwa Zaidi',
      },
      security: {
        changePassword: 'Badili Nenosiri',
        oldPassword: 'Nenosiri la Sasa',
        newPassword: 'Nenosiri Jipya',
        confirmNewPassword: 'Thibitisha Nenosiri Jipya',
        updatePassword: 'Sasisha Nenosiri',
      },
      messages: {
        profileUpdated: 'Wasifu umesasishwa kwa mafanikio',
        profileError: 'Imeshindwa kusasisha wasifu',
        passwordUpdated: 'Nenosiri limesasishwa kwa mafanikio',
        passwordError: 'Imeshindwa kusasisha nenosiri',
        passwordMismatch: 'Nenosiri halifanani',
        passwordTooShort: 'Nenosiri lazima liwe na angalau herufi 8',
        currentPasswordIncorrect: 'Nenosiri la sasa si sahihi',
        newPasswordSameAsOld: 'Nenosiri jipya lazima litofautiane na la sasa',
        uploadingImage: 'Inapakia picha...',
        imageUploadError: 'Imeshindwa kupakia picha',
        avatarUpdateError: 'Imeshindwa kusasisha wasifu na picha mpya',
      },
    },
    subscription: {
      title: 'Chagua Mpango Wako',
      subtitle: 'Chagua mpango kamili kwa mahitaji yako ya usafiri. Badilisha wakati wowote ili kufungua vipengele vya hali ya juu.',
      currentPlan: 'Mpango wa Sasa',
      status: 'Status',
      expires: 'Expires',
      features: 'Vipengele Vya Kufanya Kazi',
      popular: 'Maarufu',
      free: 'Bure',
      month: 'mwezi',
      current: 'Mpango wa Sasa',
      processing: 'Inachakata...',
      getStarted: 'Get Started',
      upgrade: 'Badilisha Sasa',
      featureComparison: 'Ulinganisho wa Vipengele',
      basicReports: 'Ripoti za Msingi',
      unlimitedReports: 'Ripoti zisizo na Kikomo',
      advancedAnalytics: 'Uchambuzi wa Hali ya Juu',
      prioritySupport: 'Msaada wa Kipaumbele',
      apiAccess: 'Ufikiaji wa API',
      faq: 'Maswali Yanayoulizwa Mara nyingi',
      faq1: {
        question: 'Je, naweza kubadilisha mpango wangu wakati wowote?',
        answer: 'Ndiyo, unaweza kubadilisha mpango wako wakati wowote. Mabadiliko yanaanza kufanya kazi mara moja.'
      },
      faq2: {
        question: 'Je, unakubali njia zipi za malipo?',
        answer: 'Tunakubali kadi zote kuu za mkopo, M-Pesa, Airtel Money, na uhamisho wa benki.'
      },
      faq3: {
        question: 'Je, kuna jaribio la bure?',
        answer: 'Ndiyo, mipango yote ya kulipia inakuja na jaribio la siku 7 la bure. Hakuna kadi ya mkopo inahitajika.'
      },
      featureNames: {
        advancedAnalytics: 'Uchambuzi wa Hali ya Juu',
        prioritySupport: 'Msaada wa Kipaumbele',
        customBranding: 'Alama ya Kibinafsi',
        apiAccess: 'Ufikiaji wa API',
        unlimitedReports: 'Ripoti Zisizo na Kikomo'
      },
      adminAccess: 'Ufikiaji wa Msimamizi',
      planTypes: {
        free: 'Bure',
        premium: 'Hali ya Juu',
        sacco: 'SACCO',
        enterprise: 'Kampuni'
      },
      statusTypes: {
        active: 'Inafanya Kazi',
        inactive: 'Haifanyi Kazi',
        expired: 'Imeisha',
        pending: 'Inasubiri'
      },
      plans: {
        free: {
          name: 'Bure',
          features: {
            basicInfo: 'Maelezo ya msingi ya njia',
            reports: 'Wasilisha ripoti 5 kwa mwezi',
            support: 'Msaada wa jamii'
          }
        },
        premium: {
          name: 'Hali ya Juu',
          features: {
            unlimitedReports: 'Ripoti zisizo na kikomo',
            advancedAnalytics: 'Uchambuzi wa hali ya juu',
            prioritySupport: 'Msaada wa kipaumbele',
            realTimeNotifications: 'Arifa za wakati halisi'
          }
        },
        sacco: {
          name: 'SACCO',
          features: {
            allPremium: 'Vipengele vyote vya Hali ya Juu',
            revenueAnalytics: 'Uchambuzi wa mapato',
            customBranding: 'Alama ya kibinafsi',
            apiAccess: 'Ufikiaji wa API',
            dedicatedSupport: 'Msaada wa maalum'
          }
        },
        enterprise: {
          name: 'Kampuni',
          features: {
            allSacco: 'Vipengele vyote vya SACCO',
            whiteLabel: 'Suluhisho la alama nyeupe',
            customIntegrations: 'Ujumuishaji wa kibinafsi',
            support247: 'Msaada wa masaa 24/7',
            slaGuarantee: 'Dhamana ya SLA'
          }
        }
      },
      daysRemaining: 'Siku Zilizobaki',
      totalSubscription: 'Jumla ya Usajili',
      yearly: 'Kila Mwaka',
      selectPlan: 'Chagua Mpango',
      days: 'siku',
    },
    payment: {
      title: 'Kamilisha Malipo Yako',
      subtitle: 'Malipo salama kwa usajili wa {plan}',
      orderSummary: 'Muhtasari wa Agizo',
      planLabel: 'Mpango wa {plan}',
      monthly: 'Usajili wa kila mwezi',
      free: 'Bure',
      perMonth: 'kwa mwezi',
      planFeatures: 'Vipengele vya Mpango:',
      paymentMethod: 'Njia ya Malipo',
      card: 'Kadi ya Benki',
      mpesa: 'M-Pesa',
      airtel: 'Airtel Money',
      backToPlans: 'Rudi kwa Mipango',
      processingPayment: 'Inachakata Malipo...',
      activateFreePlan: 'Washa Mpango wa Bure',
      payAmount: 'Lipa KES {amount}',
      secureNote: 'Taarifa zako za malipo zinalindwa na zimefichwa',
      subscriptionWord: 'usajili',
      errors: {
        invalidData: 'Taarifa za malipo si sahihi. Tafadhali chagua mpango tena.',
        createFailed: 'Imeshindwa kuunda malipo. Jaribu tena.',
        paymentFailed: 'Malipo yameshindikana. Jaribu tena.',
        confirmFailed: 'Uthibitisho wa malipo umeshindikana. Jaribu tena.',
        header: 'Hitilafu ya Malipo'
      }
    },
    analyticsDashboard: {
      title: 'Dashibodi ya Uchambuzi',
      subtitle: 'Fuatilia utendaji wa mfumo na ushiriki wa watumiaji',
      last7Days: 'Siku 7 za Mwisho',
      last30Days: 'Siku 30 za Mwisho',
      error: 'Hitilafu ya Kupakia Uchambuzi',
      totalEvents: 'Matukio Jumla',
      activeUsers: 'Watumiaji Wanaofanya Kazi',
      avgEngagement: 'Ushiriki wa Wastani',
      performanceScore: 'Alama ya Utendaji',
      eventTypes: 'Aina za Matukio',
      performanceMetrics: 'Vipimo vya Utendaji',
      metric: 'Kipimo',
      value: 'Thamani',
      endpoint: 'Mwisho wa Mstari',
      timestamp: 'Muda wa Alama',
      noMetrics: 'Hakuna Vipimo vya Utendaji',
      noMetricsDesc: 'Vipimo vya utendaji vitaonekana hapa mfumo unavyokusanya data.',
      // User Metrics
      userMetrics: {
        title: 'Vipimo vya Watumiaji',
        totalUsers: 'Watumiaji Jumla',
        activeUsers: 'Watumiaji Wanaofanya Kazi',
        newUsers: 'Watumiaji Wapya',
        userRoles: 'Majukumu ya Watumiaji'
      },
      // Route Metrics
      routeMetrics: {
        title: 'Vipimo vya Njia',
        totalRoutes: 'Njia Jumla',
        activeRoutes: 'Njia Zinazofanya Kazi',
        topOperators: 'Waendeshaji wa Juu'
      },
      // Report Metrics
      reportMetrics: {
        title: 'Vipimo vya Ripoti',
        totalReports: 'Ripoti Jumla',
        recentReports: 'Ripoti za Hivi Karibuni',
        reportsByType: 'Ripoti kwa Aina',
        reportsBySeverity: 'Ripoti kwa Ukali',
        reportsByStatus: 'Ripoti kwa Hali'
      },
      // Rating Metrics
      ratingMetrics: {
        title: 'Vipimo vya Alama',
        totalRatings: 'Alama Jumla',
        averageRating: 'Alama ya Wastani',
        topRatedRoutes: 'Njia za Alama za Juu',
        routeName: 'Jina la Njia',
        routeNumber: 'Nambari ya Njia',
        operator: 'Mwendeshaji',
        avgRating: 'Alama ya Wastani'
      },
      // Subscription Metrics
      subscriptionMetrics: {
        title: 'Vipimo vya Usajili',
        totalSubscriptions: 'Usajili Jumla',
        activeSubscriptions: 'Usajili Unaofanya Kazi',
        subscriptionsByPlan: 'Usajili kwa Mpango'
      },
      // Payment Metrics
      paymentMetrics: {
        title: 'Vipimo vya Malipo',
        totalPayments: 'Malipo Jumla',
        successfulPayments: 'Malipo Yaliyofanikiwa',
        successRate: 'Kiwango cha Mafanikio',
        totalRevenue: 'Mapato Jumla',
        paymentsByMethod: 'Malipo kwa Njia'
      },
      // Traffic Metrics
      trafficMetrics: {
        title: 'Vipimo vya Msongamano',
        totalRoutesWithTraffic: 'Njia Jumla na Msongamano',
        averageCongestion: 'Msongamano wa Wastani',
        congestionIndex: 'Kielelezo cha Msongamano',
        trafficFactor: 'Sababu ya Msongamano'
      },
      // Geographic Analytics
      geographicAnalytics: {
        title: 'Uchambuzi wa Kijiografia',
        reportHotspots: 'Maeneo ya Ripoti'
      },
      // Time Analytics
      timeAnalytics: {
        title: 'Uchambuzi wa Muda',
        reportsByHour: 'Ripoti kwa Saa'
      },
      // Metric Type Names
      metricTypes: {
        apiResponseTime: 'Muda wa Majibu ya API',
        pageLoadTime: 'Muda wa Kupakia Ukurasa',
        errorRate: 'Kiwango cha Hitilafu',
        userEngagement: 'Ushiriki wa Mtumiaji'
      },
      // Report Types
      reportTypes: {
        crowding: 'Msongamano',
        overcrowding: 'Msongamano Mkubwa',
        delay: 'Ucheleweshaji',
        safety: 'Usalama',
        breakdown: 'Kuvunjika',
        other: 'Nyingine'
      },
      // Severity Levels
      severityLevels: {
        low: 'Chini',
        medium: 'Wastani',
        high: 'Juu',
        critical: 'Muhimu'
      },
      // User Roles
      userRoles: {
        admin: 'Msimamizi',
        user: 'Mtumiaji',
        moderator: 'Msimamizi',
        sacco: 'SACCO',
        authority: 'Mamlaka'
      },
      // Subscription Plans
      subscriptionPlans: {
        free: 'Bure',
        premium: 'Hali ya Juu',
        sacco: 'SACCO',
        enterprise: 'Kampuni'
      }
    },
    userAnalytics: {
      title: 'Uchambuzi Wako wa Kibinafsi',
      subtitle: 'Ufahamu na mapendekezo yaliyojengwa kwa ajili yako',
      last7Days: 'Siku 7 za Mwisho',
      last30Days: 'Siku 30 za Mwisho',
      last90Days: 'Siku 90 za Mwisho',
      refresh: 'Sasisha',
      error: 'Imeshindwa kupakia uchambuzi wa mtumiaji',
      retry: 'Jaribu Tena',
      loading: 'Inapakia Uchambuzi Wako wa Kibinafsi...',
      // Personal Stats
      personalStats: {
        totalReports: 'Ripoti Jumla',
        totalRatings: 'Alama Jumla',
        favoriteRoutes: 'Njia za Kupendeza',
        activityScore: 'Alama ya Shughuli',
        reportsThisMonth: 'mwezi huu',
        avgRating: 'Wastani',
        savedRoutes: 'Njia zilizohifadhiwa',
        veryActiveUser: 'Mtumiaji mwenye shughuli nyingi'
      },
      // Route Insights
      routeInsights: {
        title: 'Ufahamu wa Njia Zako',
        mostReportedRoute: 'Njia Iliyoripotiwa Zaidi',
        bestRatedRoute: 'Njia ya Alama Bora',
        reports: 'ripoti',
        last: 'mwisho',
        stars: 'nyota',
        ratings: 'alama'
      },
      // Recent Activity
      recentActivity: {
        title: 'Shughuli za Hivi Karibuni',
        reportedDelay: 'Aliripoti ucheleweshaji',
        ratedStars: 'Alitoa alama 5',
        reportedSafetyIssue: 'Aliripoti tatizo la usalama'
      },
      // Safety Insights
      safetyInsights: {
        title: 'Ufahamu wa Usalama',
        safetyReports: 'Ripoti za Usalama',
        delayReports: 'Ripoti za Ucheleweshaji',
        resolvedReports: 'Ripoti Zilizotatuliwa',
        averageResponseTime: 'Muda wa Wastani wa Majibu'
      },
      // Recommendations
      recommendations: {
        title: 'Njia Zinazopendekezwa',
        suggestedRoutes: 'Njia Zinazopendekezwa',
        highlyRatedByUsers: 'Alama za juu na watumiaji',
        reliableAndPunctual: 'Kuaminika na kufika kwa wakati',
        safetyTips: 'Vidokezo vya Usalama',
        avoidPeakHours: 'Epuka masaa ya kilele (7-9 asubuhi, 5-7 jioni) kwa usalama bora',
        bestSafetyRecord: 'Njia 15 ina rekodi bora ya usalama katika eneo lako',
        reportImmediately: 'Ripoti wasiwasi wowote wa usalama mara moja kwa majibu ya haraka'
      },
      // Peak Hours
      peakHours: {
        title: 'Masaa ya Kilele na Mapendekezo',
        highTraffic: 'Msongamano mkubwa, ruhusu muda wa ziada',
        peakHours: 'Masaa ya kilele, fikiria njia mbadala'
      }
    },
    saccoDashboard: {
      title: 'Dashibodi ya SACCO',
      dashboardTitle: 'Dashibodi',
      subtitle: 'Uchambuzi wa Utendaji wa SACCO na Ufahamu',
      dataSource: 'Chanzo cha Data: Uchambuzi wa hali halisi wa hifadhidata',
      last7Days: 'Siku 7 za Mwisho',
      last30Days: 'Siku 30 za Mwisho',
      last90Days: 'Siku 90 za Mwisho',
      refresh: 'Sasisha',
      loadingAnalytics: 'Inapakia Uchambuzi wa SACCO...',
      totalRoutes: 'Njia Jumla',
      avgRating: 'Alama ya Wastani',
      totalReports: 'Ripoti Jumla',
      marketRank: 'Cheo cha Soko',
      active: 'inafanya kazi',
      outOf: 'kati ya',
      perDay: 'kwa siku',
      ofSaccos: 'SACCO',
      reportsByType: 'Ripoti kwa Aina',
      reportsBySeverity: 'Ripoti kwa Ukali',
      // Route Performance Analysis
      routePerformanceAnalysis: 'Uchambuzi wa Utendaji wa Njia',
      route: 'Njia',
      overallRating: 'Alama ya Jumla',
      safety: 'Usalama',
      punctuality: 'Ukweli wa Muda',
      comfort: 'Starehe',
      totalRatings: 'Alama Jumla',
      // Revenue Analytics
      totalRevenue: 'Mapato Jumla',
      avgDailyRevenue: 'Mapato ya Wastani ya Kila Siku',
      revenueDays: 'Siku za Mapato',
      dailyRevenueTrends: 'Mwelekeo wa Mapato ya Kila Siku',
      // Market Position
      yourPerformance: 'Utendaji Wako',
      marketRanking: 'Cheo cha Soko:',
      marketAverage: 'Wastani wa Soko:',
      top5Saccos: 'SACCO 5 za Juu',
      // Geographic Insights
      incidentHotspots: 'Maeneo ya Matukio',
      peakHoursAnalysis: 'Uchambuzi wa Masaa ya Kilele',
      error: 'Imeshindwa kupakia uchambuzi wa SACCO',
      retry: 'Jaribu Tena',
      loading: 'Inapakia Uchambuzi wa SACCO...',
      usingSampleData: 'Inatumia data ya mfano - data halisi haipatikani',
      // Overview Tab
      overview: {
        title: 'Muhtasari',
        totalRoutes: 'Njia Jumla',
        active: 'zinazofanya kazi',
        avgRating: 'Alama ya Wastani',
        outOf: 'kati ya 5.0',
        totalReports: 'Ripoti Jumla',
        perDay: 'kwa siku',
        marketRank: 'Cheo cha Soko',
        ofSaccos: 'kati ya SACCO 6',
        reportsByType: 'Ripoti kwa Aina',
        reportsBySeverity: 'Ripoti kwa Ukali'
      },
      // Route Performance Tab
      routePerformance: {
        title: 'Utendaji wa Njia',
        topRatedRoutes: 'Njia za Alama za Juu',
        routeName: 'Jina la Njia',
        routeNumber: 'Nambari ya Njia',
        avgRating: 'Alama ya Wastani',
        totalRatings: 'Alama Jumla',
        avgReliability: 'Kuaminika wa Wastani',
        avgSafety: 'Usalama wa Wastani',
        avgPunctuality: 'Kufika kwa Wakati wa Wastani',
        avgComfort: 'Starehe ya Wastani'
      },
      // Incident Reports Tab
      incidentReports: {
        title: 'Ripoti za Matukio',
        recentReports: 'Ripoti za Hivi Karibuni',
        reportType: 'Aina ya Ripoti',
        severity: 'Ukali',
        location: 'Mahali',
        reportedAt: 'Imeripotiwa',
        status: 'Hali'
      },
      // Revenue Analytics Tab
      revenueAnalytics: {
        title: 'Uchambuzi wa Mapato',
        dailyRevenue: 'Mapato ya Kila Siku',
        totalRevenue: 'Mapato Jumla',
        avgDailyRevenue: 'Mapato ya Wastani ya Kila Siku',
        revenueTrend: 'Mwelekeo wa Mapato'
      },
      // Market Position Tab
      marketPosition: {
        title: 'Nafasi ya Soko',
        competitiveAnalysis: 'Uchambuzi wa Ushindani',
        saccoRanking: 'Cheo cha SACCO',
        totalSaccos: 'SACCO Jumla',
        performanceVsMarket: 'Utendaji dhidi ya Soko',
        saccoReports: 'Ripoti za SACCO',
        marketAvg: 'Wastani wa Soko'
      },
      // Geographic Insights Tab
      geographicInsights: {
        title: 'Ufahamu wa Kijiografia',
        hotspots: 'Maeneo ya Matukio',
        totalLocations: 'Maeneo Jumla',
        latitude: 'Latitudo',
        longitude: 'Longitudo',
        incidentCount: 'Idadi ya Matukio',
        types: 'Aina'
      }
    },
    authorityDashboard: {
      title: 'Dashibodi ya Mipango ya Mamlaka',
      subtitle: 'Mipango ya Kimkakati na Ufahamu wa Udhibiti',
      last7Days: 'Siku 7 za Mwisho',
      last30Days: 'Siku 30 za Mwisho',
      last90Days: 'Siku 90 za Mwisho',
      refresh: 'Sasisha',
      loadingInsights: 'Inapakia Ufahamu wa Mipango ya Mamlaka...',
      critical: 'muhimu',
      avgRisk: 'Hatari ya Wastani:',
      highRiskAreas: 'Maeneo ya hatari ya juu',
      systemEfficiency: 'Ufanisi wa mfumo',
      focusAreas: 'Maeneo ya Kuzingatia',
      recommendedActions: 'Vitendo Vipendekezwa',
      avgDailyReports: 'Ripoti za Wastani za Kila Siku',
      trendDirection: 'Mwelekeo wa Mwelekeo',
      totalReportsLabel: 'Ripoti Jumla',
      criticalSaccos: 'SACCO Muhimu',
      avgReportsPerSacco: 'Ripoti za Wastani kwa SACCO',
      strategicFocusAreas: 'Maeneo ya Kuzingatia ya Kimkakati',
      incidents: 'matukio',
      reports: 'ripoti',
      priorityScoreLabel: 'Alama ya Kipaumbele:',
      totalReportsCount: 'Ripoti Jumla:',
      criticalReportsLabel: 'Ripoti Muhimu:',
      error: 'Imeshindwa kupakia ufahamu wa mamlaka',
      retry: 'Jaribu Tena',
      loading: 'Inapakia Ufahamu wa Mamlaka...',
      // Strategic Overview Tab
      strategicOverview: {
        title: 'Muhtasari wa Kimkakati',
        keyPerformanceIndicators: 'Vielelezo Muhimu vya Utendaji',
        totalSaccos: 'SACCO Jumla',
        totalRoutes: 'Njia Jumla',
        totalReports: 'Ripoti Jumla',
        criticalIncidents: 'Matukio Muhimu',
        focusAreas: 'Maeneo ya Kuzingatia',
        recommendedActions: 'Vitendo Vinazopendekezwa',
        increaseMonitoring: 'Ongeza ufuatiliaji katika maeneo ya hatari ya kijiografia',
        implementInterventions: 'Tekeleza mipango ya kusudi kwa SACCO zisizofanya vizuri',
        focusResources: 'Zingatia rasilimali kwenye masaa ya kilele ya matukio',
        developProtocols: 'Tengeneza miongozo maalum ya usalama kwa njia za hatari',
        establishWarning: 'Anzisha mifumo ya onyo la mapema kwa matukio muhimu'
      },
      // SACCO Performance Tab
      saccoPerformance: {
        title: 'Uchambuzi wa Utendaji wa SACCO',
        topPerformers: 'Wafanyikazi wa Juu',
        poorPerformers: 'Wafanyikazi Duni',
        averageReportsPerSacco: 'Ripoti za Wastani kwa SACCO',
        criticalSaccos: 'SACCO Muhimu',
        saccoName: 'Jina la SACCO',
        totalReports: 'Ripoti Jumla',
        criticalReports: 'Ripoti Muhimu',
        avgSeverity: 'Ukali wa Wastani',
        lastReport: 'Ripoti ya Mwisho'
      },
      // Route Risk Analysis Tab
      routeRiskAnalysis: {
        title: 'Uchambuzi wa Hatari ya Njia',
        highRiskRoutes: 'Njia za Hatari Kubwa',
        totalRoutesAnalyzed: 'Njia Jumla Zilizochambuliwa',
        averageRiskScore: 'Alama ya Wastani ya Hatari',
        criticalRoutes: 'Njia Muhimu',
        routeName: 'Jina la Njia',
        routeNumber: 'Nambari ya Njia',
        operator: 'Mwendeshaji',
        totalIncidents: 'Matukio Jumla',
        criticalIncidents: 'Matukio Muhimu',
        safetyIncidents: 'Matukio ya Usalama',
        accidentIncidents: 'Matukio ya Ajali',
        riskScore: 'Alama ya Hatari',
        lastIncident: 'Tukio la Mwisho'
      },
      // Geographic Insights Tab
      geographicInsights: {
        title: 'Ramani ya Hatari ya Kijiografia',
        highRiskZones: 'Maeneo ya Hatari Kubwa',
        totalRiskZones: 'Maeneo Jumla ya Hatari',
        averageRiskLevel: 'Kiwango cha Wastani cha Hatari',
        latitude: 'Latitudo',
        longitude: 'Longitudo',
        totalIncidents: 'Matukio Jumla',
        criticalIncidents: 'Matukio Muhimu',
        incidentTypes: 'Aina za Matukio',
        avgSeverity: 'Ukali wa Wastani',
        riskLevel: 'Kiwango cha Hatari'
      },
      // Temporal Patterns Tab
      temporalPatterns: {
        title: 'Uchambuzi wa Mwelekeo wa Muda',
        peakHours: 'Masaa ya Kilele',
        peakDays: 'Siku za Kilele',
        averageIncidentsPerHour: 'Matukio ya Wastani kwa Saa',
        peakHoursIdentified: 'Masaa ya Kilele Yaliyotambuliwa',
        hour: 'Saa',
        dayOfWeek: 'Siku ya Wiki',
        incidentCount: 'Idadi ya Matukio',
        criticalCount: 'Idadi Muhimu',
        avgSeverity: 'Ukali wa Wastani'
      },
      // Compliance Trends Tab
      complianceTrends: {
        title: 'Mwelekeo wa Utekelezaji wa SACCO',
        dailyTrends: 'Mwelekeo wa Kila Siku',
        averageDailyReports: 'Ripoti za Wastani za Kila Siku',
        trendDirection: 'Mwelekeo wa Mwelekeo',
        increasing: 'Inaongezeka',
        decreasing: 'Inapungua',
        stable: 'Imara',
        day: 'Siku',
        totalReports: 'Ripoti Jumla',
        totalCritical: 'Jumla Muhimu',
        saccoCount: 'Idadi ya SACCO',
        avgReportsPerSacco: 'Ripoti za Wastani kwa SACCO'
      },
      // Risk Indicators Tab
      riskIndicators: {
        title: 'Vielelezo vya Hatari vya Kutabiri',
        topRisks: 'Hatari za Juu',
        criticalRiskTypes: 'Aina za Hatari Muhimu',
        averageRiskLevel: 'Kiwango cha Wastani cha Hatari',
        reportType: 'Aina ya Ripoti',
        totalCount: 'Idadi Jumla',
        criticalCount: 'Idadi Muhimu',
        avgSeverity: 'Ukali wa Wastani',
        trend: 'Mwelekeo'
      },
      // System Health Tab
      systemHealth: {
        title: 'Afya ya Mfumo na Utendaji',
        totalReports: 'Ripoti Jumla',
        averageResponseTime: 'Muda wa Wastani wa Majibu',
        resolutionRate: 'Kiwango cha Utatuzi',
        dataQuality: 'Ubora wa Data'
      },
      // Resource Recommendations Tab
      resourceRecommendations: {
        title: 'Mapendekezo ya Ugawaji wa Rasilimali',
        prioritySaccos: 'SACCO za Kipaumbele',
        totalResourcesNeeded: 'Rasilimali Jumla Zinazohitajika',
        highPriorityCount: 'Idadi ya Kipaumbele cha Juu',
        highPriorityCases: 'Kesi za Kipaumbele cha Juu',
        saccoName: 'Jina la SACCO',
        totalReports: 'Ripoti Jumla',
        criticalReports: 'Ripoti Muhimu',
        reportTypes: 'Aina za Ripoti',
        priorityScore: 'Alama ya Kipaumbele'
      }
    },
  },
}

export default AppContext
