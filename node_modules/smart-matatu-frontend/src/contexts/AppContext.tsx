import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { User, UserSettings, LanguageStrings } from '../types'
import apiService from '../services/api'

// App State Interface
interface AppState {
  user: User | null
  isAuthenticated: boolean
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

// Initial State
const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  language: 'en',
  settings: {
    language: 'en',
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
  isLoading: false,
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
      return { 
        ...state, 
        settings: { ...state.settings, ...action.payload }
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
        const user = await apiService.getCurrentUser()
        if (user) {
          dispatch({ type: 'SET_USER', payload: user })
        }
      } catch (error) {
        console.error('Error loading user:', error)
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
    dispatch({ type: 'SET_USER', payload: user })
  }

  const setLanguage = (language: 'en' | 'sw') => {
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
  },
}

export default AppContext
