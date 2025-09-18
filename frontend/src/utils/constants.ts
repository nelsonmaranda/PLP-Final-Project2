// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
}

// Map Configuration
export const MAP_CONFIG = {
  DEFAULT_CENTER: [-1.2921, 36.8219] as [number, number], // Nairobi coordinates
  DEFAULT_ZOOM: 11,
  MIN_ZOOM: 8,
  MAX_ZOOM: 18,
  TILE_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}

// Route Configuration
export const ROUTES = {
  HOME: '/',
  MAP: '/map',
  REPORT: '/report',
  LOGIN: '/login',
  SIGNUP: '/signup',
  ADMIN: '/admin',
  PROFILE: '/profile',
  SETTINGS: '/settings',
} as const

// User Roles
export const USER_ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
} as const

// Crowding Levels
export const CROWDING_LEVELS = [
  { value: 'low', label: 'Low - Plenty of space', color: 'text-green-600', bgColor: 'bg-green-100' },
  { value: 'medium', label: 'Medium - Some standing', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { value: 'high', label: 'High - Crowded', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { value: 'full', label: 'Full - Standing room only', color: 'text-red-600', bgColor: 'bg-red-100' },
] as const

// Incident Types
export const INCIDENT_TYPES = [
  'Overcrowding',
  'Reckless driving',
  'Overcharging',
  'Rude conductor',
  'Vehicle breakdown',
  'Long delays',
  'Other',
] as const

// Time Buckets
export const TIME_BUCKETS = [
  { value: 'morning', label: 'Morning (6AM - 12PM)', start: 6, end: 12 },
  { value: 'afternoon', label: 'Afternoon (12PM - 6PM)', start: 12, end: 18 },
  { value: 'evening', label: 'Evening (6PM - 12AM)', start: 18, end: 24 },
] as const

// Score Ranges
export const SCORE_RANGES = {
  MIN: 1,
  MAX: 5,
  EXCELLENT: 4.5,
  GOOD: 3.5,
  AVERAGE: 2.5,
  POOR: 1.5,
} as const

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_FILES: 3,
} as const

// Validation
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  DISPLAY_NAME_MIN_LENGTH: 2,
  DISPLAY_NAME_MAX_LENGTH: 50,
  EMAIL_MAX_LENGTH: 254,
  DESCRIPTION_MAX_LENGTH: 500,
} as const

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER: 'user',
  SETTINGS: 'appSettings',
  LANGUAGE: 'language',
  THEME: 'theme',
  MAP_CENTER: 'mapCenter',
  MAP_ZOOM: 'mapZoom',
} as const

// Notification Types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const

// Theme Options
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
} as const

// Language Options
export const LANGUAGES = {
  EN: 'en',
  SW: 'sw',
} as const

// Map Styles
export const MAP_STYLES = {
  DEFAULT: 'default',
  SATELLITE: 'satellite',
  TERRAIN: 'terrain',
} as const

// API Endpoints
export const API_ENDPOINTS = {
  HEALTH: '/health',
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  ROUTES: {
    LIST: '/routes',
    DETAIL: '/routes/:id',
    CREATE: '/routes',
    UPDATE: '/routes/:id',
    DELETE: '/routes/:id',
    SEARCH: '/routes/search',
  },
  REPORTS: {
    LIST: '/reports',
    DETAIL: '/reports/:id',
    CREATE: '/reports',
    UPDATE: '/reports/:id',
    DELETE: '/reports/:id',
    BY_ROUTE: '/reports/route/:routeId',
  },
  SCORES: {
    LIST: '/scores',
    BY_ROUTE: '/scores/route/:routeId',
  },
  USERS: {
    LIST: '/users',
    DETAIL: '/users/:id',
    UPDATE: '/users/:id',
    DELETE: '/users/:id',
  },
  ANALYTICS: {
    SUMMARY: '/analytics/summary',
    ROUTES: '/analytics/routes',
    REPORTS: '/analytics/reports',
    USERS: '/analytics/users',
  },
  UPLOAD: '/upload',
  GEOCODE: '/geocode',
} as const

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error - please check your connection',
  SERVER_ERROR: 'Server error - please try again later',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'The requested resource was not found',
  VALIDATION_ERROR: 'Please check your input and try again',
  UNKNOWN_ERROR: 'An unexpected error occurred',
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  SIGNUP_SUCCESS: 'Account created successfully',
  REPORT_SUBMITTED: 'Report submitted successfully',
  ROUTE_CREATED: 'Route created successfully',
  ROUTE_UPDATED: 'Route updated successfully',
  ROUTE_DELETED: 'Route deleted successfully',
  SETTINGS_SAVED: 'Settings saved successfully',
} as const

// Loading Messages
export const LOADING_MESSAGES = {
  LOADING_ROUTES: 'Loading routes...',
  LOADING_REPORTS: 'Loading reports...',
  LOADING_MAP: 'Loading map...',
  SUBMITTING_REPORT: 'Submitting report...',
  SAVING_SETTINGS: 'Saving settings...',
  LOGGING_IN: 'Logging in...',
  CREATING_ACCOUNT: 'Creating account...',
} as const

// Breakpoints
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const

// Animation Durations
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const

// Debounce Delays
export const DEBOUNCE_DELAY = {
  SEARCH: 300,
  INPUT: 500,
  API_CALL: 1000,
} as const

// Retry Configuration
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 1000,
  MAX_DELAY: 10000,
  BACKOFF_FACTOR: 2,
} as const

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_AI_PREDICTIONS: process.env.REACT_APP_ENABLE_AI === 'true',
  ENABLE_PUSH_NOTIFICATIONS: process.env.REACT_APP_ENABLE_PUSH === 'true',
  ENABLE_OFFLINE_MODE: process.env.REACT_APP_ENABLE_OFFLINE === 'true',
  ENABLE_ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
} as const

// Environment
export const ENVIRONMENT = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
} as const

// Current Environment
export const CURRENT_ENV = process.env.NODE_ENV || ENVIRONMENT.DEVELOPMENT

// Is Development
export const IS_DEVELOPMENT = CURRENT_ENV === ENVIRONMENT.DEVELOPMENT

// Is Production
export const IS_PRODUCTION = CURRENT_ENV === ENVIRONMENT.PRODUCTION
