import { BREAKPOINTS } from './constants'

// Device detection
export function isMobile(): boolean {
  return window.innerWidth < BREAKPOINTS.MD
}

export function isTablet(): boolean {
  return window.innerWidth >= BREAKPOINTS.MD && window.innerWidth < BREAKPOINTS.LG
}

export function isDesktop(): boolean {
  return window.innerWidth >= BREAKPOINTS.LG
}

export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (isMobile()) return 'mobile'
  if (isTablet()) return 'tablet'
  return 'desktop'
}

// Responsive utilities
export function getResponsiveValue<T>(
  mobile: T,
  tablet?: T,
  desktop?: T
): T {
  if (isDesktop() && desktop !== undefined) return desktop
  if (isTablet() && tablet !== undefined) return tablet
  return mobile
}

// Touch detection
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

// Viewport helpers
export function getViewportWidth(): number {
  return window.innerWidth
}

export function getViewportHeight(): number {
  return window.innerHeight
}

// Media query helpers
export function matchesMediaQuery(query: string): boolean {
  return window.matchMedia(query).matches
}

// Responsive breakpoint checks
export function isAboveBreakpoint(breakpoint: keyof typeof BREAKPOINTS): boolean {
  return window.innerWidth >= BREAKPOINTS[breakpoint]
}

export function isBelowBreakpoint(breakpoint: keyof typeof BREAKPOINTS): boolean {
  return window.innerWidth < BREAKPOINTS[breakpoint]
}

// Orientation detection
export function isPortrait(): boolean {
  return window.innerHeight > window.innerWidth
}

export function isLandscape(): boolean {
  return window.innerWidth > window.innerHeight
}

// Responsive image sizing
export function getResponsiveImageSize(
  baseSize: number,
  scale: number = 1
): number {
  const deviceType = getDeviceType()
  const multipliers = {
    mobile: 1,
    tablet: 1.2,
    desktop: 1.5,
  }
  return Math.round(baseSize * multipliers[deviceType] * scale)
}

// Grid column calculation
export function getGridColumns(): number {
  if (isDesktop()) return 3
  if (isTablet()) return 2
  return 1
}

// Font size scaling
export function getResponsiveFontSize(
  baseSize: number,
  scale: number = 1
): number {
  const deviceType = getDeviceType()
  const multipliers = {
    mobile: 1,
    tablet: 1.1,
    desktop: 1.2,
  }
  return Math.round(baseSize * multipliers[deviceType] * scale)
}

// Spacing calculation
export function getResponsiveSpacing(
  baseSpacing: number,
  scale: number = 1
): number {
  const deviceType = getDeviceType()
  const multipliers = {
    mobile: 1,
    tablet: 1.2,
    desktop: 1.5,
  }
  return Math.round(baseSpacing * multipliers[deviceType] * scale)
}
