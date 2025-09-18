import React, { useState } from 'react'
import { Settings, Eye, EyeOff, Type, Volume2, VolumeX, Contrast, Zap } from 'lucide-react'
import { useAccessibility } from '../contexts/AccessibilityContext'

interface AccessibilitySettingsProps {
  isOpen: boolean
  onClose: () => void
}

export default function AccessibilitySettings({ isOpen, onClose }: AccessibilitySettingsProps) {
  const { 
    config, 
    updateConfig, 
    announce, 
    toggleHighContrast, 
    toggleReducedMotion, 
    setFontSize 
  } = useAccessibility()
  
  const [isExpanded, setIsExpanded] = useState(false)

  if (!isOpen) return null

  const handleToggle = (key: keyof typeof config, value: boolean) => {
    updateConfig({ [key]: value })
    announce(`${key} ${value ? 'enabled' : 'disabled'}`)
  }

  const handleFontSizeChange = (size: 'small' | 'medium' | 'large') => {
    setFontSize(size)
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-settings-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 
              id="accessibility-settings-title"
              className="text-xl font-semibold text-gray-900"
            >
              Accessibility Settings
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close accessibility settings"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* High Contrast Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Contrast className="w-5 h-5 text-gray-600" />
                <div>
                  <label 
                    htmlFor="high-contrast"
                    className="text-sm font-medium text-gray-900"
                  >
                    High Contrast
                  </label>
                  <p className="text-xs text-gray-500">
                    Increase contrast for better visibility
                  </p>
                </div>
              </div>
              <button
                id="high-contrast"
                onClick={toggleHighContrast}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.highContrast ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                role="switch"
                aria-checked={config.highContrast}
                aria-label="Toggle high contrast mode"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.highContrast ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Reduced Motion Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Zap className="w-5 h-5 text-gray-600" />
                <div>
                  <label 
                    htmlFor="reduced-motion"
                    className="text-sm font-medium text-gray-900"
                  >
                    Reduced Motion
                  </label>
                  <p className="text-xs text-gray-500">
                    Minimize animations and transitions
                  </p>
                </div>
              </div>
              <button
                id="reduced-motion"
                onClick={toggleReducedMotion}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.reducedMotion ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                role="switch"
                aria-checked={config.reducedMotion}
                aria-label="Toggle reduced motion mode"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Font Size Selection */}
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <Type className="w-5 h-5 text-gray-600" />
                <div>
                  <label className="text-sm font-medium text-gray-900">
                    Font Size
                  </label>
                  <p className="text-xs text-gray-500">
                    Adjust text size for better readability
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => handleFontSizeChange(size)}
                    className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                      config.fontSize === size
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                    aria-pressed={config.fontSize === size}
                    aria-label={`Set font size to ${size}`}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Screen Reader Announcements Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Volume2 className="w-5 h-5 text-gray-600" />
                <div>
                  <label 
                    htmlFor="announce-changes"
                    className="text-sm font-medium text-gray-900"
                  >
                    Screen Reader Announcements
                  </label>
                  <p className="text-xs text-gray-500">
                    Announce changes to screen readers
                  </p>
                </div>
              </div>
              <button
                id="announce-changes"
                onClick={() => handleToggle('announceChanges', !config.announceChanges)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.announceChanges ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                role="switch"
                aria-checked={config.announceChanges}
                aria-label="Toggle screen reader announcements"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.announceChanges ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Keyboard Shortcuts Info */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Keyboard Shortcuts
              </h3>
              <div className="space-y-1 text-xs text-gray-600">
                <p><kbd className="px-1 py-0.5 bg-gray-100 rounded">Tab</kbd> Navigate between elements</p>
                <p><kbd className="px-1 py-0.5 bg-gray-100 rounded">Enter</kbd> Activate buttons and links</p>
                <p><kbd className="px-1 py-0.5 bg-gray-100 rounded">Escape</kbd> Close dialogs</p>
                <p><kbd className="px-1 py-0.5 bg-gray-100 rounded">Space</kbd> Toggle checkboxes and switches</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
