// User Types
export interface User {
  _id: string
  email: string
  displayName: string
  role: 'user' | 'moderator' | 'admin'
  savedRoutes: string[]
  createdAt: string
  updatedAt: string
}

export interface AuthUser {
  user: User
  token: string
}

// Route Types
export interface Route {
  _id: string
  name: string
  description: string
  path: GeoJSON.LineString
  stops: GeoJSON.Point[]
  sacco: string
  createdAt: string
  updatedAt: string
}

export interface RouteWithScores extends Route {
  reliabilityScore: number
  safetyScore: number
  averageFare: number
  averageWaitTime: number
  totalReports: number
  lastUpdated: string
}

// Report Types
export interface Report {
  _id: string
  userId: string
  routeId: string
  fare: number
  waitTime: number
  crowding: 'low' | 'medium' | 'high' | 'full'
  incidentType?: string
  description?: string
  location: GeoJSON.Point
  timestamp: string
  createdAt: string
}

export interface CreateReportData {
  routeId: string
  fare: number
  waitTime: number
  crowding: 'low' | 'medium' | 'high' | 'full'
  incidentType?: string
  description?: string
  location?: {
    lat: number
    lng: number
  }
}

// Score Types
export interface Score {
  _id: string
  routeId: string
  timeBucket: 'morning' | 'afternoon' | 'evening'
  reliabilityScore: number
  safetyScore: number
  lastUpdated: string
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Map Types
export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface MapMarker {
  id: string
  position: [number, number]
  type: 'route' | 'stop' | 'incident'
  data: any
}

// Form Types
export interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

export interface SignupFormData {
  displayName: string
  email: string
  password: string
  confirmPassword: string
  agreeToTerms: boolean
}

// UI State Types
export interface LoadingState {
  isLoading: boolean
  error?: string
}

export interface MapState {
  center: [number, number]
  zoom: number
  selectedRoute?: string
  filters: {
    timeRange: string
    crowding: string[]
    safety: string[]
  }
}

// Analytics Types
export interface AnalyticsData {
  totalUsers: number
  totalReports: number
  totalRoutes: number
  averageReliability: number
  averageSafety: number
  reportsByDay: Array<{
    date: string
    count: number
  }>
  popularRoutes: Array<{
    routeId: string
    routeName: string
    reportCount: number
  }>
}

// Notification Types
export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: string
  read: boolean
}

// Settings Types
export interface UserSettings {
  language: 'en' | 'sw'
  notifications: {
    email: boolean
    push: boolean
    safety: boolean
    updates: boolean
  }
  privacy: {
    shareLocation: boolean
    shareReports: boolean
    analytics: boolean
  }
  display: {
    theme: 'light' | 'dark' | 'auto'
    mapStyle: 'default' | 'satellite' | 'terrain'
  }
}

// Error Types
export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: string
}

// Language Types
export interface LanguageStrings {
  common: {
    loading: string
    error: string
    success: string
    cancel: string
    save: string
    delete: string
    edit: string
    view: string
    close: string
    back: string
    next: string
    previous: string
    submit: string
    search: string
    filter: string
    sort: string
    refresh: string
  }
  navigation: {
    home: string
    map: string
    report: string
    login: string
    signup: string
    admin: string
    profile: string
    settings: string
  }
  auth: {
    login: string
    signup: string
    logout: string
    email: string
    password: string
    confirmPassword: string
    displayName: string
    rememberMe: string
    forgotPassword: string
    createAccount: string
    alreadyHaveAccount: string
    dontHaveAccount: string
  }
  map: {
    title: string
    loading: string
    noRoutes: string
    selectRoute: string
    viewDetails: string
    reportTrip: string
    filter: string
    sort: string
  }
  report: {
    title: string
    route: string
    fare: string
    waitTime: string
    crowding: string
    incident: string
    description: string
    location: string
    photo: string
    submit: string
    success: string
  }
  admin: {
    title: string
    routes: string
    reports: string
    users: string
    analytics: string
    settings: string
    addRoute: string
    editRoute: string
    deleteRoute: string
  }
}
