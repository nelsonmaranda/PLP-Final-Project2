import { Route, Report, Score } from '../models';
import { Types } from 'mongoose';

export interface RouteEfficiencyScore {
  routeId: string;
  routeName: string;
  efficiencyScore: number; // 0-100
  factors: {
    reliability: number; // Based on on-time performance
    speed: number; // Average speed vs expected
    safety: number; // Safety incident rate
    comfort: number; // User comfort ratings
    cost: number; // Value for money
    frequency: number; // Service frequency
  };
  recommendations: string[];
  lastUpdated: Date;
}

export interface TravelTimePrediction {
  routeId: string;
  fromStop: string;
  toStop: string;
  predictedTime: number; // in minutes
  confidence: number; // 0-100
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
  predictedDemand: number; // 0-100
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

class AnalyticsService {
  /**
   * Calculate comprehensive route efficiency score
   */
  async calculateRouteEfficiency(routeId: string): Promise<RouteEfficiencyScore> {
    try {
      const route = await Route.findById(routeId);
      if (!route) {
        throw new Error('Route not found');
      }

      // Get recent reports and scores
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const reports = await Report.find({
        routeId: new Types.ObjectId(routeId),
        createdAt: { $gte: thirtyDaysAgo }
      });

      const scores = await Score.find({
        routeId: new Types.ObjectId(routeId),
        createdAt: { $gte: thirtyDaysAgo }
      });

      // Calculate reliability score (on-time performance)
      const onTimeReports = reports.filter(r => r.reportType === 'reliability' && r.severity === 'low');
      const reliabilityScore = reports.length > 0 ? (onTimeReports.length / reports.length) * 100 : 50;

      // Calculate speed score (based on travel time reports)
      const speedReports = reports.filter(r => r.reportType === 'efficiency');
      const avgSpeedScore = speedReports.length > 0 
        ? speedReports.reduce((sum, r) => sum + (r.severity === 'low' ? 80 : r.severity === 'medium' ? 60 : 40), 0) / speedReports.length
        : 60;

      // Calculate safety score
      const safetyReports = reports.filter(r => r.reportType === 'safety');
      const safetyScore = safetyReports.length > 0
        ? 100 - (safetyReports.reduce((sum, r) => sum + (r.severity === 'high' ? 30 : r.severity === 'medium' ? 15 : 5), 0) / safetyReports.length)
        : 80;

      // Calculate comfort score (based on user ratings)
      const comfortReports = reports.filter(r => r.reportType === 'comfort');
      const comfortScore = comfortReports.length > 0
        ? comfortReports.reduce((sum, r) => sum + (r.severity === 'low' ? 90 : r.severity === 'medium' ? 70 : 50), 0) / comfortReports.length
        : 70;

      // Calculate cost efficiency (value for money)
      const avgFare = route.fare || 50;
      const costScore = Math.max(0, 100 - (avgFare - 30) * 2); // Penalize high fares

      // Calculate frequency score (based on operating hours)
      const operatingHours = this.calculateOperatingHours(route.operatingHours);
      const frequencyScore = Math.min(100, operatingHours * 2);

      // Calculate overall efficiency score
      const weights = {
        reliability: 0.25,
        speed: 0.20,
        safety: 0.25,
        comfort: 0.15,
        cost: 0.10,
        frequency: 0.05
      };

      const efficiencyScore = 
        (reliabilityScore * weights.reliability) +
        (speedScore * weights.speed) +
        (safetyScore * weights.safety) +
        (comfortScore * weights.comfort) +
        (costScore * weights.cost) +
        (frequencyScore * weights.frequency);

      // Generate recommendations
      const recommendations = this.generateEfficiencyRecommendations({
        reliability: reliabilityScore,
        speed: speedScore,
        safety: safetyScore,
        comfort: comfortScore,
        cost: costScore,
        frequency: frequencyScore
      });

      return {
        routeId,
        routeName: route.name,
        efficiencyScore: Math.round(efficiencyScore),
        factors: {
          reliability: Math.round(reliabilityScore),
          speed: Math.round(speedScore),
          safety: Math.round(safetyScore),
          comfort: Math.round(comfortScore),
          cost: Math.round(costScore),
          frequency: Math.round(frequencyScore)
        },
        recommendations,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error calculating route efficiency:', error);
      throw error;
    }
  }

  /**
   * Predict travel time between stops
   */
  async predictTravelTime(
    routeId: string, 
    fromStop: string, 
    toStop: string, 
    timeOfDay?: string
  ): Promise<TravelTimePrediction> {
    try {
      const route = await Route.findById(routeId);
      if (!route) {
        throw new Error('Route not found');
      }

      // Get historical data for the route
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const reports = await Report.find({
        routeId: new Types.ObjectId(routeId),
        createdAt: { $gte: thirtyDaysAgo },
        reportType: 'efficiency'
      });

      // Calculate base travel time (simplified algorithm)
      const baseTime = this.calculateBaseTravelTime(route, fromStop, toStop);
      
      // Apply time-of-day multiplier
      const timeMultiplier = this.getTimeOfDayMultiplier(timeOfDay);
      
      // Apply day-of-week multiplier
      const dayMultiplier = this.getDayOfWeekMultiplier();
      
      // Apply weather factor (simplified)
      const weatherFactor = this.getWeatherFactor();
      
      // Apply traffic factor
      const trafficFactor = this.getTrafficFactor(timeOfDay);
      
      // Apply historical performance factor
      const historicalFactor = this.calculateHistoricalFactor(reports);

      // Calculate predicted time
      const predictedTime = Math.round(
        baseTime * timeMultiplier * dayMultiplier * weatherFactor * trafficFactor * historicalFactor
      );

      // Calculate confidence based on data availability
      const confidence = Math.min(95, 50 + (reports.length * 2));

      // Generate alternative time estimates
      const alternativeTimes = {
        optimistic: Math.round(predictedTime * 0.8),
        realistic: predictedTime,
        pessimistic: Math.round(predictedTime * 1.3)
      };

      return {
        routeId,
        fromStop,
        toStop,
        predictedTime,
        confidence,
        factors: {
          timeOfDay: timeMultiplier,
          dayOfWeek: dayMultiplier,
          weather: weatherFactor,
          traffic: trafficFactor,
          historical: historicalFactor
        },
        alternativeTimes,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error predicting travel time:', error);
      throw error;
    }
  }

  /**
   * Find alternative routes
   */
  async findAlternativeRoutes(
    fromStop: string,
    toStop: string,
    maxTime?: number,
    maxCost?: number
  ): Promise<AlternativeRoute[]> {
    try {
      // Find all routes that serve both stops
      const routes = await Route.find({
        'stops.name': { $in: [fromStop, toStop] },
        isActive: true
      });

      const alternatives: AlternativeRoute[] = [];

      for (const route of routes) {
        const fromIndex = route.stops.findIndex(s => s.name === fromStop);
        const toIndex = route.stops.findIndex(s => s.name === toStop);

        if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) {
          continue; // Route doesn't connect the stops properly
        }

        // Calculate travel time and cost
        const travelTime = this.calculateBaseTravelTime(route, fromStop, toStop);
        const cost = route.fare || 50;

        // Apply filters
        if (maxTime && travelTime > maxTime) continue;
        if (maxCost && cost > maxCost) continue;

        // Calculate efficiency score
        const efficiency = await this.calculateRouteEfficiency(route._id.toString());
        const efficiencyScore = efficiency.efficiencyScore;

        // Generate reasons for recommendation
        const reasons = this.generateAlternativeReasons(route, travelTime, cost, efficiencyScore);

        alternatives.push({
          routeId: route._id.toString(),
          routeName: route.name,
          totalTime: travelTime,
          totalCost: cost,
          efficiency: efficiencyScore,
          reasons,
          stops: route.stops.slice(fromIndex, toIndex + 1).map(s => s.name)
        });
      }

      // Sort by efficiency score (highest first)
      return alternatives.sort((a, b) => b.efficiency - a.efficiency);
    } catch (error) {
      console.error('Error finding alternative routes:', error);
      throw error;
    }
  }

  /**
   * Analyze trends for a route
   */
  async analyzeTrends(routeId: string, period: 'daily' | 'weekly' | 'monthly'): Promise<TrendAnalysis> {
    try {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'daily':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'weekly':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      const previousStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));

      // Get current period data
      const currentReports = await Report.find({
        routeId: new Types.ObjectId(routeId),
        createdAt: { $gte: startDate, $lt: now }
      });

      // Get previous period data
      const previousReports = await Report.find({
        routeId: new Types.ObjectId(routeId),
        createdAt: { $gte: previousStart, $lt: startDate }
      });

      // Calculate ridership trend
      const currentRidership = currentReports.length;
      const previousRidership = previousReports.length;
      const ridershipChange = previousRidership > 0 
        ? ((currentRidership - previousRidership) / previousRidership) * 100 
        : 0;

      // Calculate efficiency trend
      const currentEfficiency = await this.calculateRouteEfficiency(routeId);
      const previousEfficiency = await this.calculatePreviousEfficiency(routeId, previousStart, startDate);
      const efficiencyChange = previousEfficiency > 0 
        ? ((currentEfficiency.efficiencyScore - previousEfficiency) / previousEfficiency) * 100 
        : 0;

      // Calculate safety trend
      const currentSafety = currentReports.filter(r => r.reportType === 'safety').length;
      const previousSafety = previousReports.filter(r => r.reportType === 'safety').length;
      const safetyChange = previousSafety > 0 
        ? ((currentSafety - previousSafety) / previousSafety) * 100 
        : 0;

      // Calculate cost trend (simplified)
      const route = await Route.findById(routeId);
      const currentCost = route?.fare || 50;
      const costChange = 0; // Would need historical fare data

      // Generate insights
      const insights = this.generateTrendInsights({
        ridership: { current: currentRidership, change: ridershipChange },
        efficiency: { current: currentEfficiency.efficiencyScore, change: efficiencyChange },
        safety: { current: currentSafety, change: safetyChange },
        cost: { current: currentCost, change: costChange }
      });

      return {
        routeId,
        period,
        trends: {
          ridership: {
            current: currentRidership,
            previous: previousRidership,
            change: Math.round(ridershipChange * 100) / 100,
            trend: ridershipChange > 5 ? 'increasing' : ridershipChange < -5 ? 'decreasing' : 'stable'
          },
          efficiency: {
            current: currentEfficiency.efficiencyScore,
            previous: previousEfficiency,
            change: Math.round(efficiencyChange * 100) / 100,
            trend: efficiencyChange > 5 ? 'improving' : efficiencyChange < -5 ? 'declining' : 'stable'
          },
          safety: {
            current: currentSafety,
            previous: previousSafety,
            change: Math.round(safetyChange * 100) / 100,
            trend: safetyChange < -10 ? 'safer' : safetyChange > 10 ? 'riskier' : 'stable'
          },
          cost: {
            current: currentCost,
            previous: currentCost, // Would need historical data
            change: costChange,
            trend: costChange > 5 ? 'increasing' : costChange < -5 ? 'decreasing' : 'stable'
          }
        },
        insights,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error analyzing trends:', error);
      throw error;
    }
  }

