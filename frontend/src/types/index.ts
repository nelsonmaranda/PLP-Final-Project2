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
  operator: string
  routeNumber: string
  path: number[][]
  stops: Array<{
    name: string
    coordinates: number[]
  }>
  fare: number
  operatingHours: {
    start: string
    end: string
  }
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface RouteWithScores extends Route {
  score?: {
    reliability: number
    safety: number
    punctuality: number
    comfort: number
    overall: number
    totalReports: number
    lastCalculated: string
  }
}

// Report Types
export interface Report {
  _id: string
  userId: string
  routeId: string
  reportType: string
  description?: string
  location: {
    type: string
    coordinates: number[]
  }
  severity: string
  status: string
  isAnonymous: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateReportData {
  routeId: string
  reportType: string
  description?: string
  location?: {
    type: string
    coordinates: number[]
  }
  severity: string
  isAnonymous: boolean
}

// Score Types
export interface Score {
  _id: string
  routeId: string
  reliability: number
  safety: number
  punctuality: number
  comfort: number
  overall: number
  totalReports: number
  lastCalculated: string
  createdAt: string
  updatedAt: string
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
}

export interface SignupFormData {
  displayName: string
  email: string
  password: string
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
  averageScore?: number
  averageReliability?: number
  averageSafety?: number
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

// AI/ML Types
export interface WeatherData {
  temperature: number
  humidity: number
  windSpeed: number
  condition: string
  description: string
  icon: string
  location: string
  timestamp: string
}

export interface FarePrediction {
  predictedFare: number
  confidence: number
  minFare: number
  maxFare: number
  trend: 'increasing' | 'decreasing' | 'stable'
  factors: string[]
  lastUpdated: string
}

export interface SafetyScore {
  overallScore: number
  reliabilityScore: number
  incidentScore: number
  driverScore: number
  vehicleScore: number
  factors: string[]
  lastUpdated: string
}

export interface CrowdDensity {
  level: 'low' | 'medium' | 'high'
  percentage: number
  predictedPeak: string
  recommendedTime: string
  lastUpdated: string
}

export interface RouteInsight {
  routeId: string
  routeName: string
  farePrediction: FarePrediction
  safetyScore: SafetyScore
  crowdDensity: CrowdDensity
  travelTime: number
  recommendedTime: string
  alternativeRoutes: string[]
  weatherImpact: string
  lastUpdated: string
}

export interface DashboardStats {
  totalRoutes: number
  activeReports: number
  averageFare: number
  safetyRating: number
  weatherCondition: string
  temperature: number
  humidity: number
  windSpeed: number
  totalUsers: number
  reportsToday: number
  incidentsToday: number
  topPerformingRoute: string
  lastUpdated: string
}

// ==================== ANALYTICS TYPES ====================

// Route Efficiency Scoring
export interface RouteEfficiencyScore {
  routeId: string
  routeName: string
  efficiencyScore: number // 0-100
  factors: {
    reliability: number // Based on on-time performance
    speed: number // Average speed vs expected
    safety: number // Safety incident rate
    comfort: number // User comfort ratings
    cost: number // Value for money
    frequency: number // Service frequency
  }
  recommendations: string[]
  lastUpdated: string
}

// Travel Time Prediction
export interface TravelTimePrediction {
  routeId: string
  fromStop: string
  toStop: string
  predictedTime: number // in minutes
  confidence: number // 0-100
  factors: {
    timeOfDay: number
    dayOfWeek: number
    weather: number
    traffic: number
    historical: number
  }
  alternativeTimes: {
    optimistic: number
    realistic: number
    pessimistic: number
  }
  lastUpdated: string
}

// Alternative Route
export interface AlternativeRoute {
  routeId: string
  routeName: string
  totalTime: number
  totalCost: number
  efficiency: number
  reasons: string[]
  stops: string[]
}

// Trend Analysis
export interface TrendAnalysis {
  routeId: string
  period: 'daily' | 'weekly' | 'monthly'
  trends: {
    ridership: {
      current: number
      previous: number
      change: number
      trend: 'increasing' | 'decreasing' | 'stable'
    }
    efficiency: {
      current: number
      previous: number
      change: number
      trend: 'improving' | 'declining' | 'stable'
    }
    safety: {
      current: number
      previous: number
      change: number
      trend: 'safer' | 'riskier' | 'stable'
    }
    cost: {
      current: number
      previous: number
      change: number
      trend: 'increasing' | 'decreasing' | 'stable'
    }
  }
  insights: string[]
  lastUpdated: string
}

// Demand Forecast
export interface DemandForecast {
  routeId: string
  timeSlot: string
  predictedDemand: number // 0-100
  confidence: number
  factors: {
    historical: number
    weather: number
    events: number
    seasonality: number
  }
  recommendations: string[]
  lastUpdated: string
}

// User Recommendation
export interface UserRecommendation {
  userId: string
  recommendations: {
    routeId: string
    routeName: string
    reason: string
    score: number
    type: 'efficiency' | 'safety' | 'cost' | 'convenience'
  }[]
  preferences: {
    efficiency: number
    safety: number
    cost: number
    convenience: number
  }
  lastUpdated: string
}
