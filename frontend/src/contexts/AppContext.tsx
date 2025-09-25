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
    },
    report: {
      title: 'Report Your Trip',
      route: 'Route',
      fare: 'Fare Paid (KES)',
      waitTime: 'Wait Time (minutes)',
      crowding: 'Crowding Level',
      incident: 'Safety Issues',
      description: 'Additional Details',
      location: 'Location',
      photo: 'Photo',
      submit: 'Submit Report',
      success: 'Report submitted successfully',
    },
    admin: {
      title: 'Admin Dashboard',
      routes: 'Routes',
      reports: 'Reports',
      users: 'Users',
      analytics: 'Analytics',
      settings: 'Settings',
      addRoute: 'Add Route',
      editRoute: 'Edit Route',
      deleteRoute: 'Delete Route',
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
    },
    report: {
      title: 'Ripoti Safari Yako',
      route: 'Njia',
      fare: 'Kodi ya Kulipwa (KES)',
      waitTime: 'Muda wa Kusubiri (dakika)',
      crowding: 'Kiwango cha Uchangamano',
      incident: 'Masuala ya Usalama',
      description: 'Maelezo Zaidi',
      location: 'Mahali',
      photo: 'Picha',
      submit: 'Wasilisha Ripoti',
      success: 'Ripoti imewasilishwa kwa mafanikio',
    },
    admin: {
      title: 'Dashibodi ya Msimamizi',
      routes: 'Njia',
      reports: 'Ripoti',
      users: 'Watumiaji',
      analytics: 'Uchambuzi',
      settings: 'Mipangilio',
      addRoute: 'Ongeza Njia',
      editRoute: 'Hariri Njia',
      deleteRoute: 'Futa Njia',
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
      low: 'Chini',
      medium: 'Wastani',
      high: 'Juu',
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
  },
}

export default AppContext
