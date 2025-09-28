import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { useTranslation } from '../hooks/useTranslation'
import apiService from '../services/api'

interface SubscriptionPlan {
  id: string
  name: string
  price: number
  currency: string
  features: string[]
}

interface UserSubscription {
  userId: string
  planType: string
  status: string
  startDate: string
  endDate?: string
  features: {
    advancedAnalytics: boolean
    prioritySupport: boolean
    customBranding: boolean
    apiAccess: boolean
    unlimitedReports: boolean
  }
}

const Subscription: React.FC = () => {
  const { t } = useTranslation()
  const { state } = useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Check if this is the special admin user
  const isSpecialAdmin = state.user?.email === 'nelsonmaranda2@gmail.com'

  // Calculate subscription days remaining
  const calculateDaysRemaining = (endDate?: string): number => {
    if (!endDate) return 0
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  // Calculate total subscription days
  const calculateTotalDays = (startDate: string, endDate?: string): number => {
    if (!endDate) return 365 // Default to yearly
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = end.getTime() - start.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getTranslatedFeatures = (planId: string): string[] => {
    switch (planId) {
      case 'free':
        return [
          t('subscription.plans.free.features.basicInfo'),
          t('subscription.plans.free.features.reports'),
          t('subscription.plans.free.features.support')
        ]
      case 'premium':
        return [
          t('subscription.plans.premium.features.unlimitedReports'),
          t('subscription.plans.premium.features.advancedAnalytics'),
          t('subscription.plans.premium.features.prioritySupport'),
          t('subscription.plans.premium.features.realTimeNotifications')
        ]
      case 'sacco':
        return [
          t('subscription.plans.sacco.features.allPremium'),
          t('subscription.plans.sacco.features.revenueAnalytics'),
          t('subscription.plans.sacco.features.customBranding'),
          t('subscription.plans.sacco.features.apiAccess'),
          t('subscription.plans.sacco.features.dedicatedSupport')
        ]
      case 'enterprise':
        return [
          t('subscription.plans.enterprise.features.allSacco'),
          t('subscription.plans.enterprise.features.whiteLabel'),
          t('subscription.plans.enterprise.features.customIntegrations'),
          t('subscription.plans.enterprise.features.support247'),
          t('subscription.plans.enterprise.features.slaGuarantee')
        ]
      default:
        return []
    }
  }

  useEffect(() => {
    loadData()
    
    // Check for success message from payment
    const success = searchParams.get('success')
    const plan = searchParams.get('plan')
    if (success === 'true' && plan) {
      setSuccessMessage(`Successfully upgraded to ${plan} plan!`)
      // Clear the URL parameters
      navigate('/subscription', { replace: true })
    }
  }, [searchParams, navigate])

  const loadData = async () => {
    try {
      setLoading(true)
      const [plansResponse, subscriptionResponse] = await Promise.all([
        apiService.getSubscriptionPlans(),
        state.user ? apiService.getUserSubscription(state.user._id) : null
      ])

      setPlans(plansResponse.data || [])
      if (subscriptionResponse) {
        setUserSubscription(subscriptionResponse.data || null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription data')
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = (planId: string) => {
    // Get the selected plan
    const selectedPlan = plans.find(plan => plan.id === planId)
    if (!selectedPlan) {
      setError('Plan not found')
      return
    }

    // Check if this is the special admin user
    if (isSpecialAdmin) {
      // Admin user - no payment required, directly activate
      handleAdminUpgrade(planId)
      return
    }

    // Redirect to payment page with plan details
    const params = new URLSearchParams({
      plan: planId,
      amount: selectedPlan.price.toString(),
      planName: selectedPlan.name
    })
    
    navigate(`/payment?${params.toString()}`)
  }

  const handleAdminUpgrade = async (planId: string) => {
    try {
      const response = await apiService.confirmPayment('admin_payment', planId)
      if (response.success) {
        // Refresh subscription data
        await loadData()
      }
    } catch (err) {
      setError('Failed to activate plan. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t('subscription.title')}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('subscription.subtitle')}
          </p>
        </div>

        {/* Current Subscription */}
        {userSubscription && (
          <div className="mb-8">
            <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
              isSpecialAdmin ? 'border-purple-500' : 'border-blue-500'
            }`}>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('subscription.currentPlan')}
                {isSpecialAdmin && (
                  <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                    {t('subscription.adminAccess')}
                  </span>
                )}
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600 capitalize">
                    {t(`subscription.planTypes.${userSubscription.planType}`)}
                  </p>
                  <p className="text-gray-600">
                    {t('subscription.status')}: 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      userSubscription.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {t(`subscription.statusTypes.${userSubscription.status}`)}
                    </span>
                  </p>
                  {userSubscription.endDate && (
                    <p className="text-sm text-gray-500">
                      {t('subscription.expires')}: {new Date(userSubscription.endDate).toLocaleDateString()}
                    </p>
                  )}
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      {t('subscription.daysRemaining')}: <span className="font-semibold text-blue-600">
                        {calculateDaysRemaining(userSubscription.endDate)}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('subscription.totalSubscription')}: <span className="font-semibold text-gray-700">
                        {calculateTotalDays(userSubscription.startDate, userSubscription.endDate)} {t('subscription.days')} ({t('subscription.yearly')})
                      </span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {t('subscription.features')}:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(userSubscription.features).map(([key, value]) => (
                      value && (
                        <span key={key} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {t(`subscription.featureNames.${key}`)}
                        </span>
                      )
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setSuccessMessage(null)}
                  className="text-green-400 hover:text-green-600"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => {
            const isCurrentPlan = userSubscription?.planType === plan.id
            const isPopular = plan.id === 'premium'
            
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-lg shadow-lg overflow-hidden ${
                  isPopular ? 'ring-2 ring-blue-500' : ''
                } ${isCurrentPlan ? 'opacity-75' : ''}`}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-sm font-medium">
                    {t('subscription.popular')}
                  </div>
                )}
                
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {t(`subscription.planTypes.${plan.id}`)}
                  </h3>
                  
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price === 0 ? t('subscription.free') : `KES ${plan.price}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-600">/{t('subscription.month')}</span>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6">
                    {getTranslatedFeatures(plan.id).map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isCurrentPlan}
                    className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                      isCurrentPlan
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : isPopular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {isCurrentPlan ? (
                      t('subscription.current')
                    ) : plan.price === 0 ? (
                      t('subscription.getStarted')
                    ) : (
                      t('subscription.selectPlan')
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Features Comparison */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            {t('subscription.featureComparison')}
          </h2>
          
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('subscription.features')}
                    </th>
                    {plans.map((plan) => (
                      <th key={plan.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t(`subscription.planTypes.${plan.id}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {t('subscription.basicReports')}
                    </td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-center">
                        <svg className="h-5 w-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {t('subscription.unlimitedReports')}
                    </td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-center">
                        {plan.id === 'free' ? (
                          <span className="text-gray-400">5/month</span>
                        ) : (
                          <svg className="h-5 w-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {t('subscription.advancedAnalytics')}
                    </td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-center">
                        {['premium', 'sacco', 'enterprise'].includes(plan.id) ? (
                          <svg className="h-5 w-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-gray-300 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {t('subscription.prioritySupport')}
                    </td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-center">
                        {['premium', 'sacco', 'enterprise'].includes(plan.id) ? (
                          <svg className="h-5 w-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-gray-300 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {t('subscription.apiAccess')}
                    </td>
                    {plans.map((plan) => (
                      <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-center">
                        {['sacco', 'enterprise'].includes(plan.id) ? (
                          <svg className="h-5 w-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-gray-300 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            {t('subscription.faq')}
          </h2>
          
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('subscription.faq1.question')}
              </h3>
              <p className="text-gray-600">
                {t('subscription.faq1.answer')}
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('subscription.faq2.question')}
              </h3>
              <p className="text-gray-600">
                {t('subscription.faq2.answer')}
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('subscription.faq3.question')}
              </h3>
              <p className="text-gray-600">
                {t('subscription.faq3.answer')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Subscription
