import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, AlertTriangle, Camera, Send } from 'lucide-react'

export default function ReportForm() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    routeId: '',
    fare: '',
    waitTime: '',
    crowding: 'low',
    incidentType: '',
    description: '',
    location: null as { lat: number; lng: number } | null,
  })

  const routes = [
    { id: '1', name: 'Route 42 - Thika Road' },
    { id: '2', name: 'Route 17 - Waiyaki Way' },
    { id: '3', name: 'Route 8 - Jogoo Road' },
    { id: '4', name: 'Route 23 - Ngong Road' },
  ]

  const crowdingLevels = [
    { value: 'low', label: 'Low - Plenty of space', color: 'text-green-600' },
    { value: 'medium', label: 'Medium - Some standing', color: 'text-yellow-600' },
    { value: 'high', label: 'High - Crowded', color: 'text-orange-600' },
    { value: 'full', label: 'Full - Standing room only', color: 'text-red-600' },
  ]

  const incidentTypes = [
    'Overcrowding',
    'Reckless driving',
    'Overcharging',
    'Rude conductor',
    'Vehicle breakdown',
    'Long delays',
    'Other',
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCrowdingChange = (level: string) => {
    setFormData(prev => ({
      ...prev,
      crowding: level
    }))
  }

  const handleIncidentToggle = (type: string) => {
    setFormData(prev => ({
      ...prev,
      incidentType: prev.incidentType === type ? '' : type
    }))
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          }))
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In a real app, this would submit to your API
      console.log('Report submitted:', formData)
      
      // Redirect to map with success message
      navigate('/map?success=report-submitted')
    } catch (error) {
      console.error('Error submitting report:', error)
    } finally {
      setIsSubmitting(false)
    }
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

            <form onSubmit={handleSubmit} className="card-content space-y-6">
              {/* Route Selection */}
              <div className="form-group">
                <label className="form-label">Route *</label>
                <select
                  name="routeId"
                  value={formData.routeId}
                  onChange={handleInputChange}
                  className="form-select"
                  required
                >
                  <option value="">Select a route</option>
                  {routes.map(route => (
                    <option key={route.id} value={route.id}>
                      {route.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fare and Wait Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Fare Paid (KES) *</label>
                  <input
                    type="number"
                    name="fare"
                    value={formData.fare}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="50"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Wait Time (minutes) *</label>
                  <input
                    type="number"
                    name="waitTime"
                    value={formData.waitTime}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="5"
                    min="0"
                    required
                  />
                </div>
              </div>

              {/* Crowding Level */}
              <div className="form-group">
                <label className="form-label">Crowding Level *</label>
                <div className="grid grid-cols-2 gap-3">
                  {crowdingLevels.map(level => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => handleCrowdingChange(level.value)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        formData.crowding === level.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className={`font-medium ${level.color}`}>
                        {level.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Safety Issues */}
              <div className="form-group">
                <label className="form-label">Safety Issues (Optional)</label>
                <div className="grid grid-cols-2 gap-2">
                  {incidentTypes.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleIncidentToggle(type)}
                      className={`p-2 rounded-lg border text-sm transition-colors ${
                        formData.incidentType === type
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 inline mr-2" />
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Additional Details (Optional)</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-textarea"
                  placeholder="Any additional information about your trip..."
                  rows={3}
                />
              </div>

              {/* Location */}
              <div className="form-group">
                <label className="form-label">Location</label>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="btn btn-outline btn-sm"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Use Current Location
                  </button>
                  {formData.location && (
                    <span className="text-sm text-gray-600">
                      Location captured: {formData.location.lat.toFixed(4)}, {formData.location.lng.toFixed(4)}
                    </span>
                  )}
                </div>
              </div>

              {/* Photo Upload */}
              <div className="form-group">
                <label className="form-label">Photo (Optional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Upload a photo of the matatu or incident</p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="btn btn-outline btn-sm cursor-pointer"
                  >
                    Choose Photo
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/map')}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                >
                  {isSubmitting ? (
                    <>
                      <div className="loading-spinner mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
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
