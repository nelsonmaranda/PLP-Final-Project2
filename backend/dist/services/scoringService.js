"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const Score_1 = __importDefault(require("../models/Score"));
const Report_1 = __importDefault(require("../models/Report"));
const Route_1 = __importDefault(require("../models/Route"));
class ScoringService {
    constructor() {
        this.isRunning = false;
    }
    start() {
        console.log('Starting scoring service...');
        node_cron_1.default.schedule('0 * * * *', async () => {
            await this.calculateAllScores();
        });
        this.calculateAllScores();
    }
    stop() {
        console.log('Stopping scoring service...');
        node_cron_1.default.getTasks().forEach(task => task.stop());
    }
    async calculateAllScores() {
        if (this.isRunning) {
            console.log('Scoring calculation already in progress, skipping...');
            return;
        }
        this.isRunning = true;
        console.log('Starting score calculation for all routes...');
        try {
            const routes = await Route_1.default.find({ isActive: true });
            const results = [];
            for (const route of routes) {
                try {
                    const score = await this.calculateRouteScore(route._id.toString());
                    results.push({
                        routeId: route._id,
                        routeName: route.name,
                        score: score.overall,
                        totalReports: score.totalReports
                    });
                }
                catch (error) {
                    console.error(`Error calculating score for route ${route._id}:`, error);
                }
            }
            console.log(`Score calculation completed for ${results.length} routes`);
            console.log('Top 5 performing routes:', results
                .sort((a, b) => b.score - a.score)
                .slice(0, 5)
                .map(r => `${r.routeName}: ${r.score.toFixed(2)}`));
        }
        catch (error) {
            console.error('Error in score calculation:', error);
        }
        finally {
            this.isRunning = false;
        }
    }
    async calculateRouteScore(routeId) {
        const reports = await Report_1.default.find({
            routeId,
            status: { $in: ['verified', 'resolved'] }
        });
        if (reports.length === 0) {
            const defaultScore = {
                routeId,
                reliability: 0,
                safety: 0,
                punctuality: 0,
                comfort: 0,
                overall: 0,
                totalReports: 0,
                lastCalculated: new Date()
            };
            await Score_1.default.findOneAndUpdate({ routeId }, defaultScore, { upsert: true, new: true });
            return defaultScore;
        }
        let reliabilityScore = 0;
        let safetyScore = 0;
        let punctualityScore = 0;
        let comfortScore = 0;
        const severityWeights = { low: 1, medium: 2, high: 3, critical: 4 };
        const reportTypeWeights = {
            delay: { reliability: 0.4, punctuality: 0.6 },
            safety: { safety: 1.0 },
            crowding: { comfort: 0.8, reliability: 0.2 },
            breakdown: { reliability: 0.6, safety: 0.4 },
            other: { reliability: 0.3, safety: 0.3, comfort: 0.4 }
        };
        for (const report of reports) {
            const severityWeight = severityWeights[report.severity] || 1;
            const typeWeights = reportTypeWeights[report.reportType] || {
                reliability: 0.25,
                safety: 0.25,
                punctuality: 0.25,
                comfort: 0.25
            };
            const impact = -severityWeight * 0.5;
            if (typeWeights.reliability)
                reliabilityScore += impact * typeWeights.reliability;
            if (typeWeights.safety)
                safetyScore += impact * typeWeights.safety;
            if (typeWeights.punctuality)
                punctualityScore += impact * typeWeights.punctuality;
            if (typeWeights.comfort)
                comfortScore += impact * typeWeights.comfort;
        }
        const normalizeScore = (score) => Math.max(0, Math.min(5, 5 + score));
        const reliability = normalizeScore(reliabilityScore);
        const safety = normalizeScore(safetyScore);
        const punctuality = normalizeScore(punctualityScore);
        const comfort = normalizeScore(comfortScore);
        const overall = (reliability + safety + punctuality + comfort) / 4;
        const finalScores = {
            routeId,
            reliability,
            safety,
            punctuality,
            comfort,
            overall,
            totalReports: reports.length,
            lastCalculated: new Date()
        };
        await Score_1.default.findOneAndUpdate({ routeId }, finalScores, { upsert: true, new: true });
        return finalScores;
    }
    async getScoringStats() {
        const totalRoutes = await Route_1.default.countDocuments({ isActive: true });
        const scoredRoutes = await Score_1.default.countDocuments();
        const totalReports = await Report_1.default.countDocuments({
            status: { $in: ['verified', 'resolved'] }
        });
        const avgScore = await Score_1.default.aggregate([
            { $group: { _id: null, average: { $avg: '$overall' } } }
        ]);
        return {
            totalRoutes,
            scoredRoutes,
            totalReports,
            averageScore: avgScore[0]?.average || 0,
            lastCalculated: new Date()
        };
    }
}
exports.default = new ScoringService();
//# sourceMappingURL=scoringService.js.map