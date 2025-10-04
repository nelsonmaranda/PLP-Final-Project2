import { useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Check, AlertCircle, Loader2 } from 'lucide-react'
import apiService from '../services/api'
import { SignupFormData } from '../types'
import { useApp } from '../contexts/AppContext'
import RoleSelector from '../components/RoleSelector'
import { useTranslation } from '../hooks/useTranslation'

export default function Signup() {
  const { setUser, state } = useApp()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [selectedRole, setSelectedRole] = useState('user')
  const [formData, setFormData] = useState<SignupFormData>({
    displayName: '',
    email: '',
    password: ''
  })
  const [organization, setOrganization] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
    
    // Clear global error and success when user starts typing (debounced)
    if (error) {
      setError(null)
    }
    if (success) {
      setSuccess(false)
    }
  }, [errors, error, success])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false) // Clear any previous success state

    try {
      // Add role and organization to form data
      const signupData = {
        ...formData,
        role: selectedRole,
        organization: organization
      }
      
      const response = await apiService.signup(signupData)
      
      // Strict validation: must have success=true, data object, user object, and token
      if (response.success && response.data && response.data.user && response.data.token) {
        // Update user state in context directly from signup response
        setUser(response.data.user)
        // Show success message and reset form
        setSuccess(true)
        setFormData({
          displayName: '',
          email: '',
          password: ''
        })
        setSelectedRole('user')
        // Redirect to home page after successful signup
        setTimeout(() => {
          navigate('/')
        }, 1500) // Wait 1.5 seconds to show success message
      } else if (response.success && response.data && response.data.user && !response.data.token) {
        // Email verification flow
        setSuccess(true)
        setError(null)
        setFormData({ displayName: '', email: '', password: '' })
        setSelectedRole('user')
        setTimeout(() => navigate('/login'), 1500)
      } else {
        setError('Registration failed. Please check your information and try again.')
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError('Failed to create account. Please check your information and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const passwordRequirements = [
    { text: 'At least 8 characters', met: formData.password.length >= 8 },
    { text: 'Contains uppercase letter', met: /[A-Z]/.test(formData.password) },
    { text: 'Contains lowercase letter', met: /[a-z]/.test(formData.password) },
    { text: 'Contains number', met: /\d/.test(formData.password) },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Smart Matatu</span>
          </Link>
        </div>
        <h1 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Create your account
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join thousands of Nairobi commuters
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card">
          <div className="card-content">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert" aria-live="polite">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg" role="alert" aria-live="polite">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Check className="h-5 w-5 text-green-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Account created! We sent a verification link to your email. Please open your inbox and click the link to activate your account, then return here to sign in.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Display Name */}
              <div className="form-group">
                <label htmlFor="displayName" className="form-label">
                  {t('auth.displayName')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    autoComplete="name"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className={`form-input pl-10 ${errors.displayName ? 'border-red-500' : ''}`}
                    placeholder="Enter your display name"
                    aria-describedby={errors.displayName ? 'displayName-error' : 'displayName-help'}
                    aria-invalid={!!errors.displayName}
                  />
                </div>
                {errors.displayName && (
                  <p className="form-error" data-testid="displayName-error" id="displayName-error" role="alert">{errors.displayName}</p>
                )}
                <p id="displayName-help" className="sr-only">Enter your display name as it will appear to other users</p>
              </div>

              {/* Email */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`form-input pl-10 ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="Enter your email"
                    aria-describedby={errors.email ? 'email-error' : 'email-help'}
                    aria-invalid={!!errors.email}
                  />
                </div>
                {errors.email && (
                  <p className="form-error" data-testid="email-error" id="email-error" role="alert">{errors.email}</p>
                )}
                <p id="email-help" className="sr-only">Enter your email address for account verification</p>
              </div>

              {/* Password */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`form-input pl-10 pr-10 ${errors.password ? 'border-red-500' : ''}`}
                    placeholder="Create a password"
                    aria-describedby={errors.password ? 'password-error' : 'password-help'}
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="form-error" data-testid="password-error" id="password-error" role="alert">{errors.password}</p>
                )}
                <p id="password-help" className="sr-only">Create a password with at least 8 characters</p>
                
                {/* Password Requirements */}
                {formData.password && (
                  <div className="mt-2 space-y-1">
                    {passwordRequirements.map((req, index) => (
                      <div key={index} className="flex items-center text-xs">
                        <Check className={`w-3 h-3 mr-2 ${req.met ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className={req.met ? 'text-green-600' : 'text-gray-500'}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Role Selection */}
              <div className="form-group">
                <RoleSelector
                  selectedRole={selectedRole}
                  onRoleChange={setSelectedRole}
                  language={state.language}
                />
              </div>

              {/* Organization Field - Show for roles that require approval */}
              {['sacco', 'authority'].includes(selectedRole) && (
                <div className="form-group">
                  <label htmlFor="organization" className="form-label">
                    Organization Name
                  </label>
                  <input
                    id="organization"
                    name="organization"
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="form-input"
                    placeholder="Enter your organization name"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This helps us verify your role request
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full"
                  aria-label={isLoading ? 'Creating account...' : 'Create your account'}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                      Creating account...
                    </>
                  ) : (
                    'Create account'
                  )}
                </button>
              </div>

              {/* Sign In Link */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
