import { ReactNode } from 'react'
import { useApp } from '../contexts/AppContext'
import Header from './Header'
import RoleBasedNavigation from './RoleBasedNavigation'
import Footer from './Footer'
import LoadingSpinner from './LoadingSpinner'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { state } = useApp()

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

  // For authenticated users, use role-based navigation
  if (state.isAuthenticated) {
    return (
      <div className="min-h-screen flex">
        <RoleBasedNavigation />
        <div className="flex-1 flex flex-col lg:ml-0">
          <main className="flex-1 pt-16 lg:pt-0">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    )
  }

  // For non-authenticated users, use header layout
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}