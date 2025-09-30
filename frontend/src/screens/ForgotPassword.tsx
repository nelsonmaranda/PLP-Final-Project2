import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Check, AlertCircle, ArrowLeft } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'
import apiService from '../services/api'

export default function ForgotPassword() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState<string>('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setMessage('')
    try {
      await apiService.requestPasswordReset(email)
      setStatus('sent')
      setMessage('If that email exists, a reset link has been sent. Check your inbox.')
    } catch (e: any) {
      setStatus('error')
      setMessage(e?.message || 'Failed to send reset link. Please try again later.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
            <Mail className="w-6 h-6 text-white" />
          </div>
        </div>
        <h1 className="mt-6 text-center text-3xl font-bold text-gray-900">{t('auth.forgotPasswordTitle')}</h1>
        <p className="mt-2 text-center text-sm text-gray-600">{t('auth.forgotPasswordSubtitle')}</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card">
          <div className="card-content">
            {status === 'sent' && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-500" />
                  <p className="ml-2 text-sm text-green-800">{message}</p>
                </div>
              </div>
            )}
            {status === 'error' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <p className="ml-2 text-sm text-red-800">{message}</p>
                </div>
              </div>
            )}
            <form onSubmit={submit} className="space-y-6">
              <div className="form-group">
                <label className="form-label" htmlFor="email">{t('auth.email')}</label>
                <input id="email" type="email" className="form-input" value={email} onChange={e=>setEmail(e.target.value)} required placeholder={t('auth.emailPlaceholder')} />
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={status==='sending'}>
                {status==='sending' ? t('auth.signingIn') : t('auth.sendResetLink')}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/login" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('auth.backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  )
}


