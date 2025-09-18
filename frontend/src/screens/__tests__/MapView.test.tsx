import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, mockRoute, mockScore } from '../../test/utils'
import MapView from '../MapView'
import apiService from '../../services/api'

const mockApiService = vi.mocked(apiService)

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

describe('MapView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', () => {
    mockApiService.getRoutes.mockResolvedValue({
      success: true,
      data: { routes: [], pagination: {} },
    })

    render(<MapView />)
    
    expect(screen.getByText('Loading routes...')).toBeInTheDocument()
  })

  it('renders error state when API fails', async () => {
    mockApiService.getRoutes.mockRejectedValue(new Error('API Error'))

    render(<MapView />)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load routes. Please try again.')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Try Again')).toBeInTheDocument()
  })

  it('renders routes successfully', async () => {
    const mockRoutes = [mockRoute]
    mockApiService.getRoutes.mockResolvedValue({
      success: true,
      data: { routes: mockRoutes, pagination: {} },
    })
    mockApiService.getScoresByRoute.mockResolvedValue({
      success: true,
      data: { score: mockScore },
    })

    render(<MapView />)
    
    await waitFor(() => {
      expect(screen.getByText('Nairobi Matatu Routes')).toBeInTheDocument()
    })
    
    expect(screen.getAllByText('Route 42 - Thika Road')).toHaveLength(5) // Map popup (4 stops) + sidebar (1)
    expect(screen.getAllByText('KBS')).toHaveLength(5) // Map popups (4) + sidebar (1)
    expect(screen.getAllByText('4.1')).toHaveLength(5) // Overall score in map popups (4) + sidebar (1)
  })

  it('filters routes based on filter settings', async () => {
    const mockRoutes = [
      { ...mockRoute, _id: '1', name: 'High Quality Route' },
      { ...mockRoute, _id: '2', name: 'Low Quality Route' },
    ]
    
    mockApiService.getRoutes.mockResolvedValue({
      success: true,
      data: { routes: mockRoutes, pagination: {} },
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

    render(<MapView />)
    
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
    
    // Verify both routes are visible
    expect(screen.getAllByText('High Quality Route')).toHaveLength(5) // Map popups (4) + sidebar (1)
    expect(screen.getAllByText('Low Quality Route')).toHaveLength(5) // Map popups (4) + sidebar (1)
  })

  it('allows selecting a route', async () => {
    const mockRoutes = [mockRoute]
    mockApiService.getRoutes.mockResolvedValue({
      success: true,
      data: { routes: mockRoutes, pagination: {} },
    })
    mockApiService.getScoresByRoute.mockResolvedValue({
      success: true,
      data: { score: mockScore },
    })

    render(<MapView />)
    
    await waitFor(() => {
      expect(screen.getAllByText('Route 42 - Thika Road')[0]).toBeInTheDocument()
    })
    
    // Click on route in the sidebar (the h4 element in the sidebar)
    const sidebarRouteElement = screen.getByRole('heading', { name: 'Route 42 - Thika Road' })
    await userEvent.click(sidebarRouteElement)
    
    await waitFor(() => {
      expect(screen.getByText('Route Details')).toBeInTheDocument()
    })
  })

  it('displays route details when route is selected', async () => {
    const mockRoutes = [mockRoute]
    mockApiService.getRoutes.mockResolvedValue({
      success: true,
      data: { routes: mockRoutes, pagination: {} },
    })
    mockApiService.getScoresByRoute.mockResolvedValue({
      success: true,
      data: { score: mockScore },
    })

    render(<MapView />)
    
    await waitFor(() => {
      expect(screen.getAllByText('Route 42 - Thika Road')[0]).toBeInTheDocument()
    })
    
    // Click on route in the sidebar
    const sidebarRouteElement = screen.getByRole('heading', { name: 'Route 42 - Thika Road' })
    await userEvent.click(sidebarRouteElement)
    
    await waitFor(() => {
      expect(screen.getByText('Route Details')).toBeInTheDocument()
      expect(screen.getAllByText('KBS')).toHaveLength(6) // Map popups (4) + sidebar (1) + details (1)
      expect(screen.getAllByText('4.2')).toHaveLength(1) // Reliability score in details
      expect(screen.getAllByText('4.5')).toHaveLength(6) // Safety score in map popups (4) + sidebar (1) + details (1)
      expect(screen.getAllByText('KES 50')).toHaveLength(2) // Sidebar + details
      expect(screen.getByText('4 stops')).toBeInTheDocument()
    })
  })

  it('handles retry when API fails', async () => {
    mockApiService.getRoutes
      .mockRejectedValueOnce(new Error('API Error'))
      .mockResolvedValueOnce({
        success: true,
        data: { routes: [mockRoute], pagination: {} },
      })
    
    mockApiService.getScoresByRoute.mockResolvedValue({
      success: true,
      data: { score: mockScore },
    })

    render(<MapView />)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load routes. Please try again.')).toBeInTheDocument()
    })
    
    // Click retry button
    await userEvent.click(screen.getByText('Try Again'))
    
    await waitFor(() => {
      expect(screen.getAllByText('Route 42 - Thika Road')[0]).toBeInTheDocument()
    })
  })
})