  /**
   * Forecast demand for a route
   */
  async forecastDemand(routeId: string, timeSlot: string): Promise<DemandForecast> {
    try {
      // Get historical data
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const reports = await Report.find({
        routeId: new Types.ObjectId(routeId),
        createdAt: { $gte: thirtyDaysAgo }
      });

      // Calculate historical demand
      const historicalDemand = this.calculateHistoricalDemand(reports, timeSlot);

      // Apply weather factor
      const weatherFactor = this.getWeatherDemandFactor();

      // Apply event factor (simplified)
      const eventFactor = this.getEventFactor();

      // Apply seasonality factor
      const seasonalityFactor = this.getSeasonalityFactor();

      // Calculate predicted demand
      const predictedDemand = Math.min(100, Math.max(0,
        historicalDemand * weatherFactor * eventFactor * seasonalityFactor
      ));

      // Calculate confidence
      const confidence = Math.min(95, 60 + (reports.length * 1.5));

      // Generate recommendations
      const recommendations = this.generateDemandRecommendations(predictedDemand, timeSlot);

      return {
        routeId,
        timeSlot,
        predictedDemand: Math.round(predictedDemand),
        confidence,
        factors: {
          historical: historicalDemand,
          weather: weatherFactor,
          events: eventFactor,
          seasonality: seasonalityFactor
        },
        recommendations,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error forecasting demand:', error);
      throw error;
    }
  }

  /**
   * Generate user recommendations
   */
  async generateUserRecommendations(userId: string): Promise<UserRecommendation> {
    try {
      // Get user's historical data
      const userReports = await Report.find({ userId: new Types.ObjectId(userId) });
      
      // Analyze user preferences
      const preferences = this.analyzeUserPreferences(userReports);
      
      // Get all active routes
      const routes = await Route.find({ isActive: true });
      
      const recommendations = [];
      
      for (const route of routes) {
        const efficiency = await this.calculateRouteEfficiency(route._id.toString());
        
        // Calculate recommendation score based on user preferences
        const score = this.calculateRecommendationScore(efficiency, preferences);
        
        if (score > 60) { // Only recommend routes with score > 60
          recommendations.push({
            routeId: route._id.toString(),
            routeName: route.name,
            reason: this.generateRecommendationReason(efficiency, preferences),
            score: Math.round(score),
            type: this.getRecommendationType(efficiency, preferences)
          });
        }
      }
      
      // Sort by score and take top 5
      const topRecommendations = recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      return {
        userId,
        recommendations: topRecommendations,
        preferences,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error generating user recommendations:', error);
      throw error;
    }
  }

  // Helper methods
  private calculateOperatingHours(operatingHours: any): number {
    if (!operatingHours) return 12;
    const start = parseInt(operatingHours.start.split(':')[0]);
    const end = parseInt(operatingHours.end.split(':')[0]);
    return end - start;
  }

  private generateEfficiencyRecommendations(factors: any): string[] {
    const recommendations = [];
    
    if (factors.reliability < 70) {
      recommendations.push('Improve on-time performance through better scheduling');
    }
    if (factors.speed < 60) {
      recommendations.push('Optimize route to reduce travel time');
    }
    if (factors.safety < 80) {
      recommendations.push('Address safety concerns and improve driver training');
    }
    if (factors.comfort < 70) {
      recommendations.push('Upgrade vehicles and improve passenger comfort');
    }
    if (factors.cost < 60) {
      recommendations.push('Review fare structure for better value proposition');
    }
    if (factors.frequency < 50) {
      recommendations.push('Increase service frequency during peak hours');
    }
    
    return recommendations;
  }

  private calculateBaseTravelTime(route: any, fromStop: string, toStop: string): number {
    // Simplified calculation based on distance and stops
    const fromIndex = route.stops.findIndex((s: any) => s.name === fromStop);
    const toIndex = route.stops.findIndex((s: any) => s.name === toStop);
    
    if (fromIndex === -1 || toIndex === -1) return 30;
    
    const stopCount = toIndex - fromIndex;
    const baseTime = stopCount * 3; // 3 minutes per stop
    return Math.max(5, baseTime);
  }

  private getTimeOfDayMultiplier(timeOfDay?: string): number {
    if (!timeOfDay) return 1.0;
    
    const hour = parseInt(timeOfDay.split(':')[0]);
    if (hour >= 7 && hour <= 9) return 1.3; // Morning rush
    if (hour >= 17 && hour <= 19) return 1.4; // Evening rush
    if (hour >= 22 || hour <= 5) return 0.8; // Night time
    return 1.0; // Normal time
  }

  private getDayOfWeekMultiplier(): number {
    const day = new Date().getDay();
    if (day === 0 || day === 6) return 0.9; // Weekend
    return 1.0; // Weekday
  }

  private getWeatherFactor(): number {
    // Simplified weather factor
    return 1.1; // Assume slight delay due to weather
  }

  private getTrafficFactor(timeOfDay?: string): number {
    if (!timeOfDay) return 1.0;
    
    const hour = parseInt(timeOfDay.split(':')[0]);
    if (hour >= 7 && hour <= 9) return 1.2; // Morning rush
    if (hour >= 17 && hour <= 19) return 1.3; // Evening rush
    return 1.0;
  }

  private calculateHistoricalFactor(reports: any[]): number {
    if (reports.length === 0) return 1.0;
    
    const avgSeverity = reports.reduce((sum, r) => {
      const severityValue = r.severity === 'low' ? 1 : r.severity === 'medium' ? 1.2 : 1.5;
      return sum + severityValue;
    }, 0) / reports.length;
    
    return Math.max(0.8, 2.0 - avgSeverity);
  }

  private generateAlternativeReasons(route: any, travelTime: number, cost: number, efficiency: number): string[] {
    const reasons = [];
    
    if (efficiency > 80) reasons.push('Highly efficient route');
    if (travelTime < 20) reasons.push('Fast travel time');
    if (cost < 40) reasons.push('Affordable fare');
    if (route.stops.length > 5) reasons.push('Multiple stops available');
    
    return reasons;
  }

  private async calculatePreviousEfficiency(routeId: string, start: Date, end: Date): Promise<number> {
    // Simplified calculation for previous efficiency
    return 70; // Would need actual historical calculation
  }

  private generateTrendInsights(trends: any): string[] {
    const insights = [];
    
    if (trends.ridership.change > 10) {
      insights.push('Ridership is increasing significantly');
    } else if (trends.ridership.change < -10) {
      insights.push('Ridership is declining, consider promotional activities');
    }
    
    if (trends.efficiency.change > 5) {
      insights.push('Route efficiency is improving');
    } else if (trends.efficiency.change < -5) {
      insights.push('Route efficiency needs attention');
    }
    
    if (trends.safety.change < -10) {
      insights.push('Safety incidents have decreased');
    } else if (trends.safety.change > 10) {
      insights.push('Safety concerns are increasing');
    }
    
    return insights;
  }

  private calculateHistoricalDemand(reports: any[], timeSlot: string): number {
    // Simplified demand calculation
    return Math.min(100, reports.length * 2);
  }

  private getWeatherDemandFactor(): number {
    return 1.0; // Simplified
  }

  private getEventFactor(): number {
    return 1.0; // Simplified
  }

  private getSeasonalityFactor(): number {
    const month = new Date().getMonth();
    // Higher demand during certain months
    if (month >= 2 && month <= 4) return 1.1; // March-May
    if (month >= 9 && month <= 11) return 1.05; // September-November
    return 1.0;
  }

  private generateDemandRecommendations(demand: number, timeSlot: string): string[] {
    const recommendations = [];
    
    if (demand > 80) {
      recommendations.push('Consider increasing frequency during this time');
    } else if (demand < 30) {
      recommendations.push('Low demand period, consider reducing frequency');
    }
    
    return recommendations;
  }

  private analyzeUserPreferences(userReports: any[]): any {
    // Analyze user's historical behavior to determine preferences
    return {
      efficiency: 0.3,
      safety: 0.3,
      cost: 0.2,
      convenience: 0.2
    };
  }

  private calculateRecommendationScore(efficiency: RouteEfficiencyScore, preferences: any): number {
    return (
      efficiency.factors.reliability * preferences.efficiency +
      efficiency.factors.safety * preferences.safety +
      (100 - efficiency.factors.cost) * preferences.cost +
      efficiency.factors.comfort * preferences.convenience
    );
  }

  private generateRecommendationReason(efficiency: RouteEfficiencyScore, preferences: any): string {
    if (efficiency.factors.safety > 85) return 'High safety rating';
    if (efficiency.factors.reliability > 85) return 'Very reliable service';
    if (efficiency.factors.cost < 40) return 'Great value for money';
    return 'Good overall performance';
  }

  private getRecommendationType(efficiency: RouteEfficiencyScore, preferences: any): 'efficiency' | 'safety' | 'cost' | 'convenience' {
    const scores = {
      efficiency: efficiency.factors.reliability,
      safety: efficiency.factors.safety,
      cost: 100 - efficiency.factors.cost,
      convenience: efficiency.factors.comfort
    };
    
    return Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b) as any;
  }
}

export default new AnalyticsService();
