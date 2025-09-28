"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const mongoose_1 = require("mongoose");
class AnalyticsService {
    async calculateRouteEfficiency(routeId) {
        try {
            const route = await models_1.Route.findById(routeId);
            if (!route) {
                throw new Error('Route not found');
            }
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const reports = await models_1.Report.find({
                routeId: new mongoose_1.Types.ObjectId(routeId),
                createdAt: { $gte: thirtyDaysAgo }
            });
            const scores = await models_1.Score.find({
                routeId: new mongoose_1.Types.ObjectId(routeId),
                createdAt: { $gte: thirtyDaysAgo }
            });
            const onTimeReports = reports.filter(r => r.reportType === 'reliability' && r.severity === 'low');
            const reliabilityScore = reports.length > 0 ? (onTimeReports.length / reports.length) * 100 : 50;
            const speedReports = reports.filter(r => r.reportType === 'efficiency');
            const avgSpeedScore = speedReports.length > 0
                ? speedReports.reduce((sum, r) => sum + (r.severity === 'low' ? 80 : r.severity === 'medium' ? 60 : 40), 0) / speedReports.length
                : 60;
            const safetyReports = reports.filter(r => r.reportType === 'safety');
            const safetyScore = safetyReports.length > 0
                ? 100 - (safetyReports.reduce((sum, r) => sum + (r.severity === 'high' ? 30 : r.severity === 'medium' ? 15 : 5), 0) / safetyReports.length)
                : 80;
            const comfortReports = reports.filter(r => r.reportType === 'comfort');
            const comfortScore = comfortReports.length > 0
                ? comfortReports.reduce((sum, r) => sum + (r.severity === 'low' ? 90 : r.severity === 'medium' ? 70 : 50), 0) / comfortReports.length
                : 70;
            const avgFare = route.fare || 50;
            const costScore = Math.max(0, 100 - (avgFare - 30) * 2);
            const operatingHours = this.calculateOperatingHours(route.operatingHours);
            const frequencyScore = Math.min(100, operatingHours * 2);
            const weights = {
                reliability: 0.25,
                speed: 0.20,
                safety: 0.25,
                comfort: 0.15,
                cost: 0.10,
                frequency: 0.05
            };
            const efficiencyScore = (reliabilityScore * weights.reliability) +
                (speedScore * weights.speed) +
                (safetyScore * weights.safety) +
                (comfortScore * weights.comfort) +
                (costScore * weights.cost) +
                (frequencyScore * weights.frequency);
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
        }
        catch (error) {
            console.error('Error calculating route efficiency:', error);
            throw error;
        }
    }
    async predictTravelTime(routeId, fromStop, toStop, timeOfDay) {
        try {
            const route = await models_1.Route.findById(routeId);
            if (!route) {
                throw new Error('Route not found');
            }
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const reports = await models_1.Report.find({
                routeId: new mongoose_1.Types.ObjectId(routeId),
                createdAt: { $gte: thirtyDaysAgo },
                reportType: 'efficiency'
            });
            const baseTime = this.calculateBaseTravelTime(route, fromStop, toStop);
            const timeMultiplier = this.getTimeOfDayMultiplier(timeOfDay);
            const dayMultiplier = this.getDayOfWeekMultiplier();
            const weatherFactor = this.getWeatherFactor();
            const trafficFactor = this.getTrafficFactor(timeOfDay);
            const historicalFactor = this.calculateHistoricalFactor(reports);
            const predictedTime = Math.round(baseTime * timeMultiplier * dayMultiplier * weatherFactor * trafficFactor * historicalFactor);
            const confidence = Math.min(95, 50 + (reports.length * 2));
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
        }
        catch (error) {
            console.error('Error predicting travel time:', error);
            throw error;
        }
    }
    async findAlternativeRoutes(fromStop, toStop, maxTime, maxCost) {
        try {
            const routes = await models_1.Route.find({
                'stops.name': { $in: [fromStop, toStop] },
                isActive: true
            });
            const alternatives = [];
            for (const route of routes) {
                const fromIndex = route.stops.findIndex(s => s.name === fromStop);
                const toIndex = route.stops.findIndex(s => s.name === toStop);
                if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) {
                    continue;
                }
                const travelTime = this.calculateBaseTravelTime(route, fromStop, toStop);
                const cost = route.fare || 50;
                if (maxTime && travelTime > maxTime)
                    continue;
                if (maxCost && cost > maxCost)
                    continue;
                const efficiency = await this.calculateRouteEfficiency(route._id.toString());
                const efficiencyScore = efficiency.efficiencyScore;
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
            return alternatives.sort((a, b) => b.efficiency - a.efficiency);
        }
        catch (error) {
            console.error('Error finding alternative routes:', error);
            throw error;
        }
    }
    async analyzeTrends(routeId, period) {
        try {
            const now = new Date();
            let startDate;
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
            const currentReports = await models_1.Report.find({
                routeId: new mongoose_1.Types.ObjectId(routeId),
                createdAt: { $gte: startDate, $lt: now }
            });
            const previousReports = await models_1.Report.find({
                routeId: new mongoose_1.Types.ObjectId(routeId),
                createdAt: { $gte: previousStart, $lt: startDate }
            });
            const currentRidership = currentReports.length;
            const previousRidership = previousReports.length;
            const ridershipChange = previousRidership > 0
                ? ((currentRidership - previousRidership) / previousRidership) * 100
                : 0;
            const currentEfficiency = await this.calculateRouteEfficiency(routeId);
            const previousEfficiency = await this.calculatePreviousEfficiency(routeId, previousStart, startDate);
            const efficiencyChange = previousEfficiency > 0
                ? ((currentEfficiency.efficiencyScore - previousEfficiency) / previousEfficiency) * 100
                : 0;
            const currentSafety = currentReports.filter(r => r.reportType === 'safety').length;
            const previousSafety = previousReports.filter(r => r.reportType === 'safety').length;
            const safetyChange = previousSafety > 0
                ? ((currentSafety - previousSafety) / previousSafety) * 100
                : 0;
            const route = await models_1.Route.findById(routeId);
            const currentCost = route?.fare || 50;
            const costChange = 0;
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
                        previous: currentCost,
                        change: costChange,
                        trend: costChange > 5 ? 'increasing' : costChange < -5 ? 'decreasing' : 'stable'
                    }
                },
                insights,
                lastUpdated: new Date()
            };
        }
        catch (error) {
            console.error('Error analyzing trends:', error);
            throw error;
        }
    }
    async forecastDemand(routeId, timeSlot) {
        try {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const reports = await models_1.Report.find({
                routeId: new mongoose_1.Types.ObjectId(routeId),
                createdAt: { $gte: thirtyDaysAgo }
            });
            const historicalDemand = this.calculateHistoricalDemand(reports, timeSlot);
            const weatherFactor = this.getWeatherDemandFactor();
            const eventFactor = this.getEventFactor();
            const seasonalityFactor = this.getSeasonalityFactor();
            const predictedDemand = Math.min(100, Math.max(0, historicalDemand * weatherFactor * eventFactor * seasonalityFactor));
            const confidence = Math.min(95, 60 + (reports.length * 1.5));
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
        }
        catch (error) {
            console.error('Error forecasting demand:', error);
            throw error;
        }
    }
    async generateUserRecommendations(userId) {
        try {
            const userReports = await models_1.Report.find({ userId: new mongoose_1.Types.ObjectId(userId) });
            const preferences = this.analyzeUserPreferences(userReports);
            const routes = await models_1.Route.find({ isActive: true });
            const recommendations = [];
            for (const route of routes) {
                const efficiency = await this.calculateRouteEfficiency(route._id.toString());
                const score = this.calculateRecommendationScore(efficiency, preferences);
                if (score > 60) {
                    recommendations.push({
                        routeId: route._id.toString(),
                        routeName: route.name,
                        reason: this.generateRecommendationReason(efficiency, preferences),
                        score: Math.round(score),
                        type: this.getRecommendationType(efficiency, preferences)
                    });
                }
            }
            const topRecommendations = recommendations
                .sort((a, b) => b.score - a.score)
                .slice(0, 5);
            return {
                userId,
                recommendations: topRecommendations,
                preferences,
                lastUpdated: new Date()
            };
        }
        catch (error) {
            console.error('Error generating user recommendations:', error);
            throw error;
        }
    }
    calculateOperatingHours(operatingHours) {
        if (!operatingHours)
            return 12;
        const start = parseInt(operatingHours.start.split(':')[0]);
        const end = parseInt(operatingHours.end.split(':')[0]);
        return end - start;
    }
    generateEfficiencyRecommendations(factors) {
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
    calculateBaseTravelTime(route, fromStop, toStop) {
        const fromIndex = route.stops.findIndex((s) => s.name === fromStop);
        const toIndex = route.stops.findIndex((s) => s.name === toStop);
        if (fromIndex === -1 || toIndex === -1)
            return 30;
        const stopCount = toIndex - fromIndex;
        const baseTime = stopCount * 3;
        return Math.max(5, baseTime);
    }
    getTimeOfDayMultiplier(timeOfDay) {
        if (!timeOfDay)
            return 1.0;
        const hour = parseInt(timeOfDay.split(':')[0]);
        if (hour >= 7 && hour <= 9)
            return 1.3;
        if (hour >= 17 && hour <= 19)
            return 1.4;
        if (hour >= 22 || hour <= 5)
            return 0.8;
        return 1.0;
    }
    getDayOfWeekMultiplier() {
        const day = new Date().getDay();
        if (day === 0 || day === 6)
            return 0.9;
        return 1.0;
    }
    getWeatherFactor() {
        return 1.1;
    }
    getTrafficFactor(timeOfDay) {
        if (!timeOfDay)
            return 1.0;
        const hour = parseInt(timeOfDay.split(':')[0]);
        if (hour >= 7 && hour <= 9)
            return 1.2;
        if (hour >= 17 && hour <= 19)
            return 1.3;
        return 1.0;
    }
    calculateHistoricalFactor(reports) {
        if (reports.length === 0)
            return 1.0;
        const avgSeverity = reports.reduce((sum, r) => {
            const severityValue = r.severity === 'low' ? 1 : r.severity === 'medium' ? 1.2 : 1.5;
            return sum + severityValue;
        }, 0) / reports.length;
        return Math.max(0.8, 2.0 - avgSeverity);
    }
    generateAlternativeReasons(route, travelTime, cost, efficiency) {
        const reasons = [];
        if (efficiency > 80)
            reasons.push('Highly efficient route');
        if (travelTime < 20)
            reasons.push('Fast travel time');
        if (cost < 40)
            reasons.push('Affordable fare');
        if (route.stops.length > 5)
            reasons.push('Multiple stops available');
        return reasons;
    }
    async calculatePreviousEfficiency(routeId, start, end) {
        return 70;
    }
    generateTrendInsights(trends) {
        const insights = [];
        if (trends.ridership.change > 10) {
            insights.push('Ridership is increasing significantly');
        }
        else if (trends.ridership.change < -10) {
            insights.push('Ridership is declining, consider promotional activities');
        }
        if (trends.efficiency.change > 5) {
            insights.push('Route efficiency is improving');
        }
        else if (trends.efficiency.change < -5) {
            insights.push('Route efficiency needs attention');
        }
        if (trends.safety.change < -10) {
            insights.push('Safety incidents have decreased');
        }
        else if (trends.safety.change > 10) {
            insights.push('Safety concerns are increasing');
        }
        return insights;
    }
    calculateHistoricalDemand(reports, timeSlot) {
        return Math.min(100, reports.length * 2);
    }
    getWeatherDemandFactor() {
        return 1.0;
    }
    getEventFactor() {
        return 1.0;
    }
    getSeasonalityFactor() {
        const month = new Date().getMonth();
        if (month >= 2 && month <= 4)
            return 1.1;
        if (month >= 9 && month <= 11)
            return 1.05;
        return 1.0;
    }
    generateDemandRecommendations(demand, timeSlot) {
        const recommendations = [];
        if (demand > 80) {
            recommendations.push('Consider increasing frequency during this time');
        }
        else if (demand < 30) {
            recommendations.push('Low demand period, consider reducing frequency');
        }
        return recommendations;
    }
    analyzeUserPreferences(userReports) {
        return {
            efficiency: 0.3,
            safety: 0.3,
            cost: 0.2,
            convenience: 0.2
        };
    }
    calculateRecommendationScore(efficiency, preferences) {
        return (efficiency.factors.reliability * preferences.efficiency +
            efficiency.factors.safety * preferences.safety +
            (100 - efficiency.factors.cost) * preferences.cost +
            efficiency.factors.comfort * preferences.convenience);
    }
    generateRecommendationReason(efficiency, preferences) {
        if (efficiency.factors.safety > 85)
            return 'High safety rating';
        if (efficiency.factors.reliability > 85)
            return 'Very reliable service';
        if (efficiency.factors.cost < 40)
            return 'Great value for money';
        return 'Good overall performance';
    }
    getRecommendationType(efficiency, preferences) {
        const scores = {
            efficiency: efficiency.factors.reliability,
            safety: efficiency.factors.safety,
            cost: 100 - efficiency.factors.cost,
            convenience: efficiency.factors.comfort
        };
        return Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    }
}
exports.default = new AnalyticsService();
//# sourceMappingURL=analyticsService.js.map