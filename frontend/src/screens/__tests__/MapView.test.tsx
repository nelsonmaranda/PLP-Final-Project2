import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, mockRoute, mockScore } from '../../test/utils'
import MapView from '../MapView'
import apiService from '../../services/api'
import useOptimizedApi from '../../hooks/useOptimizedApi'

const mockApiService = vi.mocked(apiService)
const mockUseOptimizedApi = vi.mocked(useOptimizedApi as unknown as (typeof useOptimizedApi))

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
    mockUseOptimizedApi.mockReturnValue({
      data: null,
      loading: true,
      error: null,
      retryCount: 0,
      refetch: vi.fn(),
      clearCache: vi.fn(),
    } as any)

    render(<MapView />)

    expect(screen.getByText('Loading routes...')).toBeInTheDocument()
  })

  it('renders error state when API fails', async () => {
    mockUseOptimizedApi.mockReturnValue({
      data: null,
      loading: false,
      error: new Error('Failed to load routes. Please try again.'),
      retryCount: 0,
      refetch: vi.fn(),
      clearCache: vi.fn(),
    } as any)

    render(<MapView />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load routes. Please try again.')).toBeInTheDocument()
    })

    expect(screen.getByText('Try Again')).toBeInTheDocument()
  })

  it('renders routes successfully', async () => {
    const mockRoutes = [{ ...mockRoute, score: mockScore }]

    mockUseOptimizedApi.mockReturnValue({
      data: mockRoutes as any,
      loading: false,
      error: null,
      retryCount: 0,
      refetch: vi.fn(),
      clearCache: vi.fn(),
    } as any)

    render(<MapView />)

    await screen.findByText('Nairobi Matatu Routes')

    expect(screen.getAllByText('Route 42 - Thika Road').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('KBS').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('4.1').length).toBeGreaterThanOrEqual(1)
  })

  it('filters routes based on filter settings', async () => {
    const high = { ...mockRoute, _id: '1', name: 'High Quality Route', score: { ...mockScore, reliability: 4.5, safety: 4.5 } }
    const low  = { ...mockRoute, _id: '2', name: 'Low Quality Route', score: { ...mockScore, reliability: 3.0, safety: 3.0 } }

    mockUseOptimizedApi.mockReturnValue({
      data: [high, low] as any,
      loading: false,
      error: null,
      retryCount: 0,
      refetch: vi.fn(),
      clearCache: vi.fn(),
    } as any)

    render(<MapView />)

    await screen.findByText('1 of 2 routes')

    const highReliabilityCheckbox = screen.getByLabelText('High Reliability (4+ stars)')
    const safeRoutesCheckbox = screen.getByLabelText('Safe Routes (4+ stars)')

    await userEvent.click(highReliabilityCheckbox)
    await userEvent.click(safeRoutesCheckbox)

    await screen.findByText('2 of 2 routes')

    expect(screen.getAllByText('High Quality Route').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Low Quality Route').length).toBeGreaterThanOrEqual(1)
  }, 10000)

  it('allows selecting a route', async () => {
    mockUseOptimizedApi.mockReturnValue({
      data: [{ ...mockRoute, score: mockScore }] as any,
      loading: false,
      error: null,
      retryCount: 0,
      refetch: vi.fn(),
      clearCache: vi.fn(),
    } as any)

    render(<MapView />)

    await waitFor(() => {
      expect(screen.getAllByText('Route 42 - Thika Road')[0]).toBeInTheDocument()
    })

    const routeButton = screen.getByRole('button', { name: /select route route 42 - thika road by kbs/i })
    await userEvent.click(routeButton)

    await waitFor(() => {
      expect(screen.getByText('Route Details')).toBeInTheDocument()
    })
  }, 10000)

  it('displays route details when route is selected', async () => {
    mockUseOptimizedApi.mockReturnValue({
      data: [{ ...mockRoute, score: mockScore }] as any,
      loading: false,
      error: null,
      retryCount: 0,
      refetch: vi.fn(),
      clearCache: vi.fn(),
    } as any)

    render(<MapView />)

    await waitFor(() => {
      expect(screen.getAllByText('Route 42 - Thika Road')[0]).toBeInTheDocument()
    })

    const routeButton = screen.getByRole('button', { name: /select route route 42 - thika road by kbs/i })
    await userEvent.click(routeButton)

    await waitFor(() => {
      expect(screen.getByText('Route Details')).toBeInTheDocument()
    })
    expect(screen.getAllByText('KBS').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('4.2').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('4.5').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('KES 50').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('4 stops')).toBeInTheDocument()
  }, 10000)

  it('handles retry when API fails', async () => {
    const refetch = vi.fn()

    // First render: error
    mockUseOptimizedApi.mockReturnValueOnce({
      data: null,
      loading: false,
      error: new Error('Failed to load routes. Please try again.'),
      retryCount: 0,
      refetch,
      clearCache: vi.fn(),
    } as any)

    // Second render after refetch: data
    mockUseOptimizedApi.mockReturnValueOnce({
      data: [{ ...mockRoute, score: mockScore }] as any,
      loading: false,
      error: null,
      retryCount: 0,
      refetch: vi.fn(),
      clearCache: vi.fn(),
    } as any)

    render(<MapView />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load routes. Please try again.')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByText('Try Again'))
    expect(refetch).toHaveBeenCalled()
  })
})
