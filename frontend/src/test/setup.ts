import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import React from 'react'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test case
afterEach(() => {
  cleanup()
})

// Mock the API service module
vi.mock('../services/api', () => ({
  default: {
    getHealth: vi.fn(),
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    getRoutes: vi.fn(),
    getNearbyRoutes: vi.fn(),
    getRoute: vi.fn(),
    createRoute: vi.fn(),
    updateRoute: vi.fn(),
    deleteRoute: vi.fn(),
    getReports: vi.fn(),
    getReportsByRoute: vi.fn(),
    createReport: vi.fn(),
    updateReport: vi.fn(),
    deleteReport: vi.fn(),
    getScores: vi.fn(),
    getScoresByRoute: vi.fn(),
    getTopRoutes: vi.fn(),
    getWorstRoutes: vi.fn(),
    getAnalytics: vi.fn(),
    getUsers: vi.fn(),
    getUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
    uploadFile: vi.fn(),
    searchRoutes: vi.fn(),
    geocodeAddress: vi.fn(),
  },
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock Leaflet
vi.mock('leaflet', () => ({
  default: {
    icon: vi.fn(() => ({
      iconUrl: '',
      shadowUrl: '',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })),
    Marker: {
      prototype: {
        options: {
          icon: null
        }
      }
    }
  }
}))

// Mock react-leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'map-container' }, children),
  TileLayer: () => React.createElement('div', { 'data-testid': 'tile-layer' }),
  Marker: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'marker' }, children),
  Popup: ({ children }: { children: React.ReactNode }) => React.createElement('div', { 'data-testid': 'popup' }, children),
  Polyline: () => React.createElement('div', { 'data-testid': 'polyline' }),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock geolocation
Object.defineProperty(navigator, 'geolocation', {
  writable: true,
  value: {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
})

// Mock the optimized API hook
vi.mock('../hooks/useOptimizedApi', () => ({
  default: vi.fn((apiCall, dependencies, options) => {
    // Return mock data based on the API call
    const mockData = [
      {
        _id: '1',
        name: 'Route 42 - Thika Road',
        description: 'CBD to Thika via Thika Road',
        operator: 'KBS',
        routeNumber: '42',
        stops: [
          { name: 'CBD', coordinates: [-1.2921, 36.8219] },
          { name: 'Museum Hill', coordinates: [-1.2800, 36.8300] },
          { name: 'Garden City', coordinates: [-1.2400, 36.8700] },
          { name: 'Thika', coordinates: [-1.2200, 36.8900] },
        ],
        path: [
          [-1.2921, 36.8219],
          [-1.2800, 36.8300],
          [-1.2600, 36.8500],
          [-1.2400, 36.8700],
          [-1.2200, 36.8900],
        ],
        fare: 50,
        operatingHours: {
          start: '06:00',
          end: '22:00',
        },
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        score: {
          reliability: 4.2,
          safety: 4.5,
          punctuality: 4.0,
          comfort: 3.8,
          overall: 4.1,
          totalReports: 25,
          lastCalculated: '2024-01-01T00:00:00.000Z'
        }
      },
      {
        _id: '2',
        name: 'Route 17 - Waiyaki Way',
        description: 'CBD to Westlands via Waiyaki Way',
        operator: 'KBS',
        routeNumber: '17',
        stops: [
          { name: 'CBD', coordinates: [-1.2921, 36.8219] },
          { name: 'Westlands', coordinates: [-1.2700, 36.8000] },
        ],
        path: [
          [-1.2921, 36.8219],
          [-1.2700, 36.8000],
        ],
        fare: 30,
        operatingHours: {
          start: '06:00',
          end: '22:00',
        },
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        score: {
          reliability: 3.0,
          safety: 3.0,
          punctuality: 3.0,
          comfort: 3.0,
          overall: 3.0,
          totalReports: 10,
          lastCalculated: '2024-01-01T00:00:00.000Z'
        }
      }
    ]
    
    return {
      data: mockData,
      loading: false,
      error: null,
      retryCount: 0,
      refetch: vi.fn(),
      clearCache: vi.fn()
    }
  })
}))
