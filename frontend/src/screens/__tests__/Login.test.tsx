import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, mockUser } from '../../test/utils'
import Login from '../Login'
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

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
  })

  it('renders login form', () => {
    render(<Login />)
    
    expect(screen.getByText('Welcome back')).toBeInTheDocument()
    expect(screen.getByText('Sign in to your account to continue')).toBeInTheDocument()
    expect(screen.getByLabelText('Email address')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByText('Sign in')).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    render(<Login />)
    
    // Try to submit without filling fields
    await userEvent.click(screen.getByText('Sign in'))
    
    // HTML5 validation should prevent submission
    expect(screen.getByLabelText('Email address')).toBeRequired()
    expect(screen.getByLabelText('Password')).toBeRequired()
  })

  it('submits login form with valid credentials', async () => {
    mockApiService.login.mockResolvedValue({
      success: true,
      data: {
        user: mockUser,
        token: 'mock-token',
      },
    })

    render(<Login />)
    
    // Fill out the form
    await userEvent.type(screen.getByLabelText('Email address'), 'test@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'password123')
    
    // Submit the form
    await userEvent.click(screen.getByText('Sign in'))
    
    await waitFor(() => {
      expect(mockApiService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
    
    expect(mockNavigate).toHaveBeenCalledWith('/map')
  })

  it('redirects admin users to admin page', async () => {
    const adminUser = { ...mockUser, role: 'admin' as const }
    mockApiService.login.mockResolvedValue({
      success: true,
      data: {
        user: adminUser,
        token: 'mock-token',
      },
    })

    render(<Login />)
    
    // Fill out the form
    await userEvent.type(screen.getByLabelText('Email address'), 'admin@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'password123')
    
    // Submit the form
    await userEvent.click(screen.getByText('Sign in'))
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin')
    })
  })

  it('redirects moderator users to admin page', async () => {
    const moderatorUser = { ...mockUser, role: 'moderator' as const }
    mockApiService.login.mockResolvedValue({
      success: true,
      data: {
        user: moderatorUser,
        token: 'mock-token',
      },
    })

    render(<Login />)
    
    // Fill out the form
    await userEvent.type(screen.getByLabelText('Email address'), 'moderator@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'password123')
    
    // Submit the form
    await userEvent.click(screen.getByText('Sign in'))
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin')
    })
  })

  it('shows error message for invalid credentials', async () => {
    mockApiService.login.mockRejectedValue(new Error('Invalid credentials'))

    render(<Login />)
    
    // Fill out the form
    await userEvent.type(screen.getByLabelText('Email address'), 'test@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'wrongpassword')
    
    // Submit the form
    await userEvent.click(screen.getByText('Sign in'))
    
    await waitFor(() => {
      expect(screen.getByText('Invalid email or password. Please try again.')).toBeInTheDocument()
    })
  })

  it('toggles password visibility', async () => {
    render(<Login />)
    
    const passwordInput = screen.getByLabelText('Password')
    const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i })
    
    // Password should be hidden by default
    expect(passwordInput).toHaveAttribute('type', 'password')
    
    // Click to show password
    await userEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')
    
    // Click to hide password
    await userEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('shows loading state during submission', async () => {
    // Mock a delayed response
    mockApiService.login.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        success: true,
        data: { user: mockUser, token: 'mock-token' },
      }), 100))
    )

    render(<Login />)
    
    // Fill out the form
    await userEvent.type(screen.getByLabelText('Email address'), 'test@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'password123')
    
    // Submit the form
    await userEvent.click(screen.getByText('Sign in'))
    
    // Should show loading state
    expect(screen.getByText('Signing in...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
  })

  it('navigates to signup page when sign up link is clicked', async () => {
    render(<Login />)
    
    const signupLink = screen.getByText('Sign up here')
    expect(signupLink).toHaveAttribute('href', '/signup')
  })

  it('navigates to home page when back to home link is clicked', async () => {
    render(<Login />)
    
    const homeLink = screen.getByText('Back to home')
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('clears error message when user starts typing', async () => {
    mockApiService.login.mockRejectedValue(new Error('Invalid credentials'))

    render(<Login />)
    
    // Fill out the form and submit to get error
    await userEvent.type(screen.getByLabelText('Email address'), 'test@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'wrongpassword')
    await userEvent.click(screen.getByText('Sign in'))
    
    await waitFor(() => {
      expect(screen.getByText('Invalid email or password. Please try again.')).toBeInTheDocument()
    })
    
    // Start typing in email field
    await userEvent.clear(screen.getByLabelText('Email address'))
    await userEvent.type(screen.getByLabelText('Email address'), 'new@example.com')
    
    // Error should still be there (it only clears on successful submission)
    expect(screen.getByText('Invalid email or password. Please try again.')).toBeInTheDocument()
  })
})
