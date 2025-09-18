import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, mockRoute, mockScore, mockUser, mockReport } from '../test/utils'
import App from '../App'
import apiService from '../services/api'

const mockApiService = vi.mocked(apiService)

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Mock Leaflet
vi.mock('leaflet', () => ({
  default: {
    icon: vi.fn(() => ({
      iconUrl: 'mock-icon.png',
      shadowUrl: 'mock-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    })),
  },
}))

// Mock react-leaflet components
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="marker">{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
  Polyline: () => <div data-testid="polyline" />,
}))

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
  })

  describe('User Authentication Flow', () => {
    it('completes full login flow', async () => {
      mockApiService.login.mockResolvedValue({
        success: true,
        data: {
          user: mockUser,
          token: 'mock-token',
        },
      })

      render(<App />)
      
      // Navigate to login page
      await userEvent.click(screen.getAllByRole('link', { name: 'Login' })[0])
      
      // Fill out login form
      await userEvent.type(screen.getByLabelText('Email address'), 'test@example.com')
      await userEvent.type(screen.getByLabelText('Password'), 'password123')
      
      // Submit form
      await userEvent.click(screen.getByText('Sign in'))
      
      await waitFor(() => {
        expect(mockApiService.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        })
      })
      
      expect(mockNavigate).toHaveBeenCalledWith('/map')
    })

    it('completes full signup flow', async () => {
      mockApiService.signup.mockResolvedValue({
        success: true,
        data: {
          user: mockUser,
          token: 'mock-token',
        },
      })

      render(<App />)
      
      // Navigate to signup page
      await userEvent.click(screen.getByText('Sign up here'))
      
      // Fill out signup form
      await userEvent.type(screen.getByLabelText('Display Name'), 'Test User')
      await userEvent.type(screen.getByLabelText('Email address'), 'test@example.com')
      await userEvent.type(screen.getByLabelText('Password'), 'password123')
      
      // Submit form
      await userEvent.click(screen.getByText('Create account'))
      
      await waitFor(() => {
        expect(mockApiService.signup).toHaveBeenCalledWith({
          displayName: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        })
      })
      
      expect(mockNavigate).toHaveBeenCalledWith('/map?welcome=true')
    })
  })

  describe('Map and Routes Integration', () => {
    it('loads and displays routes on map page', async () => {
      mockApiService.getRoutes.mockResolvedValue({
        success: true,
        data: {
          routes: [mockRoute],
          pagination: { page: 1, limit: 10, total: 1 },
        },
      })
      
      mockApiService.getScoresByRoute.mockResolvedValue({
        success: true,
        data: { score: mockScore },
      })

      render(<App />)
      
      // Navigate to map page
      await userEvent.click(screen.getAllByRole('link', { name: 'Map' })[0])
      
      await waitFor(() => {
        expect(screen.getByText('Nairobi Matatu Routes')).toBeInTheDocument()
        expect(screen.getAllByText('Route 42 - Thika Road')).toHaveLength(5) // Map popups (4) + sidebar (1)
      })
    })

    it('filters routes based on user selection', async () => {
      const highQualityRoute = { ...mockRoute, _id: '1', name: 'High Quality Route' }
      const lowQualityRoute = { ...mockRoute, _id: '2', name: 'Low Quality Route' }
      
      mockApiService.getRoutes.mockResolvedValue({
        success: true,
        data: {
          routes: [highQualityRoute, lowQualityRoute],
          pagination: { page: 1, limit: 10, total: 2 },
        },
      })
      
      mockApiService.getScoresByRoute
        .mockResolvedValueOnce({
          success: true,
          data: { score: { ...mockScore, reliability: 4.5, safety: 4.5 } },
        })
        .mockResolvedValueOnce({
          success: true,
          data: { score: { ...mockScore, reliability: 3.0, safety: 3.0 } },
        })

      render(<App />)
      
      // Navigate to map page
      await userEvent.click(screen.getAllByRole('link', { name: 'Map' })[0])
      
      await waitFor(() => {
        expect(screen.getByText('1 of 2 routes')).toBeInTheDocument() // Only high quality route passes filters
      })
      
      // Uncheck both filters to show all routes
      const highReliabilityCheckbox = screen.getByLabelText('High Reliability (4+ stars)')
      const safeRoutesCheckbox = screen.getByLabelText('Safe Routes (4+ stars)')
      
      await userEvent.click(highReliabilityCheckbox)
      await userEvent.click(safeRoutesCheckbox)
      
      await waitFor(() => {
        expect(screen.getByText('2 of 2 routes')).toBeInTheDocument() // Now both routes are shown
      })
    })
  })

  describe('Report Submission Flow', () => {
    it('completes full report submission flow', async () => {
      mockApiService.getRoutes.mockResolvedValue({
        success: true,
        data: {
          routes: [mockRoute],
          pagination: { page: 1, limit: 10, total: 1 },
        },
      })
      
      mockApiService.createReport.mockResolvedValue({
        success: true,
        data: mockReport,
      })

      render(<App />)
      
      // Navigate to report page
      await userEvent.click(screen.getAllByRole('link', { name: 'Report' })[0])
      
      await waitFor(() => {
        expect(screen.getByText('Report Your Trip')).toBeInTheDocument()
      })
      
      // Fill out report form
      await userEvent.selectOptions(screen.getByDisplayValue('Select a route'), '1')
      await userEvent.click(screen.getByDisplayValue('delay'))
      await userEvent.type(screen.getByPlaceholderText('Describe the issue in detail...'), 'Test report')
      
      // Submit form
      await userEvent.click(screen.getByText('Submit Report'))
      
      await waitFor(() => {
        expect(mockApiService.createReport).toHaveBeenCalledWith({
          routeId: '1',
          reportType: 'delay',
          description: 'Test report',
          location: {
            type: 'Point',
            coordinates: [36.8219, -1.2921],
          },
          severity: 'medium',
          isAnonymous: false,
        })
      })
      
      await waitFor(() => {
        expect(screen.getByText('Report submitted successfully! Redirecting to map...')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling Integration', () => {
    it('handles API errors gracefully across components', async () => {
      mockApiService.getRoutes.mockRejectedValue(new Error('API Error'))

      render(<App />)
      
      // Navigate to map page
      await userEvent.click(screen.getAllByRole('link', { name: 'Map' })[0])
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load routes. Please try again.')).toBeInTheDocument()
      })
      
      // Test retry functionality
      await userEvent.click(screen.getByText('Try Again'))
      
      expect(mockApiService.getRoutes).toHaveBeenCalledTimes(3) // Initial load + retry + potential re-render
    })

    it('handles authentication errors', async () => {
      mockApiService.login.mockRejectedValue(new Error('Invalid credentials'))

      render(<App />)
      
      // Navigate to login page
      await userEvent.click(screen.getAllByRole('link', { name: 'Login' })[0])
      
      // Fill out login form
      await userEvent.type(screen.getByLabelText('Email address'), 'test@example.com')
      await userEvent.type(screen.getByLabelText('Password'), 'wrongpassword')
      
      // Submit form
      await userEvent.click(screen.getByText('Sign in'))
      
      await waitFor(() => {
        expect(screen.getByText('Invalid email or password. Please try again.')).toBeInTheDocument()
      })
    })
  })

  describe('Navigation Integration', () => {
    it('navigates between all pages correctly', async () => {
      mockApiService.getRoutes.mockResolvedValue({
        success: true,
        data: { routes: [], pagination: {} },
      })

      render(<App />)
      
      // Test home page
      expect(screen.getAllByText('Smart Matatu')).toHaveLength(3) // Header + footer + title
      
      // Navigate to map
      await userEvent.click(screen.getAllByRole('link', { name: 'Map' })[0])
      expect(screen.getByText('Nairobi Matatu Routes')).toBeInTheDocument()
      
      // Navigate to report
      await userEvent.click(screen.getAllByRole('link', { name: 'Report' })[0])
      expect(screen.getByText('Report Your Trip')).toBeInTheDocument()
      
      // Navigate to login
      await userEvent.click(screen.getAllByRole('link', { name: 'Login' })[0])
      expect(screen.getByText('Welcome back')).toBeInTheDocument()
      
      // Navigate back to home
      await userEvent.click(screen.getByText('Back to home'))
      expect(screen.getAllByText('Smart Matatu')).toHaveLength(3) // Header + footer + title
    })
  })
})
