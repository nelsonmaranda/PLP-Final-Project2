import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { 
  User, 
  AuthUser, 
  Route, 
  RouteWithScores, 
  Report, 
  CreateReportData, 
  Score, 
  AnalyticsData,
  ApiResponse,
  PaginatedResponse,
  LoginFormData,
  SignupFormData
} from '../types'

class ApiService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: 'https://us-central1-smart-matwana-ke.cloudfunctions.net/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid - clear auth data but don't redirect
          // Let the app components handle the authentication state
          localStorage.removeItem('authToken')
          localStorage.removeItem('user')
        }
        return Promise.reject(error)
      }
    )
  }

  // Health Check
  async getHealth(): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse = await this.api.get('/health')
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Authentication
  async login(credentials: LoginFormData): Promise<ApiResponse<AuthUser>> {
    try {
      const response: AxiosResponse<ApiResponse<AuthUser>> = await this.api.post('/auth/login', credentials)
      if (response.data.success && response.data.data) {
        localStorage.setItem('authToken', response.data.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.data.user))
      }
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async signup(userData: SignupFormData): Promise<ApiResponse<AuthUser>> {
    try {
      const response: AxiosResponse<ApiResponse<AuthUser>> = await this.api.post('/auth/register', userData)
      if (response.data.success && response.data.data) {
        localStorage.setItem('authToken', response.data.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.data.user))
      }
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async logout(): Promise<void> {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response: AxiosResponse<ApiResponse<{ user: User }>> = await this.api.get('/auth/profile')
      return response.data.data?.user || null
    } catch (error) {
      // If profile fetch fails, try to get from localStorage
      const user = localStorage.getItem('user')
      return user ? JSON.parse(user) : null
    }
  }

  // Routes
  async getRoutes(params?: {
    page?: number
    limit?: number
    sort?: string
    order?: 'asc' | 'desc'
  }): Promise<ApiResponse<{ routes: RouteWithScores[]; pagination: any }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ routes: RouteWithScores[]; pagination: any }>> = await this.api.get('/routes', { params })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getNearbyRoutes(lat: number, lng: number, radius: number = 5): Promise<ApiResponse<{ routes: RouteWithScores[]; location: any; radius: number }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ routes: RouteWithScores[]; location: any; radius: number }>> = await this.api.get('/routes/nearby', {
        params: { lat, lng, radius }
      })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getRoute(id: string): Promise<ApiResponse<RouteWithScores>> {
    try {
      const response: AxiosResponse<ApiResponse<RouteWithScores>> = await this.api.get(`/routes/${id}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async createRoute(routeData: Partial<Route>): Promise<ApiResponse<Route>> {
    try {
      const response: AxiosResponse<ApiResponse<Route>> = await this.api.post('/routes', routeData)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async updateRoute(id: string, routeData: Partial<Route>): Promise<ApiResponse<Route>> {
    try {
      const response: AxiosResponse<ApiResponse<Route>> = await this.api.put(`/routes/${id}`, routeData)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async deleteRoute(id: string): Promise<ApiResponse<void>> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await this.api.delete(`/routes/${id}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Reports
  async getReports(page = 1, limit = 10): Promise<ApiResponse<PaginatedResponse<Report>>> {
    try {
      const response: AxiosResponse<ApiResponse<PaginatedResponse<Report>>> = await this.api.get(
        `/reports?page=${page}&limit=${limit}`
      )
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getReportsByRoute(routeId: string): Promise<ApiResponse<Report[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Report[]>> = await this.api.get(`/reports/route/${routeId}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async createReport(reportData: CreateReportData): Promise<ApiResponse<Report>> {
    try {
      const response: AxiosResponse<ApiResponse<Report>> = await this.api.post('/reports', reportData)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async updateReport(id: string, reportData: Partial<CreateReportData>): Promise<ApiResponse<Report>> {
    try {
      const response: AxiosResponse<ApiResponse<Report>> = await this.api.put(`/reports/${id}`, reportData)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async deleteReport(id: string): Promise<ApiResponse<void>> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await this.api.delete(`/reports/${id}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Scores
  async getScores(params?: {
    page?: number
    limit?: number
    sort?: string
    order?: 'asc' | 'desc'
  }): Promise<ApiResponse<{ scores: Score[]; pagination: any }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ scores: Score[]; pagination: any }>> = await this.api.get('/scores', { params })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getScoresByRoute(routeId: string): Promise<ApiResponse<{ score: Score }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ score: Score }>> = await this.api.get(`/scores/route/${routeId}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getTopRoutes(limit: number = 10): Promise<ApiResponse<{ scores: Score[] }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ scores: Score[] }>> = await this.api.get(`/scores/top/${limit}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getWorstRoutes(limit: number = 10): Promise<ApiResponse<{ scores: Score[] }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ scores: Score[] }>> = await this.api.get(`/scores/worst/${limit}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Analytics
  async getAnalytics(): Promise<ApiResponse<AnalyticsData>> {
    try {
      const response: AxiosResponse<ApiResponse<AnalyticsData>> = await this.api.get('/analytics/summary')
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Users
  async getUsers(page = 1, limit = 10): Promise<ApiResponse<PaginatedResponse<User>>> {
    try {
      const response: AxiosResponse<ApiResponse<PaginatedResponse<User>>> = await this.api.get(
        `/users?page=${page}&limit=${limit}`
      )
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getUser(id: string): Promise<ApiResponse<User>> {
    try {
      const response: AxiosResponse<ApiResponse<User>> = await this.api.get(`/users/${id}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async updateUser(id: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response: AxiosResponse<ApiResponse<User>> = await this.api.put(`/users/${id}`, userData)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    try {
      const response: AxiosResponse<ApiResponse<void>> = await this.api.delete(`/users/${id}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Utility methods
  private handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      return new Error(error.response.data?.message || error.response.data?.error || 'Server error')
    } else if (error.request) {
      // Request was made but no response received
      return new Error('Network error - please check your connection')
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred')
    }
  }

  // File upload
  async uploadFile(file: File, type: 'report' | 'profile'): Promise<ApiResponse<{ url: string }>> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response: AxiosResponse<ApiResponse<{ url: string }>> = await this.api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Search
  async searchRoutes(query: string, params?: {
    page?: number
    limit?: number
  }): Promise<ApiResponse<{ routes: RouteWithScores[]; pagination: any }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ routes: RouteWithScores[]; pagination: any }>> = await this.api.get(
        `/routes/search/${encodeURIComponent(query)}`, { params }
      )
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Geocoding
  async geocodeAddress(address: string): Promise<ApiResponse<{ lat: number; lng: number }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ lat: number; lng: number }>> = await this.api.get(
        `/geocode?address=${encodeURIComponent(address)}`
      )
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // AI Inference (feature-flagged)
  async predict(routeId: string, features: Record<string, number>): Promise<ApiResponse<{ prediction: number; label: string; confidence: number }>> {
    try {
      const enabled = (window as any)?.featureFlags?.ai === true || process.env.VITE_ENABLE_AI === 'true'
      if (!enabled) {
        return { success: true, data: { prediction: 0.5, label: 'medium', confidence: 0.5 } } as any
      }
      const response: AxiosResponse<ApiResponse<{ prediction: number; label: string; confidence: number }>> = await this.api.post('/ai/predict', { routeId, features })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }
}

// Create and export a singleton instance
const apiService = new ApiService()
export default apiService
