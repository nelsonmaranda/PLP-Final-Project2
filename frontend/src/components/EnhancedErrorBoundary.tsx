import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { ErrorLogger, useErrorHandler, getUserFriendlyMessage } from '../utils/errorHandling'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  retryCount: number
}

class EnhancedErrorBoundary extends Component<Props, State> {
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const logger = ErrorLogger.getInstance()
    logger.logError(error, errorInfo, {
      component: 'EnhancedErrorBoundary',
      retryCount: this.state.retryCount
    })

    this.setState({
      error,
      errorInfo
    })

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }))
    } else {
      // Reset retry count and try again
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: 0
      })
    }
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleReportError = () => {
    const { error, errorInfo } = this.state
    if (error) {
      // In a real app, you'd send this to your error reporting service
      console.log('Reporting error:', { error, errorInfo })
      alert('Error reported. Thank you for helping us improve!')
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { error } = this.state
      const userFriendlyMessage = error ? getUserFriendlyMessage(error) : 'An unexpected error occurred'
      const canRetry = this.state.retryCount < this.maxRetries

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              
              <h1 className="text-lg font-semibold text-gray-900 mb-2">
                Something went wrong
              </h1>
              
              <p className="text-sm text-gray-600 mb-6">
                {userFriendlyMessage}
              </p>

              <div className="space-y-3">
                {canRetry && (
                  <button
                    onClick={this.handleRetry}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </button>
                )}

                <button
                  onClick={this.handleGoHome}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </button>

                <button
                  onClick={this.handleReportError}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Bug className="h-4 w-4 mr-2" />
                  Report Error
                </button>
              </div>

              {this.props.showDetails && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded-md text-xs font-mono text-gray-700 overflow-auto max-h-32">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="whitespace-pre-wrap mt-1">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="mt-4 text-xs text-gray-500">
                Retry attempt: {this.state.retryCount + 1} of {this.maxRetries + 1}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for functional components
export function useErrorBoundary() {
  const { handleError } = useErrorHandler()

  const captureError = (error: Error, errorInfo?: any) => {
    handleError(error, errorInfo)
  }

  return { captureError }
}

export default EnhancedErrorBoundary
