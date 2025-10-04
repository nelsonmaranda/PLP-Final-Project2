import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Loader2 } from 'lucide-react'
import apiService from '../services/api'
import { Route, CreateReportData } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'
import { MATATU_SACCOS, stripSaccoFromRouteName } from '../utils/constants'
import { useTranslation } from '../hooks/useTranslation'

export default function ReportForm() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [routes, setRoutes] = useState<Route[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState<CreateReportData>({
    routeId: '',
    reportType: 'delay',
    severity: 'medium',
    isAnonymous: false,
    description: '',
    location: {
      type: 'Point',
      coordinates: [36.8219, -1.2921]
    }
  })

  const [selectedSacco, setSelectedSacco] = useState<string>('')
  const [otherSacco, setOtherSacco] = useState<string>('')
  const [direction, setDirection] = useState<'from_cbd' | 'to_cbd' | 'along_route'>('along_route')
  const [fareKsh, setFareKsh] = useState<string>('')

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        const res = await apiService.getRoutes({ page: 1, limit: 200, sort: 'name', order: 'asc' })
        if (res.success && res.data) {
          setRoutes(res.data.routes as any)
        } else {
          setRoutes([])
        }
      } catch (e) {
        console.error('Failed to load routes', e)
        setRoutes([])
      } finally {
        setIsLoading(false)
      }
    }
    loadRoutes()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    // Validate Other SACCO field
    if (selectedSacco === 'other' && !otherSacco.trim()) {
      setError(t('report.otherSaccoRequired'))
      setIsSubmitting(false)
      return
    }

    try {
      const payload = {
        ...formData,
        sacco: selectedSacco === 'other' ? otherSacco.trim() : (selectedSacco || undefined),
        direction,
        fare: fareKsh ? Number(fareKsh) : undefined,
        // Ensure the server can associate user unless anonymous
        isAnonymous: Boolean(formData.isAnonymous)
      }
      const res = await apiService.createReport(payload as any)
      if (res.success) {
        setSuccess(true)
        setTimeout(() => navigate('/'), 1200)
      } else {
        setError('Failed to submit report')
      }
    } catch (e: any) {
      setError(e.message || 'Failed to submit report')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-gray-600 mt-4">{t('report.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('report.title')}</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded border border-red-200">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded border border-green-200">Report submitted successfully</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('report.route')}</label>
            <select
              value={formData.routeId}
              onChange={(e) => setFormData((p) => ({ ...p, routeId: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">{t('report.selectRoute')}</option>
              {routes.map((r: any) => (
                <option key={r._id} value={r._id}>
                  {stripSaccoFromRouteName(r.name)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('report.saccoOptional')}</label>
            <select
              value={selectedSacco}
              onChange={(e) => {
                setSelectedSacco(e.target.value)
                if (e.target.value !== 'other') {
                  setOtherSacco('')
                }
              }}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">{t('report.selectSacco')}</option>
              {MATATU_SACCOS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value="other">{t('report.otherSacco')}</option>
            </select>
            
            {selectedSacco === 'other' && (
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('report.specifyOtherSacco')}</label>
                <input
                  type="text"
                  value={otherSacco}
                  onChange={(e) => setOtherSacco(e.target.value)}
                  placeholder={t('report.otherSaccoPlaceholder')}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('report.direction')}</label>
            <div className="grid grid-cols-3 gap-3">
              <label className="flex items-center space-x-2 border rounded px-3 py-2 cursor-pointer">
                <input type="radio" name="direction" value="from_cbd" checked={direction==='from_cbd'} onChange={() => setDirection('from_cbd')} />
                <span>{t('report.fromCBD')}</span>
              </label>
              <label className="flex items-center space-x-2 border rounded px-3 py-2 cursor-pointer">
                <input type="radio" name="direction" value="to_cbd" checked={direction==='to_cbd'} onChange={() => setDirection('to_cbd')} />
                <span>{t('report.toCBD')}</span>
              </label>
              <label className="flex items-center space-x-2 border rounded px-3 py-2 cursor-pointer">
                <input type="radio" name="direction" value="along_route" checked={direction==='along_route'} onChange={() => setDirection('along_route')} />
                <span>{t('report.alongRoute')}</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('report.fare')}</label>
            <input
              type="number"
              min="0"
              step="1"
              value={fareKsh}
              onChange={(e) => setFareKsh(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder={t('report.farePlaceholder')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('report.reportType')}</label>
              <select
                value={formData.reportType}
                onChange={(e) => setFormData((p) => ({ ...p, reportType: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              >
                <option value="delay">{t('report.delay')}</option>
                <option value="overcrowding">{t('report.overcrowding')}</option>
                <option value="breakdown">{t('report.breakdown')}</option>
                <option value="safety">{t('report.safety')}</option>
                <option value="other">{t('report.other')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('report.severity')}</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData((p) => ({ ...p, severity: e.target.value as any }))}
                className="w-full border rounded px-3 py-2"
              >
                <option value="low">{t('report.low')}</option>
                <option value="medium">{t('report.medium')}</option>
                <option value="high">{t('report.high')}</option>
                <option value="critical">{t('report.critical')}</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="anonymous"
              type="checkbox"
              checked={formData.isAnonymous}
              onChange={(e) => setFormData((p) => ({ ...p, isAnonymous: e.target.checked }))}
            />
            <label htmlFor="anonymous" className="text-sm text-gray-700">{t('report.anonymous')}</label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('report.description')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              className="w-full border rounded px-3 py-2"
              rows={4}
              placeholder={t('report.descriptionPlaceholder')}
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />} 
{t('report.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
