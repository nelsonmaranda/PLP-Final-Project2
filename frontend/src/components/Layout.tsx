import { ReactNode } from 'react'
import { useApp } from '../contexts/AppContext'
import Header from './Header'
import Footer from './Footer'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { state, setLanguage } = useApp()

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