import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, mockRoute, mockReport } from '../../test/utils'
import ReportForm from '../ReportForm'
import apiService from '../../services/api'

const mockApiService = vi.mocked(apiService)

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('ReportForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
  })

  it('renders loading state initially', () => {
    mockApiService.getRoutes.mockResolvedValue({
      success: true,
      data: { routes: [], pagination: {} },
    })

    render(<ReportForm />)
    
    expect(screen.getByText('Loading routes...')).toBeInTheDocument()
  })

  it('renders error state when routes fail to load', async () => {
    mockApiService.getRoutes.mockRejectedValue(new Error('API Error'))

    render(<ReportForm />)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load routes. Please try again.')).toBeInTheDocument()
    })
  })

  it('renders form with route options', async () => {
    const mockRoutes = [mockRoute]
    mockApiService.getRoutes.mockResolvedValue({
      success: true,
      data: { routes: mockRoutes, pagination: {} },
    })

    render(<ReportForm />)
    
    await waitFor(() => {
      expect(screen.getByText('Report Your Trip')).toBeInTheDocument()
      expect(screen.getByText('Help other commuters by sharing your matatu experience')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Route 42 - Thika Road - KBS')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    const mockRoutes = [mockRoute]
    mockApiService.getRoutes.mockResolvedValue({
      success: true,
      data: { routes: mockRoutes, pagination: {} },
    })

    render(<ReportForm />)
    
    await waitFor(() => {
      expect(screen.getByText('Report Your Trip')).toBeInTheDocument()
    })
    
    // Try to submit without selecting a route
    await userEvent.click(screen.getByText('Submit Report'))
    
    await waitFor(() => {
      expect(screen.getByText('Please select a route')).toBeInTheDocument()
    })
  })

  it('submits report successfully', async () => {
    const mockRoutes = [mockRoute]
    mockApiService.getRoutes.mockResolvedValue({
      success: true,
      data: { routes: mockRoutes, pagination: {} },
    })
    
    mockApiService.createReport.mockResolvedValue({
      success: true,
      data: mockReport,
    })

    render(<ReportForm />)
    
    await waitFor(() => {
      expect(screen.getByText('Report Your Trip')).toBeInTheDocument()
    })
    
    // Fill out the form
    await userEvent.selectOptions(screen.getByDisplayValue('Select a route'), '1')
    await userEvent.click(screen.getByDisplayValue('delay'))
    await userEvent.type(screen.getByPlaceholderText('Describe the issue in detail...'), 'Test report')
    
    // Submit the form
    await userEvent.click(screen.getByText('Submit Report'))
    
    await waitFor(() => {
      expect(screen.getByText('Report submitted successfully! Redirecting to map...')).toBeInTheDocument()
    })
    
    // Should redirect after 2 seconds
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/map?success=report-submitted')
    }, { timeout: 3000 })
  })

  it('handles submission error', async () => {
    const mockRoutes = [mockRoute]
    mockApiService.getRoutes.mockResolvedValue({
      success: true,
      data: { routes: mockRoutes, pagination: {} },
    })
    
    mockApiService.createReport.mockRejectedValue(new Error('Submission failed'))

    render(<ReportForm />)
    
    await waitFor(() => {
      expect(screen.getByText('Report Your Trip')).toBeInTheDocument()
    })
    
    // Fill out the form
    await userEvent.selectOptions(screen.getByDisplayValue('Select a route'), '1')
    await userEvent.click(screen.getByDisplayValue('delay'))
    await userEvent.type(screen.getByPlaceholderText('Describe the issue in detail...'), 'Test report')
    
    // Submit the form
    await userEvent.click(screen.getByText('Submit Report'))
    
    await waitFor(() => {
      expect(screen.getByText('Failed to submit report. Please try again.')).toBeInTheDocument()
    })
  })

  it('updates location when get current location is clicked', async () => {
    const mockRoutes = [mockRoute]
    mockApiService.getRoutes.mockResolvedValue({
      success: true,
      data: { routes: mockRoutes, pagination: {} },
    })

    // Mock geolocation
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) => {
        success({
          coords: {
            latitude: -1.2921,
            longitude: 36.8219,
          },
        })
      }),
    }
    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
    })

    render(<ReportForm />)
    
    await waitFor(() => {
      expect(screen.getByText('Report Your Trip')).toBeInTheDocument()
    })
    
    // Click get current location
    await userEvent.click(screen.getByText('Use Current Location'))
    
    await waitFor(() => {
      expect(screen.getByText('-1.2921, 36.8219')).toBeInTheDocument()
    })
  })

  it('handles geolocation error', async () => {
    const mockRoutes = [mockRoute]
    mockApiService.getRoutes.mockResolvedValue({
      success: true,
      data: { routes: mockRoutes, pagination: {} },
    })

    // Mock geolocation error
    const mockGeolocation = {
      getCurrentPosition: vi.fn((_success, error) => {
        error(new Error('Geolocation error'))
      }),
    }
    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
    })

    render(<ReportForm />)
    
    await waitFor(() => {
      expect(screen.getByText('Report Your Trip')).toBeInTheDocument()
    })
    
    // Click get current location
    await userEvent.click(screen.getByText('Use Current Location'))
    
    await waitFor(() => {
      expect(screen.getByText('Failed to get current location')).toBeInTheDocument()
    })
  })

  it('toggles anonymous reporting', async () => {
    const mockRoutes = [mockRoute]
    mockApiService.getRoutes.mockResolvedValue({
      success: true,
      data: { routes: mockRoutes, pagination: {} },
    })

    render(<ReportForm />)
    
    await waitFor(() => {
      expect(screen.getByText('Report Your Trip')).toBeInTheDocument()
    })
    
    const anonymousCheckbox = screen.getByLabelText('Submit anonymously')
    expect(anonymousCheckbox).not.toBeChecked()
    
    await userEvent.click(anonymousCheckbox)
    expect(anonymousCheckbox).toBeChecked()
  })

  it('shows character count for description', async () => {
    const mockRoutes = [mockRoute]
    mockApiService.getRoutes.mockResolvedValue({
      success: true,
      data: { routes: mockRoutes, pagination: {} },
    })

    render(<ReportForm />)
    
    await waitFor(() => {
      expect(screen.getByText('Report Your Trip')).toBeInTheDocument()
    })
    
    const descriptionTextarea = screen.getByPlaceholderText('Describe the issue in detail...')
    await userEvent.type(descriptionTextarea, 'Test description')
    
    expect(screen.getByText('16/500 characters')).toBeInTheDocument()
  })
})
