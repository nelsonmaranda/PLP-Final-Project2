import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { 
  AccessibilityConfig, 
  defaultAccessibilityConfig,
  ScreenReaderAnnouncer,
  HighContrastMode,
  ReducedMotionMode,
  FontSizeManager,
  FocusManager
} from '../utils/accessibility'

interface AccessibilityContextType {
  config: AccessibilityConfig
  updateConfig: (updates: Partial<AccessibilityConfig>) => void
  announce: (message: string, priority?: 'polite' | 'assertive') => void
  toggleHighContrast: () => void
  toggleReducedMotion: () => void
  setFontSize: (size: 'small' | 'medium' | 'large') => void
  saveFocus: () => void
  restoreFocus: () => void
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

interface AccessibilityProviderProps {
  children: ReactNode
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [config, setConfig] = useState<AccessibilityConfig>(defaultAccessibilityConfig)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize accessibility features
  useEffect(() => {
    const initializeAccessibility = () => {
      // Load saved preferences from localStorage
      const savedConfig = localStorage.getItem('accessibilityConfig')
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig)
          setConfig({ ...defaultAccessibilityConfig, ...parsedConfig })
        } catch (error) {
          console.warn('Failed to parse saved accessibility config:', error)
        }
      }

      // Check for system preferences
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches

      setConfig(prev => ({
        ...prev,
        reducedMotion: prefersReducedMotion,
        highContrast: prefersHighContrast
      }))

      setIsInitialized(true)
    }

    initializeAccessibility()
  }, [])

  // Apply accessibility settings to DOM
  useEffect(() => {
    if (!isInitialized) return

    const root = document.documentElement

    // Apply high contrast mode
    if (config.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // Apply reduced motion mode
    if (config.reducedMotion) {
      root.classList.add('reduced-motion')
    } else {
      root.classList.remove('reduced-motion')
    }

    // Apply font size
    root.className = root.className.replace(/font-size-\w+/g, '')
    root.classList.add(`font-size-${config.fontSize}`)

    // Save to localStorage
    localStorage.setItem('accessibilityConfig', JSON.stringify(config))
  }, [config, isInitialized])

  const updateConfig = (updates: Partial<AccessibilityConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (config.announceChanges) {
      ScreenReaderAnnouncer.getInstance().announce(message, priority)
    }
  }

  const toggleHighContrast = () => {
    const newValue = !config.highContrast
    updateConfig({ highContrast: newValue })
    announce(`High contrast mode ${newValue ? 'enabled' : 'disabled'}`)
  }

  const toggleReducedMotion = () => {
    const newValue = !config.reducedMotion
    updateConfig({ reducedMotion: newValue })
    announce(`Reduced motion mode ${newValue ? 'enabled' : 'disabled'}`)
  }

  const setFontSize = (size: 'small' | 'medium' | 'large') => {
    updateConfig({ fontSize: size })
    announce(`Font size set to ${size}`)
  }

  const saveFocus = () => {
    FocusManager.getInstance().saveFocus()
  }

  const restoreFocus = () => {
    FocusManager.getInstance().restoreFocus()
  }

  const value: AccessibilityContextType = {
    config,
    updateConfig,
    announce,
    toggleHighContrast,
    toggleReducedMotion,
    setFontSize,
    saveFocus,
    restoreFocus
  }

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility(): AccessibilityContextType {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}

export default AccessibilityProvider
