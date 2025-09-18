// Accessibility utilities and helpers

export interface AccessibilityConfig {
  announceChanges: boolean
  highContrast: boolean
  reducedMotion: boolean
  fontSize: 'small' | 'medium' | 'large'
  screenReader: boolean
}

// Default accessibility configuration
export const defaultAccessibilityConfig: AccessibilityConfig = {
  announceChanges: true,
  highContrast: false,
  reducedMotion: false,
  fontSize: 'medium',
  screenReader: false
}

// Screen reader announcements
export class ScreenReaderAnnouncer {
  private static instance: ScreenReaderAnnouncer
  private announcerElement: HTMLElement | null = null

  static getInstance(): ScreenReaderAnnouncer {
    if (!ScreenReaderAnnouncer.instance) {
      ScreenReaderAnnouncer.instance = new ScreenReaderAnnouncer()
    }
    return ScreenReaderAnnouncer.instance
  }

  private constructor() {
    this.createAnnouncerElement()
  }

  private createAnnouncerElement(): void {
    if (typeof document !== 'undefined') {
      this.announcerElement = document.createElement('div')
      this.announcerElement.setAttribute('aria-live', 'polite')
      this.announcerElement.setAttribute('aria-atomic', 'true')
      this.announcerElement.className = 'sr-only'
      this.announcerElement.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `
      document.body.appendChild(this.announcerElement)
    }
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (this.announcerElement) {
      this.announcerElement.setAttribute('aria-live', priority)
      this.announcerElement.textContent = message
      
      // Clear after announcement
      setTimeout(() => {
        if (this.announcerElement) {
          this.announcerElement.textContent = ''
        }
      }, 1000)
    }
  }
}

// Keyboard navigation utilities
export class KeyboardNavigation {
  static trapFocus(element: HTMLElement): () => void {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus()
            e.preventDefault()
          }
        }
      }
    }

    element.addEventListener('keydown', handleKeyDown)
    firstElement?.focus()

    return () => {
      element.removeEventListener('keydown', handleKeyDown)
    }
  }

  static handleArrowKeys(
    container: HTMLElement,
    direction: 'horizontal' | 'vertical' = 'horizontal'
  ): () => void {
    const focusableElements = Array.from(
      container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[]

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement)
      
      if (currentIndex === -1) return

      let nextIndex = currentIndex

      if (direction === 'horizontal') {
        if (e.key === 'ArrowLeft') {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1
        } else if (e.key === 'ArrowRight') {
          nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0
        }
      } else {
        if (e.key === 'ArrowUp') {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1
        } else if (e.key === 'ArrowDown') {
          nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0
        }
      }

      if (nextIndex !== currentIndex) {
        e.preventDefault()
        focusableElements[nextIndex]?.focus()
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }
}

// High contrast mode utilities
export class HighContrastMode {
  private static instance: HighContrastMode
  private isEnabled = false

  static getInstance(): HighContrastMode {
    if (!HighContrastMode.instance) {
      HighContrastMode.instance = new HighContrastMode()
    }
    return HighContrastMode.instance
  }

  enable(): void {
    this.isEnabled = true
    document.documentElement.classList.add('high-contrast')
    this.announce('High contrast mode enabled')
  }

  disable(): void {
    this.isEnabled = false
    document.documentElement.classList.remove('high-contrast')
    this.announce('High contrast mode disabled')
  }

  toggle(): void {
    if (this.isEnabled) {
      this.disable()
    } else {
      this.enable()
    }
  }

  isHighContrastEnabled(): boolean {
    return this.isEnabled
  }

  private announce(message: string): void {
    ScreenReaderAnnouncer.getInstance().announce(message)
  }
}

// Reduced motion utilities
export class ReducedMotionMode {
  private static instance: ReducedMotionMode
  private isEnabled = false

  static getInstance(): ReducedMotionMode {
    if (!ReducedMotionMode.instance) {
      ReducedMotionMode.instance = new ReducedMotionMode()
    }
    return ReducedMotionMode.instance
  }

  enable(): void {
    this.isEnabled = true
    document.documentElement.classList.add('reduced-motion')
    this.announce('Reduced motion mode enabled')
  }

  disable(): void {
    this.isEnabled = false
    document.documentElement.classList.remove('reduced-motion')
    this.announce('Reduced motion mode disabled')
  }

  toggle(): void {
    if (this.isEnabled) {
      this.disable()
    } else {
      this.enable()
    }
  }

  isReducedMotionEnabled(): boolean {
    return this.isEnabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  private announce(message: string): void {
    ScreenReaderAnnouncer.getInstance().announce(message)
  }
}

// Font size utilities
export class FontSizeManager {
  private static instance: FontSizeManager
  private currentSize: 'small' | 'medium' | 'large' = 'medium'

  static getInstance(): FontSizeManager {
    if (!FontSizeManager.instance) {
      FontSizeManager.instance = new FontSizeManager()
    }
    return FontSizeManager.instance
  }

  setFontSize(size: 'small' | 'medium' | 'large'): void {
    this.currentSize = size
    document.documentElement.className = document.documentElement.className
      .replace(/font-size-\w+/g, '')
    document.documentElement.classList.add(`font-size-${size}`)
    this.announce(`Font size set to ${size}`)
  }

  getFontSize(): 'small' | 'medium' | 'large' {
    return this.currentSize
  }

  private announce(message: string): void {
    ScreenReaderAnnouncer.getInstance().announce(message)
  }
}

// Focus management utilities
export class FocusManager {
  private static instance: FocusManager
  private focusHistory: HTMLElement[] = []

  static getInstance(): FocusManager {
    if (!FocusManager.instance) {
      FocusManager.instance = new FocusManager()
    }
    return FocusManager.instance
  }

  saveFocus(): void {
    const activeElement = document.activeElement as HTMLElement
    if (activeElement) {
      this.focusHistory.push(activeElement)
    }
  }

  restoreFocus(): void {
    const lastFocused = this.focusHistory.pop()
    if (lastFocused) {
      lastFocused.focus()
    }
  }

  clearHistory(): void {
    this.focusHistory = []
  }

  focusFirst(container: HTMLElement): void {
    const firstFocusable = container.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as HTMLElement
    firstFocusable?.focus()
  }

  focusLast(container: HTMLElement): void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
    lastElement?.focus()
  }
}

// ARIA utilities
export class AriaUtils {
  static generateId(prefix: string = 'aria'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
  }

  static setAriaExpanded(element: HTMLElement, expanded: boolean): void {
    element.setAttribute('aria-expanded', expanded.toString())
  }

  static setAriaSelected(element: HTMLElement, selected: boolean): void {
    element.setAttribute('aria-selected', selected.toString())
  }

  static setAriaChecked(element: HTMLElement, checked: boolean): void {
    element.setAttribute('aria-checked', checked.toString())
  }

  static setAriaPressed(element: HTMLElement, pressed: boolean): void {
    element.setAttribute('aria-pressed', pressed.toString())
  }

  static setAriaHidden(element: HTMLElement, hidden: boolean): void {
    element.setAttribute('aria-hidden', hidden.toString())
  }

  static setAriaLabel(element: HTMLElement, label: string): void {
    element.setAttribute('aria-label', label)
  }

  static setAriaDescribedBy(element: HTMLElement, describedBy: string): void {
    element.setAttribute('aria-describedby', describedBy)
  }

  static setAriaControls(element: HTMLElement, controls: string): void {
    element.setAttribute('aria-controls', controls)
  }

  static setAriaOwns(element: HTMLElement, owns: string): void {
    element.setAttribute('aria-owns', owns)
  }
}

// Color contrast utilities
export class ColorContrast {
  static getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1)
    const rgb2 = this.hexToRgb(color2)
    
    if (!rgb1 || !rgb2) return 0

    const luminance1 = this.getLuminance(rgb1)
    const luminance2 = this.getLuminance(rgb2)

    const lighter = Math.max(luminance1, luminance2)
    const darker = Math.min(luminance1, luminance2)

    return (lighter + 0.05) / (darker + 0.05)
  }

  static isAccessible(contrastRatio: number): boolean {
    return contrastRatio >= 4.5 // WCAG AA standard
  }

  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  private static getLuminance(rgb: { r: number; g: number; b: number }): number {
    const { r, g, b } = rgb
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }
}

// Accessibility testing utilities
export class AccessibilityTester {
  static testKeyboardNavigation(container: HTMLElement): boolean {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    if (focusableElements.length === 0) return true

    // Test tab navigation
    const firstElement = focusableElements[0] as HTMLElement
    firstElement.focus()
    
    let currentIndex = 0
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault()
        currentIndex = e.shiftKey 
          ? (currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1)
          : (currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0)
        
        (focusableElements[currentIndex] as HTMLElement).focus()
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    
    // Clean up after testing
    setTimeout(() => {
      container.removeEventListener('keydown', handleKeyDown)
    }, 1000)

    return true
  }

  static testScreenReaderCompatibility(container: HTMLElement): boolean {
    const elements = container.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby]')
    return elements.length > 0
  }

  static testColorContrast(container: HTMLElement): boolean {
    const elements = container.querySelectorAll('*')
    let allAccessible = true

    elements.forEach(element => {
      const styles = window.getComputedStyle(element)
      const color = styles.color
      const backgroundColor = styles.backgroundColor

      if (color && backgroundColor && color !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        const contrastRatio = ColorContrast.getContrastRatio(color, backgroundColor)
        if (!ColorContrast.isAccessible(contrastRatio)) {
          allAccessible = false
        }
      }
    })

    return allAccessible
  }
}

export default {
  ScreenReaderAnnouncer,
  KeyboardNavigation,
  HighContrastMode,
  ReducedMotionMode,
  FontSizeManager,
  FocusManager,
  AriaUtils,
  ColorContrast,
  AccessibilityTester
}
