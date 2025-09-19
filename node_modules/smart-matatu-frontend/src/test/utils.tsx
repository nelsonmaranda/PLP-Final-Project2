import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AppProvider } from '../contexts/AppContext'
import { vi } from 'vitest'

// Mock API service
export const mockApiService = {
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
}

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <AppProvider>
        {children}
      </AppProvider>
    </BrowserRouter>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Mock data for tests
export const mockRoute = {
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
}

export const mockScore = {
  _id: '1',
  routeId: '1',
  reliability: 4.2,
  safety: 4.5,
  punctuality: 4.0,
  comfort: 3.8,
  overall: 4.1,
  totalReports: 25,
  lastCalculated: '2024-01-01T00:00:00.000Z',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

export const mockUser = {
  _id: '1',
  email: 'test@example.com',
  displayName: 'Test User',
  role: 'user' as const,
  savedRoutes: [],
  isActive: true,
  lastLogin: '2024-01-01T00:00:00.000Z',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

export const mockReport = {
  _id: '1',
  userId: '1',
  routeId: '1',
  reportType: 'delay',
  description: 'Bus was 15 minutes late',
  location: {
    type: 'Point',
    coordinates: [-1.2921, 36.8219],
  },
  severity: 'medium',
  status: 'pending',
  isAnonymous: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}
