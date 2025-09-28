import React, { useState, useEffect } from 'react'
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
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

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

  const handleUpgrade = async (planId: string) => {
    if (!state.user) return

    try {
      setProcessing(true)
      setError(null)

      const plan = plans.find(p => p.id === planId)
      if (!plan) return

      // Create payment intent
      const paymentResponse = await apiService.createPaymentIntent(
        plan.price,
        plan.currency,
        `${plan.name} subscription`
      )

      // In a real implementation, you would integrate with Stripe Elements here
      // For now, we'll simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Confirm payment
      await apiService.confirmPayment(paymentResponse.data?.paymentId || '', planId)

      // Reload subscription data
      await loadData()

      // Track analytics event
      await apiService.trackEvent('subscription_changed', {
        planId,
        price: plan.price,
        userId: state.user._id
      }, undefined, state.user._id)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setProcessing(false)
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
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('subscription.currentPlan')}
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-blue-600 capitalize">
                    {userSubscription.planType}
                  </p>
                  <p className="text-gray-600">
                    {t('subscription.status')}: 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      userSubscription.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {userSubscription.status}
                    </span>
                  </p>
                  {userSubscription.endDate && (
                    <p className="text-sm text-gray-500">
                      {t('subscription.expires')}: {new Date(userSubscription.endDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {t('subscription.features')}:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(userSubscription.features).map(([key, value]) => (
                      value && (
                        <span key={key} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {t(`subscription.features.${key}`)}
                        </span>
                      )
                    ))}
                  </div>
                </div>
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
                    {plan.name}
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
                    {plan.features.map((feature, index) => (
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
                    disabled={isCurrentPlan || processing}
                    className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                      isCurrentPlan
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : isPopular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {processing ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t('subscription.processing')}
                      </div>
                    ) : isCurrentPlan ? (
                      t('subscription.current')
                    ) : plan.price === 0 ? (
                      t('subscription.getStarted')
                    ) : (
                      t('subscription.upgrade')
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
                        {plan.name}
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
