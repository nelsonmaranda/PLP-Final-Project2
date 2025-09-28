// User Types
export interface User {
  _id: string
  email: string
  displayName: string
  avatarUrl?: string
  role: 'user' | 'moderator' | 'admin' | 'sacco' | 'authority'
  requestedRole?: 'user' | 'moderator' | 'admin' | 'sacco' | 'authority'
  status?: 'active' | 'pending' | 'suspended' | 'rejected'
  savedRoutes: string[]
  organization?: string
  permissions?: string[]
  approvedBy?: string
  approvedAt?: string
  rejectionReason?: string
  createdAt: string
  updatedAt: string
}

export interface AuthUser {
  user: User
  token: string
}

// Route Types
export interface Route {
  _id: string
  name: string
  description: string
  operator: string
  routeNumber: string
  path: number[][]
  stops: Array<{
    name: string
    coordinates: number[]
  }>
  fare: number
  operatingHours: {
    start: string
    end: string
  }
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface RouteWithScores extends Route {
  score?: {
    reliability: number
    safety: number
    punctuality: number
    comfort: number
    overall: number
    totalReports: number
    lastCalculated: string
  }
}

// Report Types
export interface Report {
  _id: string
  userId: string
  routeId: string | Route
  reportType: string
  description?: string
  location: {
    type: string
    coordinates: number[]
  }
  severity: string
  status: string
  isAnonymous: boolean
  createdAt: string
  updatedAt: string
}

export interface PopulatedReport extends Omit<Report, 'routeId'> {
  routeId: Route
}

export interface CreateReportData {
  routeId: string
  reportType: string
  description?: string
  location?: {
    type: string
    coordinates: number[]
  }
  severity: string
  isAnonymous: boolean
}

// Score Types
export interface Score {
  _id: string
  routeId: string
  reliability: number
  safety: number
  punctuality: number
  comfort: number
  overall: number
  totalReports: number
  lastCalculated: string
  createdAt: string
  updatedAt: string
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Map Types
export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface MapMarker {
  id: string
  position: [number, number]
  type: 'route' | 'stop' | 'incident'
  data: any
}

// Form Types
export interface LoginFormData {
  email: string
  password: string
}

export interface SignupFormData {
  displayName: string
  email: string
  password: string
}

// UI State Types
export interface LoadingState {
  isLoading: boolean
  error?: string
}

export interface MapState {
  center: [number, number]
  zoom: number
  selectedRoute?: string
  filters: {
    timeRange: string
    crowding: string[]
    safety: string[]
  }
}

// Analytics Types
export interface AnalyticsData {
  totalUsers: number
  totalReports: number
  totalRoutes: number
  averageScore?: number
  averageReliability?: number
  averageSafety?: number
  reportsByDay: Array<{
    date: string
    count: number
  }>
  popularRoutes: Array<{
    routeId: string
    routeName: string
    reportCount: number
  }>
}

// Notification Types
export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: string
  read: boolean
}

// Settings Types
export interface UserSettings {
  language: 'en' | 'sw'
  notifications: {
    email: boolean
    push: boolean
    safety: boolean
    updates: boolean
  }
  privacy: {
    shareLocation: boolean
    shareReports: boolean
    analytics: boolean
  }
  display: {
    theme: 'light' | 'dark' | 'auto'
    mapStyle: 'default' | 'satellite' | 'terrain'
  }
}

// Error Types
export interface AppError {
  code: string
  message: string
  details?: any
  timestamp: string
}

// Language Types
export interface LanguageStrings {
  common: {
    loading: string
    error: string
    success: string
    cancel: string
    save: string
    delete: string
    edit: string
    view: string
    close: string
    back: string
    next: string
    previous: string
    submit: string
    search: string
    filter: string
    sort: string
    refresh: string
  }
  navigation: {
    home: string
    map: string
    report: string
    login: string
    signup: string
    admin: string
    profile: string
    settings: string
    dashboard: string
    analytics: string
    subscription: string
    saccoDashboard: string
    authorityDashboard: string
    userManagement: string
    adminPanel: string
    quickActions: string
    favorites: string
    reports: string
    safety: string
    predictions: string
    saccoManagement: string
    authorityTools: string
    fleetManagement: string
    compliance: string
    adminAnalytics: string
    saccoAnalytics: string
    authorityAnalytics: string
    moderatorAnalytics: string
    myAnalytics: string
  }
  auth: {
    login: string
    signup: string
    logout: string
    email: string
    password: string
    confirmPassword: string
    displayName: string
    rememberMe: string
    forgotPassword: string
    createAccount: string
    alreadyHaveAccount: string
    dontHaveAccount: string
    loginTitle: string
    loginSubtitle: string
    signupTitle: string
    signupSubtitle: string
    emailPlaceholder: string
    passwordPlaceholder: string
    displayNamePlaceholder: string
    confirmPasswordPlaceholder: string
    organizationPlaceholder: string
    selectRole: string
    signIn: string
    signUp: string
    creatingAccount: string
    signingIn: string
    loginSuccess: string
    signupSuccess: string
    loginError: string
    signupError: string
    emailRequired: string
    passwordRequired: string
    displayNameRequired: string
    passwordTooShort: string
    emailInvalid: string
    passwordsDoNotMatch: string
  }
  map: {
    title: string
    loading: string
    noRoutes: string
    selectRoute: string
    viewDetails: string
    reportTrip: string
    filter: string
    sort: string
    toggleFilters: string
    toggleListView: string
    quickFilters: string
    highReliability: string
    safeRoutes: string
    lowFare: string
    ofRoutes: string
    availableRoutes: string
    filters: string
    routeFilters: string
    fare: string
    hours: string
    stops: string
    routeNo: string
    viewOnMap: string
    rate: string
    tryAgain: string
    genericError: string
    mapAria: string
  }
  report: {
    title: string
    route: string
    selectRoute: string
    saccoOptional: string
    selectSacco: string
    otherSacco: string
    specifyOtherSacco: string
    otherSaccoPlaceholder: string
    otherSaccoRequired: string
    direction: string
    fromCBD: string
    toCBD: string
    alongRoute: string
    fare: string
    farePlaceholder: string
    reportType: string
    delay: string
    overcrowding: string
    breakdown: string
    safety: string
    other: string
    severity: string
    low: string
    medium: string
    high: string
    critical: string
    anonymous: string
    description: string
    descriptionPlaceholder: string
    loading: string
    submit: string
    success: string
  }
  sacco: {
    loading: string
    title: string
    subtitle: string
    date7d: string
    date30d: string
    date90d: string
    refresh: string
    tabs: {
      overview: string
      routes: string
      drivers: string
      feedback: string
      fleet: string
    }
    metrics: {
      activeRoutes: string
      activeDrivers: string
      totalRevenue7d: string
      avgRating: string
    }
    revenueTooltip: string
    fleetStatus: string
    activeVehicles: string
    ofTotal: string
    maintenanceDue: string
    vehiclesNeedService: string
    utilizationRate: string
    averageFleetUsage: string
    routePerformance: string
    table: {
      route: string
      efficiency: string
      revenue7d: string
      passengers: string
      onTime: string
      safety: string
      trend: string
    }
    driverPerformance: string
    driversTable: {
      driver: string
      safetyScore: string
      onTime: string
      rating: string
      incidents: string
      status: string
      routes: string
    }
    customerFeedback: string
    filters: {
      allStatus: string
      pending: string
      inProgress: string
      resolved: string
    }
    resolvedInDays: string
    fleetOverview: string
    totalVehicles: string
    averageAge: string
    years: string
    fleetUtilization: string
  }
  analytics: {
    loading: string
    errorTitle: string
    retry: string
    headerTitle: string
    headerSubtitle: string
    tabs: {
      efficiency: string
      predictions: string
      trends: string
      recommendations: string
    }
    efficiencyTitle: string
    selectRoute: string
    refresh: string
    recommendationsTitle: string
    yourPreferences: string
    recommendedRoutes: string
    travelPredictionsTitle: string
    predict: string
    fromStop: string
    toStop: string
    timeSlot: string
    minutesShort: string
    confidence: string
    optimistic: string
    realistic: string
    pessimistic: string
    factors: string
    alternativeRoutesTitle: string
    find: string
    reasons: string
    trendAnalysisTitle: string
    periodDaily: string
    periodWeekly: string
    periodMonthly: string
    update: string
    routeTrends: string
    current: string
    previous: string
    insights: string
    demandForecastsTitle: string
    prefEfficiency?: string
    prefSafety?: string
    prefCost?: string
    prefConvenience?: string
    goodPerformance?: string
  }
  home: {
    title: string
    subtitle: string
    viewMap: string
    reportTrip: string
    systemOnline: string
    systemOffline: string
    checkingStatus: string
    activeRoutes: string
    reportsToday: string
    safetyRating: string
    activeUsers: string
    howItWorks: string
    howItWorksDesc: string
    realTimeTracking: string
    realTimeTrackingDesc: string
    safetyReports: string
    safetyReportsDesc: string
    reliabilityScores: string
    reliabilityScoresDesc: string
    communityInsights: string
    communityInsightsDesc: string
    readyToStart: string
    readyToStartDesc: string
    signUpNow: string
    exploreMap: string
  }
  dashboard: {
    title: string
    welcome: string
    smartRouteInsights: string
    weatherConditions: string
    favoriteRoutes: string
    recentReports: string
    viewAllReports: string
    noReports: string
    noFavorites: string
    addFavorites: string
    loading: string
    loadingYourDashboard: string
    errorTitle: string
    tryAgain: string
    headerSubtitle: string
    currentWeather: string
    humidityLabel: string
    windSpeedLabel: string
    activeRoutesTitle: string
    routesMonitored: string
    avgFareTitle: string
    currentAverage: string
    overallSafety: string
    viewAllRoutesBtn: string
    aiRecommendations: string
    noInsights: string
    exploreRoutes: string
    routeIdLabel: string
    crowdSuffix: string
    crowdLow: string
    crowdMedium: string
    crowdHigh: string
    predictedFareLabel: string
    safetyScoreLabel: string
    travelTimeLabel: string
    bestTimeLabel: string
    routeLabel: string
    viewLabel: string
    submitReportBtn: string
    refresh: string
    quickActions: string
    quickViewMap: string
    quickSubmitReport: string
    quickViewProfile: string
    totalRoutes: string
    activeReports: string
    averageFare: string
    safetyRating: string
    temperature: string
    humidity: string
    windSpeed: string
    routeName: string
    farePrediction: string
    safetyScore: string
    crowdDensity: string
    travelTime: string
    recommendedTime: string
    alternativeRoutes: string
    weatherImpact: string
    lastUpdated: string
    low: string
    medium: string
    high: string
    excellent: string
    good: string
    average: string
    poor: string
    veryPoor: string
  }
  footer: {
    description: string
    quickLinks: string
    services: string
    contact: string
    routePlanning: string
    safetyReports: string
    realTimeUpdates: string
    analytics: string
    privacyPolicy: string
    termsOfService: string
    allRightsReserved: string
  }
  authority: {
    title: string
    subtitle: string
    loading: string
    last7Days: string
    last30Days: string
    last90Days: string
    refresh: string
    tabs: {
      compliance: string
      incidents: string
      metrics: string
      reports: string
      audit: string
      system: string
    }
    kpiCards: {
      totalSaccos: string
      compliantSaccos: string
      activeIncidents: string
      systemUptime: string
    }
    complianceTable: {
      title: string
      sacco: string
      licenseStatus: string
      safetyScore: string
      incidentCount: string
      lastInspection: string
      violations: string
      status: string
    }
    complianceStatus: {
      compliant: string
      warning: string
      nonCompliant: string
      valid: string
      expired: string
      pending: string
      unknown: string
    }
    incidentsTable: {
      title: string
      route: string
      type: string
      severity: string
      description: string
      location: string
      reportedAt: string
      assignedTo: string
      resolution: string
      resolvedAt: string
      allSeverity: string
      allStatus: string
      low: string
      medium: string
      high: string
      critical: string
      reported: string
      investigating: string
      resolved: string
      closed: string
    }
    systemMetrics: {
      title: string
      totalUsers: string
      activeReports: string
      totalRoutes: string
      systemUptime: string
      dataQuality: string
      averageResponseTime: string
    }
    performance: {
      title: string
      systemUptime: string
      avgResponseTime: string
      dataQuality: string
    }
    reports: {
      title: string
      complianceReport: {
        title: string
        description: string
      }
      safetyIncidents: {
        title: string
        description: string
      }
      systemAnalytics: {
        title: string
        description: string
      }
      exportCsv: string
      exportXls: string
    }
    auditTable: {
      title: string
      action: string
      user: string
      timestamp: string
      details: string
      ipAddress: string
      status: string
      success: string
      failed: string
      warning: string
    }
    systemHealth: {
      title: string
      systemUptime: string
      dataQuality: string
      averageResponseTime: string
    }
    userActivity: {
      title: string
      totalUsers: string
      activeReports: string
      totalRoutes: string
    }
  }
  userManagement: {
    title: string
    subtitle: string
    loading: string
    refresh: string
    addUser: string
    search: string
    searchPlaceholder: string
    statusLabel: string
    role: string
    requestedRole: string
    organization: string
    created: string
    tabs: {
      users: string
      roles: string
    }
    table: {
      displayName: string
      email: string
      role: string
      status: string
      actions: string
    }
    actions: {
      editUser: string
      deleteUser: string
      viewProfile: string
      approve: string
      reject: string
      edit: string
    }
    status: {
      active: string
      pending: string
      suspended: string
      rejected: string
    }
    roles: {
      admin: string
      moderator: string
      sacco: string
      authority: string
      user: string
    }
    deleteConfirm: {
      title: string
      message: string
      cancel: string
      delete: string
    }
    messages: {
      userDeleted: string
      userUpdated: string
      userCreated: string
      userApproved: string
      userRejected: string
      deleteError: string
      updateError: string
      createError: string
      approveError: string
      rejectError: string
      fetchError: string
      loadError: string
    }
    rejectionReason: string
    modals: {
      addUser: {
        title: string
        fullName: string
        email: string
        password: string
        organization: string
        cancel: string
        create: string
      }
      editUser: {
        title: string
        fullName: string
        email: string
        organization: string
        cancel: string
        save: string
      }
    }
    filters: {
      searchUsers: string
      filterByRole: string
      filterByStatus: string
      allRoles: string
      allStatus: string
      applyFilters: string
      clearFilters: string
    }
    noUsers: string
    noUsersMessage: string
  }
  admin: {
    title: string
    subtitle: string
    loading: string
    stats: {
      totalRoutes: string
      activeRoutes: string
      totalReports: string
      safetyIssues: string
      totalUsers: string
      systemUptime: string
    }
    seedRoutes: string
    seeding: string
    runSeed: string
    seedDescription: string
    tools: string
    routeEditor: string
    routeManagement: string
    addRoute: string
    addNewRoute: string
    routeName: string
    routeNamePlaceholder: string
    description: string
    descriptionPlaceholder: string
    cancel: string
    route: string
    reliability: string
    safety: string
    reports: string
    statusLabel: string
    actions: string
    activate: string
    deactivate: string
    status: {
      active: string
      inactive: string
      maintenance: string
    }
    quickActions: {
      title: string
      addRoute: string
      manageUsers: string
      viewReports: string
      systemSettings: string
    }
    recentActivity: {
      title: string
      noActivity: string
    }
  }
  profile: {
    title: string
    subtitle: string
    loading: string
    pleaseLogin: string
    loginRequired: string
    goToLogin: string
    role: string
    updateError: string
    myTripReports: string
    favoriteRoutes: string
    ratedRoutes: string
    noFavoriteRoutes: string
    noRatedRoutes: string
    exploreRoutes: string
    yourAnalytics: string
    totalReports: string
    favorites: string
    accountInformation: string
    accountType: string
    memberSince: string
    noReportsYet: string
    submitFirstReport: string
    thisMonth: string
    avgRating: string
    refresh: string
    debugUser: string
    debugReports: string
    fixReports: string
    fixScores: string
    fixRateLimits: string
    tabs: {
      personal: string
      security: string
      reports: string
      favorites: string
      analytics: string
    }
    personalInfo: {
      displayName: string
      email: string
      role: string
      organization: string
      uploadPhoto: string
      editProfile: string
      uploading: string
      saveChanges: string
      orEnterImageUrl: string
      set: string
      deletePhoto: string
      admin: string
      rated: string
      youRatedThisRoute: string
      view: string
      mostReportedRoute: string
    }
    security: {
      changePassword: string
      oldPassword: string
      newPassword: string
      confirmNewPassword: string
      updatePassword: string
    }
    messages: {
      profileUpdated: string
      profileError: string
      passwordUpdated: string
      passwordError: string
      passwordMismatch: string
      passwordTooShort: string
      currentPasswordIncorrect: string
      newPasswordSameAsOld: string
      uploadingImage: string
      imageUploadError: string
      avatarUpdateError: string
    }
  }
  subscription: {
    title: string
    subtitle: string
    currentPlan: string
    status: string
    expires: string
    features: string
    popular: string
    free: string
    month: string
    current: string
    processing: string
    getStarted: string
    upgrade: string
    featureComparison: string
    basicReports: string
    unlimitedReports: string
    advancedAnalytics: string
    prioritySupport: string
    apiAccess: string
    faq: string
    faq1: {
      question: string
      answer: string
    }
    faq2: {
      question: string
      answer: string
    }
      faq3: {
        question: string
        answer: string
      }
      featureNames: {
        advancedAnalytics: string
        prioritySupport: string
        customBranding: string
        apiAccess: string
        unlimitedReports: string
      }
      adminAccess: string
      planTypes: {
        free: string
        premium: string
        sacco: string
        enterprise: string
      }
      statusTypes: {
        active: string
        inactive: string
        expired: string
        pending: string
      }
      plans: {
        free: {
          name: string
          features: {
            basicInfo: string
            reports: string
            support: string
          }
        }
        premium: {
          name: string
          features: {
            unlimitedReports: string
            advancedAnalytics: string
            prioritySupport: string
            realTimeNotifications: string
          }
        }
        sacco: {
          name: string
          features: {
            allPremium: string
            revenueAnalytics: string
            customBranding: string
            apiAccess: string
            dedicatedSupport: string
          }
        }
        enterprise: {
          name: string
          features: {
            allSacco: string
            whiteLabel: string
            customIntegrations: string
            support247: string
            slaGuarantee: string
          }
        }
      }
      daysRemaining: string
      totalSubscription: string
      yearly: string
      selectPlan: string
      days: string
    }
  analyticsDashboard: {
    title: string
    subtitle: string
    last7Days: string
    last30Days: string
    error: string
    totalEvents: string
    activeUsers: string
    avgEngagement: string
    performanceScore: string
    eventTypes: string
    performanceMetrics: string
    metric: string
    value: string
    endpoint: string
    timestamp: string
    noMetrics: string
    noMetricsDesc: string
    // User Metrics
    userMetrics: {
      title: string
      totalUsers: string
      activeUsers: string
      newUsers: string
      userRoles: string
    }
    // Route Metrics
    routeMetrics: {
      title: string
      totalRoutes: string
      activeRoutes: string
      topOperators: string
    }
    // Report Metrics
    reportMetrics: {
      title: string
      totalReports: string
      recentReports: string
      reportsByType: string
      reportsBySeverity: string
      reportsByStatus: string
    }
    // Rating Metrics
    ratingMetrics: {
      title: string
      totalRatings: string
      averageRating: string
      topRatedRoutes: string
      routeName: string
      routeNumber: string
      operator: string
      avgRating: string
    }
    // Subscription Metrics
    subscriptionMetrics: {
      title: string
      totalSubscriptions: string
      activeSubscriptions: string
      subscriptionsByPlan: string
    }
    // Payment Metrics
    paymentMetrics: {
      title: string
      totalPayments: string
      successfulPayments: string
      successRate: string
      totalRevenue: string
      paymentsByMethod: string
    }
    // Traffic Metrics
    trafficMetrics: {
      title: string
      totalRoutesWithTraffic: string
      averageCongestion: string
      congestionIndex: string
      trafficFactor: string
    }
    // Geographic Analytics
    geographicAnalytics: {
      title: string
      reportHotspots: string
    }
    // Time Analytics
    timeAnalytics: {
      title: string
      reportsByHour: string
    }
    // Metric Type Names
    metricTypes: {
      apiResponseTime: string
      pageLoadTime: string
      errorRate: string
      userEngagement: string
    }
    // Report Types
    reportTypes: {
      crowding: string
      delay: string
      safety: string
      breakdown: string
      other: string
    }
    // Severity Levels
    severityLevels: {
      low: string
      medium: string
      high: string
      critical: string
    }
    // User Roles
    userRoles: {
      admin: string
      user: string
      moderator: string
      sacco: string
      authority: string
    }
    // Subscription Plans
    subscriptionPlans: {
      free: string
      premium: string
      sacco: string
      enterprise: string
    }
  }
  userAnalytics: {
    title: string
    subtitle: string
    last7Days: string
    last30Days: string
    last90Days: string
    refresh: string
    error: string
    retry: string
    loading: string
    // Personal Stats
    personalStats: {
      totalReports: string
      totalRatings: string
      favoriteRoutes: string
      activityScore: string
      reportsThisMonth: string
      avgRating: string
      savedRoutes: string
      veryActiveUser: string
    }
    // Route Insights
    routeInsights: {
      title: string
      mostReportedRoute: string
      bestRatedRoute: string
      reports: string
      last: string
      stars: string
      ratings: string
    }
    // Recent Activity
    recentActivity: {
      title: string
      reportedDelay: string
      ratedStars: string
      reportedSafetyIssue: string
    }
    // Safety Insights
    safetyInsights: {
      title: string
      safetyReports: string
      delayReports: string
      resolvedReports: string
      averageResponseTime: string
    }
    // Recommendations
    recommendations: {
      title: string
      suggestedRoutes: string
      highlyRatedByUsers: string
      reliableAndPunctual: string
      safetyTips: string
      avoidPeakHours: string
      bestSafetyRecord: string
      reportImmediately: string
    }
    // Peak Hours
    peakHours: {
      title: string
      highTraffic: string
      peakHours: string
    }
  }
  saccoDashboard: {
    title: string
    dashboardTitle: string
    subtitle: string
    dataSource: string
    last7Days: string
    last30Days: string
    last90Days: string
    refresh: string
    loadingAnalytics: string
    totalRoutes: string
    avgRating: string
    totalReports: string
    marketRank: string
    active: string
    outOf: string
    perDay: string
    ofSaccos: string
    reportsByType: string
    reportsBySeverity: string
    // Route Performance Analysis
    routePerformanceAnalysis: string
    route: string
    overallRating: string
    safety: string
    punctuality: string
    comfort: string
    totalRatings: string
    // Revenue Analytics
    totalRevenue: string
    avgDailyRevenue: string
    revenueDays: string
    dailyRevenueTrends: string
    // Market Position
    yourPerformance: string
    marketRanking: string
    marketAverage: string
    top5Saccos: string
    // Geographic Insights
    incidentHotspots: string
    peakHoursAnalysis: string
    error: string
    retry: string
    loading: string
    usingSampleData: string
    // Overview Tab
    overview: {
      title: string
      totalRoutes: string
      active: string
      avgRating: string
      outOf: string
      totalReports: string
      perDay: string
      marketRank: string
      ofSaccos: string
      reportsByType: string
      reportsBySeverity: string
    }
    // Route Performance Tab
    routePerformance: {
      title: string
      topRatedRoutes: string
      routeName: string
      routeNumber: string
      avgRating: string
      totalRatings: string
      avgReliability: string
      avgSafety: string
      avgPunctuality: string
      avgComfort: string
    }
    // Incident Reports Tab
    incidentReports: {
      title: string
      recentReports: string
      reportType: string
      severity: string
      location: string
      reportedAt: string
      status: string
    }
    // Revenue Analytics Tab
    revenueAnalytics: {
      title: string
      dailyRevenue: string
      totalRevenue: string
      avgDailyRevenue: string
      revenueTrend: string
    }
    // Market Position Tab
    marketPosition: {
      title: string
      competitiveAnalysis: string
      saccoRanking: string
      totalSaccos: string
      performanceVsMarket: string
      saccoReports: string
      marketAvg: string
    }
    // Geographic Insights Tab
    geographicInsights: {
      title: string
      hotspots: string
      totalLocations: string
      latitude: string
      longitude: string
      incidentCount: string
      types: string
    }
  }
  authorityDashboard: {
    title: string
    subtitle: string
    last7Days: string
    last30Days: string
    last90Days: string
    refresh: string
    loadingInsights: string
    critical: string
    avgRisk: string
    highRiskAreas: string
    systemEfficiency: string
    focusAreas: string
    recommendedActions: string
    avgDailyReports: string
    trendDirection: string
    totalReportsLabel: string
    criticalSaccos: string
    avgReportsPerSacco: string
    strategicFocusAreas: string
    incidents: string
    reports: string
    priorityScoreLabel: string
    totalReportsCount: string
    criticalReportsLabel: string
    error: string
    retry: string
    loading: string
    // Strategic Overview Tab
    strategicOverview: {
      title: string
      keyPerformanceIndicators: string
      totalSaccos: string
      totalRoutes: string
      totalReports: string
      criticalIncidents: string
      focusAreas: string
      recommendedActions: string
      increaseMonitoring: string
      implementInterventions: string
      focusResources: string
      developProtocols: string
      establishWarning: string
    }
    // SACCO Performance Tab
    saccoPerformance: {
      title: string
      topPerformers: string
      poorPerformers: string
      averageReportsPerSacco: string
      criticalSaccos: string
      saccoName: string
      totalReports: string
      criticalReports: string
      avgSeverity: string
      lastReport: string
    }
    // Route Risk Analysis Tab
    routeRiskAnalysis: {
      title: string
      highRiskRoutes: string
      totalRoutesAnalyzed: string
      averageRiskScore: string
      criticalRoutes: string
      routeName: string
      routeNumber: string
      operator: string
      totalIncidents: string
      criticalIncidents: string
      safetyIncidents: string
      accidentIncidents: string
      riskScore: string
      lastIncident: string
    }
    // Geographic Insights Tab
    geographicInsights: {
      title: string
      highRiskZones: string
      totalRiskZones: string
      averageRiskLevel: string
      latitude: string
      longitude: string
      totalIncidents: string
      criticalIncidents: string
      incidentTypes: string
      avgSeverity: string
      riskLevel: string
    }
    // Temporal Patterns Tab
    temporalPatterns: {
      title: string
      peakHours: string
      peakDays: string
        averageIncidentsPerHour: string
        peakHoursIdentified: string
        hour: string
      dayOfWeek: string
      incidentCount: string
      criticalCount: string
      avgSeverity: string
    }
    // Compliance Trends Tab
    complianceTrends: {
      title: string
      dailyTrends: string
      averageDailyReports: string
      trendDirection: string
      increasing: string
      decreasing: string
      stable: string
      day: string
      totalReports: string
      totalCritical: string
      saccoCount: string
      avgReportsPerSacco: string
    }
    // Risk Indicators Tab
    riskIndicators: {
      title: string
      topRisks: string
      criticalRiskTypes: string
      averageRiskLevel: string
      reportType: string
      totalCount: string
      criticalCount: string
      avgSeverity: string
      trend: string
    }
    // System Health Tab
    systemHealth: {
      title: string
      totalReports: string
      averageResponseTime: string
      resolutionRate: string
      dataQuality: string
    }
    // Resource Recommendations Tab
    resourceRecommendations: {
      title: string
      prioritySaccos: string
      totalResourcesNeeded: string
        highPriorityCount: string
        highPriorityCases: string
        saccoName: string
      totalReports: string
      criticalReports: string
      reportTypes: string
      priorityScore: string
    }
  }
}

// AI/ML Types
export interface WeatherData {
  temperature: number
  humidity: number
  windSpeed: number
  condition: string
  description: string
  icon: string
  location: string
  timestamp: string
  feelsLike?: number
  pressure?: number
  visibility?: number
  uvIndex?: number
  sunrise?: string
  sunset?: string
}

export interface FarePrediction {
  predictedFare: number
  confidence: number
  minFare: number
  maxFare: number
  trend: 'increasing' | 'decreasing' | 'stable'
  factors: string[]
  lastUpdated: string
}

export interface SafetyScore {
  overallScore: number
  reliabilityScore: number
  incidentScore: number
  driverScore: number
  vehicleScore: number
  factors: string[]
  lastUpdated: string
}

export interface CrowdDensity {
  level: 'low' | 'medium' | 'high'
  percentage: number
  predictedPeak: string
  recommendedTime: string
  lastUpdated: string
}

export interface RouteInsight {
  routeId: string
  routeName: string
  farePrediction: FarePrediction
  safetyScore: SafetyScore
  crowdDensity: CrowdDensity
  travelTime: number
  recommendedTime: string
  alternativeRoutes: string[]
  weatherImpact: string
  lastUpdated: string
}

export interface DashboardStats {
  totalRoutes: number
  activeReports: number
  averageFare: number
  safetyRating: number
  weatherCondition: string
  temperature: number
  humidity: number
  windSpeed: number
  totalUsers: number
  reportsToday: number
  incidentsToday: number
  topPerformingRoute: string
  lastUpdated: string
}

// ==================== ANALYTICS TYPES ====================

// Route Efficiency Scoring
export interface RouteEfficiencyScore {
  routeId: string
  routeName: string
  efficiencyScore: number // 0-100
  factors: {
    reliability: number // Based on on-time performance
    speed: number // Average speed vs expected
    safety: number // Safety incident rate
    comfort: number // User comfort ratings
    cost: number // Value for money
    frequency: number // Service frequency
  }
  recommendations: string[]
  lastUpdated: string
}

// Travel Time Prediction
export interface TravelTimePrediction {
  routeId: string
  fromStop: string
  toStop: string
  predictedTime: number // in minutes
  confidence: number // 0-100
  factors: {
    timeOfDay: number
    dayOfWeek: number
    weather: number
    traffic: number
    historical: number
  }
  alternativeTimes: {
    optimistic: number
    realistic: number
    pessimistic: number
  }
  lastUpdated: string
}

// Alternative Route
export interface AlternativeRoute {
  routeId: string
  routeName: string
  totalTime: number
  totalCost: number
  efficiency: number
  reasons: string[]
  stops: string[]
}

// Trend Analysis
export interface TrendAnalysis {
  routeId: string
  period: 'daily' | 'weekly' | 'monthly'
  trends: {
    ridership: {
      current: number
      previous: number
      change: number
      trend: 'increasing' | 'decreasing' | 'stable'
    }
    efficiency: {
      current: number
      previous: number
      change: number
      trend: 'improving' | 'declining' | 'stable'
    }
    safety: {
      current: number
      previous: number
      change: number
      trend: 'safer' | 'riskier' | 'stable'
    }
    cost: {
      current: number
      previous: number
      change: number
      trend: 'increasing' | 'decreasing' | 'stable'
    }
  }
  insights: string[]
  lastUpdated: string
}

// Demand Forecast
export interface DemandForecast {
  routeId: string
  timeSlot: string
  predictedDemand: number // 0-100
  confidence: number
  factors: {
    historical: number
    weather: number
    events: number
    seasonality: number
  }
  recommendations: string[]
  lastUpdated: string
}

// User Recommendation
export interface UserRecommendation {
  userId: string
  recommendations: {
    routeId: string
    routeName: string
    reason: string
    score: number
    type: 'efficiency' | 'safety' | 'cost' | 'convenience'
  }[]
  preferences: {
    efficiency: number
    safety: number
    cost: number
    convenience: number
  }
  lastUpdated: string
}

// ==================== STAKEHOLDER TYPES ====================

// SACCO Dashboard Types
export interface RoutePerformance {
  routeId: string
  routeName: string
  routeNumber: string
  efficiencyScore: number
  revenue: number
  passengerCount: number
  onTimePercentage: number
  safetyScore: number
  trend: 'up' | 'down' | 'stable'
}

export interface DriverPerformance {
  driverId: string
  driverName: string
  safetyScore: number
  onTimePercentage: number
  customerRating: number
  incidentCount: number
  routes: string[]
  status: 'active' | 'suspended' | 'warning'
}

export interface CustomerFeedback {
  id: string
  routeId: string
  routeName: string
  rating: number
  comment: string
  category: 'safety' | 'comfort' | 'punctuality' | 'service' | 'other'
  status: 'pending' | 'in_progress' | 'resolved'
  createdAt: string
  responseTime?: number
}

export interface FleetStatus {
  totalVehicles: number
  activeVehicles: number
  maintenanceDue: number
  averageAge: number
  utilizationRate: number
}

// Authority Dashboard Types
export interface ComplianceData {
  saccoId: string
  saccoName: string
  licenseStatus: 'valid' | 'expired' | 'pending'
  safetyScore: number
  incidentCount: number
  lastInspection: string
  violations: number
  status: 'compliant' | 'warning' | 'non-compliant'
}

export interface SafetyIncident {
  id: string
  routeId: string
  routeName: string
  saccoName: string
  type: 'accident' | 'breakdown' | 'overcrowding' | 'speeding' | 'other'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  location: string
  reportedAt: string
  status: 'reported' | 'investigating' | 'resolved' | 'closed'
  assignedTo?: string
  resolution?: string
  resolvedAt?: string
}

export interface SystemMetrics {
  totalUsers: number
  activeReports: number
  totalRoutes: number
  systemUptime: number
  dataQuality: number
  averageResponseTime: number
}

export interface AuditLog {
  id: string
  action: string
  user: string
  timestamp: string
  details: string
  ipAddress: string
  status: 'success' | 'failed' | 'warning'
}
