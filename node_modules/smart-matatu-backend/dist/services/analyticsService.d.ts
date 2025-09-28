export interface RouteEfficiencyScore {
    routeId: string;
    routeName: string;
    efficiencyScore: number;
    factors: {
        reliability: number;
        speed: number;
        safety: number;
        comfort: number;
        cost: number;
        frequency: number;
    };
    recommendations: string[];
    lastUpdated: Date;
}
export interface TravelTimePrediction {
    routeId: string;
    fromStop: string;
    toStop: string;
    predictedTime: number;
    confidence: number;
    factors: {
        timeOfDay: number;
        dayOfWeek: number;
        weather: number;
        traffic: number;
        historical: number;
    };
    alternativeTimes: {
        optimistic: number;
        realistic: number;
        pessimistic: number;
    };
    lastUpdated: Date;
}
export interface AlternativeRoute {
    routeId: string;
    routeName: string;
    totalTime: number;
    totalCost: number;
    efficiency: number;
    reasons: string[];
    stops: string[];
}
export interface TrendAnalysis {
    routeId: string;
    period: 'daily' | 'weekly' | 'monthly';
    trends: {
        ridership: {
            current: number;
            previous: number;
            change: number;
            trend: 'increasing' | 'decreasing' | 'stable';
        };
        efficiency: {
            current: number;
            previous: number;
            change: number;
            trend: 'improving' | 'declining' | 'stable';
        };
        safety: {
            current: number;
            previous: number;
            change: number;
            trend: 'safer' | 'riskier' | 'stable';
        };
        cost: {
            current: number;
            previous: number;
            change: number;
            trend: 'increasing' | 'decreasing' | 'stable';
        };
    };
    insights: string[];
    lastUpdated: Date;
}
export interface DemandForecast {
    routeId: string;
    timeSlot: string;
    predictedDemand: number;
    confidence: number;
    factors: {
        historical: number;
        weather: number;
        events: number;
        seasonality: number;
    };
    recommendations: string[];
    lastUpdated: Date;
}
export interface UserRecommendation {
    userId: string;
    recommendations: {
        routeId: string;
        routeName: string;
        reason: string;
        score: number;
        type: 'efficiency' | 'safety' | 'cost' | 'convenience';
    }[];
    preferences: {
        efficiency: number;
        safety: number;
        cost: number;
        convenience: number;
    };
    lastUpdated: Date;
}
declare class AnalyticsService {
    calculateRouteEfficiency(routeId: string): Promise<RouteEfficiencyScore>;
    predictTravelTime(routeId: string, fromStop: string, toStop: string, timeOfDay?: string): Promise<TravelTimePrediction>;
    findAlternativeRoutes(fromStop: string, toStop: string, maxTime?: number, maxCost?: number): Promise<AlternativeRoute[]>;
    analyzeTrends(routeId: string, period: 'daily' | 'weekly' | 'monthly'): Promise<TrendAnalysis>;
    forecastDemand(routeId: string, timeSlot: string): Promise<DemandForecast>;
    generateUserRecommendations(userId: string): Promise<UserRecommendation>;
    private calculateOperatingHours;
    private generateEfficiencyRecommendations;
    private calculateBaseTravelTime;
    private getTimeOfDayMultiplier;
    private getDayOfWeekMultiplier;
    private getWeatherFactor;
    private getTrafficFactor;
    private calculateHistoricalFactor;
    private generateAlternativeReasons;
    private calculatePreviousEfficiency;
    private generateTrendInsights;
    private calculateHistoricalDemand;
    private getWeatherDemandFactor;
    private getEventFactor;
    private getSeasonalityFactor;
    private generateDemandRecommendations;
    private analyzeUserPreferences;
    private calculateRecommendationScore;
    private generateRecommendationReason;
    private getRecommendationType;
}
declare const _default: AnalyticsService;
export default _default;
//# sourceMappingURL=analyticsService.d.ts.map