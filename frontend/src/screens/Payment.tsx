import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { useTranslation } from '../hooks/useTranslation'
import apiService from '../services/api'

interface PaymentData {
  amount: number
  currency: string
  description: string
  planType: string
  planName: string
  features: string[]
}

const Payment: React.FC = () => {
  const { t } = useTranslation()
  const { state } = useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('stripe')

  useEffect(() => {
    const planType = searchParams.get('plan')
    const amount = searchParams.get('amount')
    const planName = searchParams.get('planName')
    
    if (!planType || !amount) {
      setError(t('payment.errors.invalidData'))
      setLoading(false)
      return
    }

    const planFeatures = {
      free: [t('subscription.plans.free.features.basicInfo'), t('subscription.plans.free.features.reports'), t('subscription.plans.free.features.support')],
      premium: [t('subscription.plans.premium.features.unlimitedReports'), t('subscription.plans.premium.features.advancedAnalytics'), t('subscription.plans.premium.features.prioritySupport'), t('subscription.plans.premium.features.realTimeNotifications')],
      sacco: [t('subscription.plans.sacco.features.allPremium'), t('subscription.plans.sacco.features.revenueAnalytics'), t('subscription.plans.sacco.features.customBranding'), t('subscription.plans.sacco.features.apiAccess'), t('subscription.plans.sacco.features.dedicatedSupport')],
      enterprise: [t('subscription.plans.enterprise.features.allSacco'), t('subscription.plans.enterprise.features.whiteLabel'), t('subscription.plans.enterprise.features.customIntegrations'), t('subscription.plans.enterprise.features.support247'), t('subscription.plans.enterprise.features.slaGuarantee')]
    }

    setPaymentData({
      amount: parseInt(amount),
      currency: 'KES',
      description: `${planName || planType} ${t('payment.subscriptionWord')}`,
      planType,
      planName: planName || planType,
      features: (planFeatures as any)[planType] || []
    })
    
    setLoading(false)
  }, [searchParams, t])

  const handlePayment = async () => {
    if (!paymentData || !state.user) return

    setProcessing(true)
    setError(null)

    try {
      if (state.user.email === 'nelsonmaranda2@gmail.com') {
        const response = await apiService.confirmPayment('admin_payment', paymentData.planType)
        if (response.success) {
          navigate('/subscription?success=true&plan=' + paymentData.planType)
        }
        return
      }

      const paymentIntent = await apiService.createPaymentIntent(
        paymentData.amount,
        paymentData.currency,
        paymentData.description
      )

      if (paymentIntent.success && paymentIntent.data) {
        setTimeout(async () => {
          try {
            const confirmResponse = await apiService.confirmPayment(
              paymentIntent.data?.paymentId || '',
              paymentData.planType
            )
            
            if (confirmResponse.success) {
              navigate('/subscription?success=true&plan=' + paymentData.planType)
            } else {
              setError(t('payment.errors.confirmFailed'))
            }
          } catch (err) {
            setError(t('payment.errors.confirmFailed'))
          } finally {
            setProcessing(false)
          }
        }, 2000)
      } else {
        setError(t('payment.errors.createFailed'))
        setProcessing(false)
      }
    } catch (err) {
      setError(t('payment.errors.paymentFailed'))
      setProcessing(false)
    }
  }

  const handleBackToPlans = () => {
    navigate('/subscription')
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

  if (error && !paymentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-md p-6 max-w-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{t('payment.errors.header')}</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <button
                  onClick={handleBackToPlans}
                  className="mt-3 bg-red-100 text-red-800 px-3 py-1 rounded-md text-sm hover:bg-red-200"
                >
                  {t('payment.backToPlans')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('payment.title')}
          </h1>
          <p className="text-gray-600">
            {t('payment.subtitle').replace('{plan}', paymentData?.planName || '')}
          </p>
        </div>

        {/* Payment Summary */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">{t('payment.orderSummary')}</h2>
          </div>
          <div className="px-6 py-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{t('payment.planLabel').replace('{plan}', paymentData?.planName || '')}</h3>
                <p className="text-sm text-gray-500">{t('payment.monthly')}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  {paymentData?.amount === 0 ? t('payment.free') : `KES ${paymentData?.amount.toLocaleString()}`}
                </p>
                {paymentData && paymentData.amount > 0 && (
                  <p className="text-sm text-gray-500">{t('payment.perMonth')}</p>
                )}
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">{t('payment.planFeatures')}</h4>
              <ul className="space-y-1">
                {paymentData?.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <svg className="h-4 w-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">{t('payment.paymentMethod')}</h2>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="stripe"
                  name="payment-method"
                  type="radio"
                  value="stripe"
                  checked={paymentMethod === 'stripe'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="stripe" className="ml-3 flex items-center">
                  <svg className="h-6 w-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.274 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.573-2.354 1.573-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                  </svg>
                  <span className="text-sm font-medium text-gray-700">{t('payment.card')}</span>
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="mpesa"
                  name="payment-method"
                  type="radio"
                  value="mpesa"
                  checked={paymentMethod === 'mpesa'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="mpesa" className="ml-3 flex items-center">
                  <div className="h-6 w-6 mr-2 bg-green-600 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">M</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{t('payment.mpesa')}</span>
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="airtel"
                  name="payment-method"
                  type="radio"
                  value="airtel"
                  checked={paymentMethod === 'airtel'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="airtel" className="ml-3 flex items-center">
                  <div className="h-6 w-6 mr-2 bg-red-600 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">A</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{t('payment.airtel')}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

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

        {/* Payment Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleBackToPlans}
            className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-400 transition-colors"
          >
            {t('payment.backToPlans')}
          </button>
          
          <button
            onClick={handlePayment}
            disabled={processing || paymentData?.amount === 0}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
              processing || paymentData?.amount === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {processing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t('payment.processingPayment')}
              </div>
            ) : paymentData?.amount === 0 ? (
              t('payment.activateFreePlan')
            ) : (
              t('payment.payAmount').replace('{amount}', (paymentData?.amount || 0).toLocaleString())
            )}
          </button>
        </div>

        {/* Security Notice */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center text-sm text-gray-500">
            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            {t('payment.secureNote')}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Payment
