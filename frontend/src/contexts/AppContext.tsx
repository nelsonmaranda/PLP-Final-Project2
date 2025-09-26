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

// Load initial language from localStorage
const getInitialLanguage = (): 'en' | 'sw' => {
  try {
    const saved = localStorage.getItem('language')
    return saved === 'sw' ? 'sw' : 'en'
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
        dispatch({ type: 'SET_LOADING', payload: true })
        
        // First check localStorage for existing token
        const token = localStorage.getItem('authToken')
        const storedUser = localStorage.getItem('user')
        
        if (token && storedUser) {
          try {
            // Try to get fresh user data from API
            const user = await apiService.getCurrentUser()
            if (user) {
              dispatch({ type: 'SET_USER', payload: user })
            } else {
              // If API call fails, clear stored data and log out
              console.warn('API call failed, clearing stored data')
              localStorage.removeItem('authToken')
              localStorage.removeItem('user')
              dispatch({ type: 'SET_USER', payload: null })
            }
          } catch (error) {
            // If API fails, clear stored data and log out
            console.warn('Failed to refresh user data, clearing stored data:', error)
            localStorage.removeItem('authToken')
            localStorage.removeItem('user')
            dispatch({ type: 'SET_USER', payload: null })
          }
        }
        // If no token/user, user remains null (not authenticated)
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
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
      saccoDashboard: 'SACCO Dashboard',
      authorityDashboard: 'Authority Dashboard',
      userManagement: 'User Management',
      adminPanel: 'Admin Panel',
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
      predictedFareLabel: 'Predicted fare',
      safetyScoreLabel: 'Safety score',
      travelTimeLabel: 'Travel time',
      bestTimeLabel: 'Best time',
      routeLabel: 'Route',
      viewLabel: 'View',
      submitReportBtn: 'Submit Report',
      quickActions: 'Quick Actions',
      quickViewMap: 'View Map',
      quickSubmitReport: 'Tuma Ripoti',
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
      tabs: {
        compliance: 'Compliance',
        incidents: 'Incidents',
        metrics: 'System Metrics',
        reports: 'Reports & Export',
        audit: 'Audit Log',
        system: 'System Health',
      },
      complianceTable: {
        sacco: 'SACCO',
        licenseStatus: 'License Status',
        safetyScore: 'Safety Score',
        incidentCount: 'Incident Count',
        lastInspection: 'Last Inspection',
        violations: 'Violations',
        status: 'Status',
      },
      complianceStatus: {
        compliant: 'Compliant',
        warning: 'Warning',
        nonCompliant: 'Non-Compliant',
      },
      incidentsTable: {
        route: 'Route',
        type: 'Type',
        severity: 'Severity',
        description: 'Description',
        location: 'Location',
        reportedAt: 'Reported At',
        assignedTo: 'Assigned To',
        resolution: 'Resolution',
        resolvedAt: 'Resolved At',
      },
      systemMetrics: {
        totalUsers: 'Total Users',
        activeReports: 'Active Reports',
        totalRoutes: 'Total Routes',
        systemUptime: 'System Uptime',
        dataQuality: 'Data Quality',
        averageResponseTime: 'Average Response Time',
      },
      auditTable: {
        action: 'Action',
        user: 'User',
        timestamp: 'Timestamp',
        details: 'Details',
        ipAddress: 'IP Address',
      },
    },
    userManagement: {
      title: 'User Management',
      subtitle: 'Manage users, roles, and permissions',
      loading: 'Loading Users...',
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
        deleteError: 'Failed to delete user',
        updateError: 'Failed to update user',
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
    },
    admin: {
      title: 'Admin Dashboard',
      subtitle: 'System administration and management',
      loading: 'Loading Admin Dashboard...',
      stats: {
        totalUsers: 'Total Users',
        activeRoutes: 'Active Routes',
        totalReports: 'Total Reports',
        systemUptime: 'System Uptime',
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
    },
    profile: {
      title: 'Profile',
      subtitle: 'Manage your account settings',
      loading: 'Loading Profile...',
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
      saccoDashboard: 'Dashibodi ya SACCO',
      authorityDashboard: 'Dashibodi ya Mamlaka',
      userManagement: 'Usimamizi wa Watumiaji',
      adminPanel: 'Paneli ya Msimamizi',
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
      predictedFareLabel: 'Utabiri wa kodi',
      safetyScoreLabel: 'Alama ya usalama',
      travelTimeLabel: 'Muda wa kusafiri',
      bestTimeLabel: 'Muda bora',
      routeLabel: 'Njia',
      viewLabel: 'Ona',
      submitReportBtn: 'Wasilisha Ripoti',
      quickActions: 'Vitendo vya Haraka',
      quickViewMap: 'Ona Ramani',
      quickSubmitReport: 'Tuma Ripoti',
      quickViewProfile: 'Ona Wasifu',
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
      tabs: {
        compliance: 'Utii',
        incidents: 'Matukio',
        metrics: 'Vipimo vya Mfumo',
        reports: 'Ripoti na Uhamishaji',
        audit: 'Kumbukumbu za Ukaguzi',
        system: 'Afya ya Mfumo',
      },
      complianceTable: {
        sacco: 'SACCO',
        licenseStatus: 'Hali ya Leseni',
        safetyScore: 'Alama ya Usalama',
        incidentCount: 'Idadi ya Matukio',
        lastInspection: 'Ukaguzi wa Mwisho',
        violations: 'Ukiukaji',
        status: 'Hali',
      },
      complianceStatus: {
        compliant: 'Anatii',
        warning: 'Onyo',
        nonCompliant: 'Hatatii',
      },
      incidentsTable: {
        route: 'Njia',
        type: 'Aina',
        severity: 'Ukali',
        description: 'Maelezo',
        location: 'Mahali',
        reportedAt: 'Iliripotiwa',
        assignedTo: 'Imepewa',
        resolution: 'Suluhisho',
        resolvedAt: 'Ilitatuliwa',
      },
      systemMetrics: {
        totalUsers: 'Watumiaji Jumla',
        activeReports: 'Ripoti Hai',
        totalRoutes: 'Njia Jumla',
        systemUptime: 'Muda wa Mfumo',
        dataQuality: 'Ubora wa Data',
        averageResponseTime: 'Muda wa Wastani wa Majibu',
      },
      auditTable: {
        action: 'Kitendo',
        user: 'Mtumiaji',
        timestamp: 'Wakati',
        details: 'Maelezo',
        ipAddress: 'Anwani ya IP',
      },
    },
    userManagement: {
      title: 'Usimamizi wa Watumiaji',
      subtitle: 'Simamia watumiaji, majukumu, na ruhusa',
      loading: 'Inapakia Watumiaji...',
      tabs: {
        users: 'Watumiaji',
        roles: 'Majukumu',
      },
      table: {
        displayName: 'Jina la Maonyesho',
        email: 'Barua Pepe',
        role: 'Jukumu',
        status: 'Hali',
        actions: 'Vitendo',
      },
      actions: {
        editUser: 'Hariri Mtumiaji',
        deleteUser: 'Futa Mtumiaji',
        viewProfile: 'Ona Wasifu',
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
        deleteError: 'Imeshindwa kumfuta mtumiaji',
        updateError: 'Imeshindwa kumsasisha mtumiaji',
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
    },
    admin: {
      title: 'Dashibodi ya Msimamizi',
      subtitle: 'Utawala na usimamizi wa mfumo',
      loading: 'Inapakia Dashibodi ya Msimamizi...',
      stats: {
        totalUsers: 'Watumiaji Jumla',
        activeRoutes: 'Njia Zinazotumika',
        totalReports: 'Ripoti Jumla',
        systemUptime: 'Muda wa Mfumo',
      },
      quickActions: {
        title: 'Vitendo vya Haraka',
        addRoute: 'Ongeza Njia',
        manageUsers: 'Simamia Watumiaji',
        viewReports: 'Ona Ripoti',
        systemSettings: 'Mipangilio ya Mfumo',
      },
      recentActivity: {
        title: 'Shughuli za Hivi Karibuni',
        noActivity: 'Hakuna shughuli za hivi karibuni',
      },
    },
    profile: {
      title: 'Wasifu',
      subtitle: 'Simamia mipangilio ya akaunti yako',
      loading: 'Inapakia Wasifu...',
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
  },
}

export default AppContext
