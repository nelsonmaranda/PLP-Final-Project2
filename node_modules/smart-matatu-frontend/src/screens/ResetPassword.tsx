import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Lock, Check, AlertCircle, ArrowLeft } from 'lucide-react'
import { useTranslation } from '../hooks/useTranslation'
import apiService from '../services/api'

export default function ResetPassword() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle'|'sending'|'success'|'error'>('idle')
  const [message, setMessage] = useState('')
  const [token, setToken] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const t = params.get('token') || ''
    setToken(t)
  }, [location.search])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8 || password !== confirm) {
      setStatus('error')
      setMessage('Passwords must match and be at least 8 characters.')
      return
    }
    setStatus('sending')
    setMessage('')
    try {
      await apiService.resetPassword(token, password)
      setStatus('success')
      setMessage('Password reset successfully. Redirecting to login…')
      setTimeout(()=>navigate('/login'), 1500)
    } catch (e: any) {
      setStatus('error')
      setMessage(e?.message || 'Failed to reset password. Try requesting a new link.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
            <Lock className="w-6 h-6 text-white" />
          </div>
        </div>
        <h1 className="mt-6 text-center text-3xl font-bold text-gray-900">{t('auth.resetPasswordTitle')}</h1>
        <p className="mt-2 text-center text-sm text-gray-600">{t('auth.resetPasswordSubtitle')}</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card">
          <div className="card-content">
            {status==='success' && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg"><div className="flex items-center"><Check className="h-5 w-5 text-green-500" /><p className="ml-2 text-sm text-green-800">{message}</p></div></div>
            )}
            {status==='error' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"><div className="flex items-center"><AlertCircle className="h-5 w-5 text-red-500" /><p className="ml-2 text-sm text-red-800">{message}</p></div></div>
            )}
            <form onSubmit={submit} className="space-y-6">
              <div className="form-group">
                <label className="form-label" htmlFor="password">{t('auth.password')}</label>
                <input id="password" type="password" className="form-input" value={password} onChange={e=>setPassword(e.target.value)} minLength={8} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="confirm">{t('auth.confirmPassword')}</label>
                <input id="confirm" type="password" className="form-input" value={confirm} onChange={e=>setConfirm(e.target.value)} minLength={8} required />
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={status==='sending'}>{status==='sending' ? t('auth.resetting') : t('auth.resetPassword')}</button>
            </form>
          </div>
        </div>
        <div className="mt-6 text-center">
          <Link to="/login" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"><ArrowLeft className="w-4 h-4 mr-2" />Back to login</Link>
        </div>
      </div>
    </div>
  )
}


