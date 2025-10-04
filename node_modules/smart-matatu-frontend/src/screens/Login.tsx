import { useState, useCallback, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle, Loader2, Check } from 'lucide-react'
import apiService from '../services/api'
import { LoginFormData } from '../types'
import { useApp } from '../contexts/AppContext'
import { useTranslation } from '../hooks/useTranslation'

export default function Login() {
  const { setUser } = useApp()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [verifyBanner, setVerifyBanner] = useState<'success' | 'failed' | null>(null)
  const [resent, setResent] = useState<string | null>(null)
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  })

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const v = params.get('verified')
    if (v === '1') setVerifyBanner('success')
    else if (v === '0') setVerifyBanner('failed')
  }, [location.search])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError(null)
    if (success) setSuccess(false)
    if (resent) setResent(null)
  }, [error, success, resent])

  const handleResend = async () => {
    try {
      setIsLoading(true)
      await fetch('https://us-central1-smart-matwana-ke.cloudfunctions.net/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      })
      setResent('Verification email sent. Please check your inbox.')
    } catch (e) {
      setResent('Failed to resend verification link. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)
    setResent(null)

    try {
      const response = await apiService.login(formData)
      if (response.success && response.data && response.data.user && response.data.token) {
        setUser(response.data.user)
        setSuccess(true)
        setFormData({ email: '', password: '' })
        
        // Prefetch common data in background for smoother experience
        // This doesn't block navigation
        if (response.data.user.role === 'admin' || response.data.user.role === 'moderator') {
          // Prefetch admin/moderator data
          apiService.getReports(1, 5).catch(() => {})
        }
        
        // Immediate navigation for faster UX
        navigate('/')
      } else {
        setError('Invalid email or password. Please check your credentials.')
      }
    } catch (err: any) {
      const msg = err?.message || ''
      if (/not verified/i.test(msg)) {
        setError('Email not verified. Please check your inbox or resend the verification link below.')
      } else {
        setError('Invalid email or password. Please check your credentials.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">Smart Matatu</span>
          </Link>
        </div>
        <h1 className="mt-6 text-center text-3xl font-bold text-gray-900">
          {t('auth.loginTitle')}
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t('auth.loginSubtitle')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card">
          <div className="card-content">
            {verifyBanner === 'success' && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500" />
                  <p className="ml-2 text-sm text-green-800">Your email has been verified. You can now sign in.</p>
                </div>
              </div>
            )}
            {verifyBanner === 'failed' && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <p className="ml-2 text-sm text-yellow-800">Verification link expired or invalid. Enter your email and click Resend verification.</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert" aria-live="assertive">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
                {error.toLowerCase().includes('not verified') && (
                  <div className="mt-3">
                    <button onClick={handleResend} disabled={isLoading || !formData.email} className="btn btn-outline w-full">
                      {isLoading ? 'Sending…' : 'Resend verification email'}
                    </button>
                    {resent && <p className="mt-2 text-xs text-gray-600">{resent}</p>}
                  </div>
                )}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg" role="alert" aria-live="polite">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Check className="h-5 w-5 text-green-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">Login successful! Welcome back to Smart Matatu.</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">{t('auth.email')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input id="email" name="email" type="email" autoComplete="email" value={formData.email} onChange={handleInputChange} className="form-input pl-10" placeholder={t('auth.emailPlaceholder')} required aria-describedby="email-help" />
                </div>
                <p id="email-help" className="sr-only">{t('auth.emailPlaceholder')}</p>
              </div>

              {/* Password */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">{t('auth.password')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={formData.password} onChange={handleInputChange} className="form-input pl-10 pr-10" placeholder={t('auth.passwordPlaceholder')} required aria-describedby="password-help" />
                  <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? (<EyeOff className="h-5 w-5 text-gray-400" aria-hidden="true" />) : (<Eye className="h-5 w-5 text-gray-400" aria-hidden="true" />)}
                  </button>
                </div>
                <p id="password-help" className="sr-only">{t('auth.passwordPlaceholder')}</p>
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <div className="text-sm">
                  <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">{t('auth.forgotPassword')}</Link>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button type="submit" disabled={isLoading} className="btn btn-primary w-full" aria-label={isLoading ? t('auth.signingIn') : t('auth.signIn')}>
                  {isLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />{t('auth.signingIn')}</>) : (t('auth.signIn'))}
                </button>
              </div>

              {/* Sign Up Link */}
              <div className="text-center">
                <p className="text-sm text-gray-600">{t('auth.dontHaveAccount')}{' '}<Link to="/signup" className="font-medium text-primary-600 hover:text-primary-500">{t('auth.signUp')}</Link></p>
              </div>
            </form>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link to="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
