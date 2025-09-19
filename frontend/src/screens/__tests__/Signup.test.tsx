import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, mockUser } from '../../test/utils'
import Signup from '../Signup'
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

describe('Signup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
  })

  it('renders signup form', () => {
    render(<Signup />)
    
    expect(screen.getByText('Create your account')).toBeInTheDocument()
    expect(screen.getByText('Join thousands of Nairobi commuters')).toBeInTheDocument()
    expect(screen.getByLabelText('Display Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email address')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByText('Create account')).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    render(<Signup />)
    
    // Fill in invalid email to trigger validation
    await userEvent.type(screen.getByLabelText('Email address'), 'invalid-email')
    
    // Submit form using fireEvent.submit directly on the form
    const form = document.querySelector('form')
    fireEvent.submit(form!)
    
    await waitFor(() => {
      expect(screen.getByTestId('displayName-error')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByTestId('email-error')).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByTestId('password-error')).toBeInTheDocument()
    })
  })

  it('validates email format', async () => {
    render(<Signup />)
    
    // Fill out form with invalid email
    await userEvent.type(screen.getByLabelText('Display Name'), 'Test User')
    await userEvent.type(screen.getByLabelText('Email address'), 'invalid-email')
    await userEvent.type(screen.getByLabelText('Password'), 'password123')
    
    const form = document.querySelector('form')
    fireEvent.submit(form!)
    
    await waitFor(() => {
      expect(screen.getByTestId('email-error')).toBeInTheDocument()
    })
  })

  it('validates password length', async () => {
    render(<Signup />)
    
    // Fill out form with short password
    await userEvent.type(screen.getByLabelText('Display Name'), 'Test User')
    await userEvent.type(screen.getByLabelText('Email address'), 'test@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'short')
    
    const form = document.querySelector('form')
    fireEvent.submit(form!)
    
    await waitFor(() => {
      expect(screen.getByTestId('password-error')).toBeInTheDocument()
    })
  })

  it('submits signup form with valid data', async () => {
    mockApiService.signup.mockResolvedValue({
      success: true,
      data: {
        user: mockUser,
        token: 'mock-token',
      },
    })

    render(<Signup />)
    
    // Fill out the form
    await userEvent.type(screen.getByLabelText('Display Name'), 'Test User')
    await userEvent.type(screen.getByLabelText('Email address'), 'test@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'password123')
    
    // Submit the form
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

  it('shows error message for signup failure', async () => {
    mockApiService.signup.mockRejectedValue(new Error('Signup failed'))

    render(<Signup />)
    
    // Fill out the form
    await userEvent.type(screen.getByLabelText('Display Name'), 'Test User')
    await userEvent.type(screen.getByLabelText('Email address'), 'test@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'password123')
    
    // Submit the form
    await userEvent.click(screen.getByText('Create account'))
    
    await waitFor(() => {
      expect(screen.getByText('Failed to create account. Please try again.')).toBeInTheDocument()
    })
  })

  it('toggles password visibility', async () => {
    render(<Signup />)
    
    const passwordInput = screen.getByLabelText('Password')
    const toggleButton = screen.getByRole('button', { name: /show password/i })
    
    // Password should be hidden by default
    expect(passwordInput).toHaveAttribute('type', 'password')
    
    // Click to show password
    await userEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')
    
    // Click to hide password
    await userEvent.click(screen.getByRole('button', { name: /hide password/i }))
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('shows password requirements', async () => {
    render(<Signup />)
    
    const passwordInput = screen.getByLabelText('Password')
    
    // Type a password to trigger requirements display
    await userEvent.type(passwordInput, 'Test123')
    
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument()
    expect(screen.getByText('Contains uppercase letter')).toBeInTheDocument()
    expect(screen.getByText('Contains lowercase letter')).toBeInTheDocument()
    expect(screen.getByText('Contains number')).toBeInTheDocument()
  })

  it('shows loading state during submission', async () => {
    // Mock a delayed response
    mockApiService.signup.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        success: true,
        data: { user: mockUser, token: 'mock-token' },
      }), 100))
    )

    render(<Signup />)
    
    // Fill out the form
    await userEvent.type(screen.getByLabelText('Display Name'), 'Test User')
    await userEvent.type(screen.getByLabelText('Email address'), 'test@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'password123')
    
    // Submit the form
    await userEvent.click(screen.getByText('Create account'))
    
    // Should show loading state
    expect(screen.getByText('Creating account...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled()
  })

  it('navigates to login page when sign in link is clicked', async () => {
    render(<Signup />)
    
    const loginLink = screen.getByText('Sign in here')
    expect(loginLink).toHaveAttribute('href', '/login')
  })

  it('navigates to home page when back to home link is clicked', async () => {
    render(<Signup />)
    
    const homeLink = screen.getByText('Back to home')
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('clears validation errors when user starts typing', async () => {
    render(<Signup />)
    
    // Fill in invalid email to trigger validation
    await userEvent.type(screen.getByLabelText('Email address'), 'invalid-email')
    
    // Submit form to get validation errors
    const form = document.querySelector('form')
    fireEvent.submit(form!)
    
    await waitFor(() => {
      expect(screen.getByTestId('displayName-error')).toBeInTheDocument()
    })
    
    // Start typing in display name field
    await userEvent.type(screen.getByLabelText('Display Name'), 'Test')
    
    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByTestId('displayName-error')).not.toBeInTheDocument()
    })
  })

  it('validates password requirements in real-time', async () => {
    render(<Signup />)
    
    const passwordInput = screen.getByLabelText('Password')
    
    // Type password that meets some requirements
    await userEvent.type(passwordInput, 'Test')
    
    // Check requirements
    const requirements = screen.getAllByText(/At least 8 characters|Contains uppercase letter|Contains lowercase letter|Contains number/)
    
    // Should show which requirements are met/not met
    expect(requirements).toHaveLength(4)
  })
})
