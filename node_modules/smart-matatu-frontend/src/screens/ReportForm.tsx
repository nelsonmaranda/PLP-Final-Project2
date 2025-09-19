import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, AlertTriangle, Send, Loader2 } from 'lucide-react'
import apiService from '../services/api'
import { Route, CreateReportData } from '../types'
import LoadingSpinner from '../components/LoadingSpinner'

export default function ReportForm() {
  const navigate = useNavigate()
  const [routes, setRoutes] = useState<Route[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState<CreateReportData>({
    routeId: '',
    reportType: 'delay',
    description: '',
    location: {
      type: 'Point',
      coordinates: [36.8219, -1.2921] // [longitude, latitude]
    },
    severity: 'medium',
    isAnonymous: false
  })

  useEffect(() => {
    loadRoutes()
  }, [])

  const loadRoutes = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiService.getRoutes({
        page: 1,
        limit: 100,
        sort: 'name',
        order: 'asc'
      })

      if (response.success && response.data) {
        setRoutes(response.data.routes)
        console.log(`Loaded ${response.data.routes.length} routes`)
      } else {
        setError('Failed to load routes. Please refresh the page and try again.')
      }
    } catch (err) {
      console.error('Error loading routes:', err)
      setError('Failed to load routes. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: {
              type: 'Point',
              coordinates: [position.coords.longitude, position.coords.latitude]
            }
          }))
        },
        (error) => {
          console.error('Error getting location:', error)
          setError('Failed to get current location')
        }
      )
    } else {
      setError('Geolocation is not supported by this browser')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.routeId) {
      setError('Please select a route')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      
      const response = await apiService.createReport(formData)
      
      if (response.success && response.data) {
        setSuccess(true)
        // Reset form
        setFormData({
          routeId: '',
          reportType: 'delay',
          description: '',
          location: {
            type: 'Point',
            coordinates: [36.8219, -1.2921]
          },
          severity: 'medium',
          isAnonymous: false
        })
        
        // Show success message without redirecting
        console.log('Report submitted successfully!', response.data)
        
        // Hide success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError('Failed to submit report. Please check your information and try again.')
      }
    } catch (err) {
      console.error('Error submitting report:', err)
      setError('Failed to submit report. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-gray-600 mt-4">Loading routes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-6">
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <div className="card-header">
              <h1 className="card-title">Report Your Trip</h1>
              <p className="card-description">
                Help other commuters by sharing your matatu experience
              </p>
            </div>

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg" role="alert" aria-live="polite">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Report submitted successfully! Redirecting to map...
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert" aria-live="polite">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                  </div>
                  {error.includes('routes') && (
                    <button
                      type="button"
                      onClick={loadRoutes}
                      className="ml-4 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
                      disabled={isLoading}
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="card-content space-y-6" aria-labelledby="report-form-heading">
              {/* Route Selection */}
              <div className="form-group">
                <label htmlFor="routeId" className="form-label">Route *</label>
                <select
                  id="routeId"
                  name="routeId"
                  value={formData.routeId}
                  onChange={handleInputChange}
                  className="form-select"
                  aria-describedby="route-help"
                  required
                  disabled={isLoading || routes.length === 0}
                >
                  <option value="">
                    {isLoading ? 'Loading routes...' : routes.length === 0 ? 'No routes available' : 'Select a route'}
                  </option>
                  {routes.map(route => (
                    <option key={route._id} value={route._id}>
                      {route.routeNumber} - {route.name} ({route.operator})
                    </option>
                  ))}
                </select>
                <p id="route-help" className="text-sm text-gray-500 mt-1">Choose the route you want to report on</p>
              </div>

              {/* Report Type */}
              <fieldset className="form-group">
                <legend className="form-label">Issue Type *</legend>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'delay', label: 'Delay', icon: '⏰' },
                    { value: 'safety', label: 'Safety', icon: '⚠️' },
                    { value: 'crowding', label: 'Crowding', icon: '👥' },
                    { value: 'breakdown', label: 'Breakdown', icon: '🔧' },
                    { value: 'other', label: 'Other', icon: '📝' }
                  ].map((type) => (
                    <label key={type.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="reportType"
                        value={type.value}
                        checked={formData.reportType === type.value}
                        onChange={handleInputChange}
                        className="mr-3"
                        required
                      />
                      <span className="text-2xl mr-2" aria-hidden="true">{type.icon}</span>
                      <span className="font-medium">{type.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Description */}
              <div className="form-group">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-textarea"
                  placeholder="Describe the issue in detail..."
                  rows={4}
                  maxLength={500}
                  aria-describedby="description-help"
                />
                <p id="description-help" className="mt-1 text-sm text-gray-500">
                  {formData.description?.length || 0}/500 characters
                </p>
              </div>

              {/* Severity */}
              <div className="form-group">
                <label htmlFor="severity" className="form-label">Severity Level</label>
                <select
                  id="severity"
                  name="severity"
                  value={formData.severity}
                  onChange={handleInputChange}
                  className="form-select"
                  aria-describedby="severity-help"
                >
                  <option value="low">Low - Minor inconvenience</option>
                  <option value="medium">Medium - Moderate impact</option>
                  <option value="high">High - Significant impact</option>
                  <option value="critical">Critical - Safety concern</option>
                </select>
                <p id="severity-help" className="text-sm text-gray-500 mt-1">Choose the severity level of the issue</p>
              </div>

              {/* Location */}
              <div className="form-group">
                <label className="form-label">Location</label>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="btn btn-outline btn-sm"
                    aria-label="Use your current location for the report"
                  >
                    <MapPin className="w-4 h-4 mr-2" aria-hidden="true" />
                    Use Current Location
                  </button>
                  <span className="text-sm text-gray-600" aria-label={`Current coordinates: ${formData.location?.coordinates[1].toFixed(4)}, ${formData.location?.coordinates[0].toFixed(4)}`}>
                    {formData.location?.coordinates[1].toFixed(4)}, {formData.location?.coordinates[0].toFixed(4)}
                  </span>
                </div>
              </div>

              {/* Anonymous Report */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isAnonymous"
                  name="isAnonymous"
                  checked={formData.isAnonymous}
                  onChange={handleInputChange}
                  className="rounded border-gray-300"
                  aria-describedby="anonymous-help"
                />
                <label htmlFor="isAnonymous" className="ml-2 text-sm text-gray-700">
                  Submit anonymously
                </label>
                <p id="anonymous-help" className="sr-only">Check this box to submit your report without revealing your identity</p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/map')}
                  className="btn btn-outline"
                  disabled={isSubmitting}
                  aria-label="Cancel and return to map"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  aria-label={isSubmitting ? "Submitting report" : "Submit your report"}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" aria-hidden="true" />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
