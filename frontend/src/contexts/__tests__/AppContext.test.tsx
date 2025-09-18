import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AppProvider, useApp } from '../AppContext'
import { mockUser } from '../../test/utils'
import apiService from '../../services/api'

const mockApiService = vi.mocked(apiService)

// Test component that uses the context
const TestComponent = () => {
  const { state, setUser, logout, setLanguage } = useApp()
  
  return (
    <div>
      <div data-testid="user">{state.user ? state.user.email : 'No user'}</div>
      <div data-testid="language">{state.language}</div>
      <button onClick={() => setUser(mockUser)}>Login</button>
      <button onClick={logout}>Logout</button>
      <button onClick={() => setLanguage('sw')}>Set Swahili</button>
    </div>
  )
}

describe('AppContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('provides initial state', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    )

    expect(screen.getByTestId('user')).toHaveTextContent('No user')
    expect(screen.getByTestId('language')).toHaveTextContent('en')
  })

  it('loads user from API on mount', async () => {
    mockApiService.getCurrentUser.mockResolvedValue(mockUser)

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    )

    await waitFor(() => {
      expect(mockApiService.getCurrentUser).toHaveBeenCalled()
    })
  })

  it('handles API error when loading user', async () => {
    mockApiService.getCurrentUser.mockRejectedValue(new Error('API Error'))

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No user')
    })
  })

  it('logs in user', async () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    )

    const loginButton = screen.getByText('Login')
    await loginButton.click()

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email)
    })
  })

  it('logs out user', async () => {
    // Start with logged in user
    mockApiService.getCurrentUser.mockResolvedValue(mockUser)

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(mockUser.email)
    })

    const logoutButton = screen.getByText('Logout')
    await logoutButton.click()

    expect(screen.getByTestId('user')).toHaveTextContent('No user')
  })

  it('changes language', async () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    )

    expect(screen.getByTestId('language')).toHaveTextContent('en')

    const languageButton = screen.getByText('Set Swahili')
    await languageButton.click()

    expect(screen.getByTestId('language')).toHaveTextContent('sw')
  })

  it('persists language in localStorage', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    )

    const languageButton = screen.getByText('Set Swahili')
    await languageButton.click()

    expect(setItemSpy).toHaveBeenCalledWith('appSettings', expect.stringContaining('"language":"sw"'))
  })

  it('loads language from localStorage on mount', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem')
    getItemSpy.mockReturnValue(JSON.stringify({
      language: 'sw',
      notifications: { email: true, push: true, safety: true, updates: true },
      privacy: { shareLocation: true, shareReports: true, analytics: true },
      display: { theme: 'auto', mapStyle: 'default' }
    }))

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    )

    expect(screen.getByTestId('language')).toHaveTextContent('sw')
  })

  it('handles invalid language from localStorage', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem')
    getItemSpy.mockReturnValue('invalid')

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    )

    expect(screen.getByTestId('language')).toHaveTextContent('en')
  })
})
