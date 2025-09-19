import { ReactNode } from 'react'
import { useApp } from '../contexts/AppContext'
import Header from './Header'
import Footer from './Footer'
import LoadingSpinner from './LoadingSpinner'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { state, setLanguage } = useApp()

  // Show loading screen during initial authentication check
  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-gray-600 mt-4">Loading Smart Matatu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        language={state.language} 
        setLanguage={setLanguage}
      />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}