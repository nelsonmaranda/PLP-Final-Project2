import cron from 'node-cron'
import Score from '../models/Score'
import Report from '../models/Report'
import Route from '../models/Route'

class ScoringService {
  private isRunning = false

  // Start the scoring service
  start() {
    console.log('Starting scoring service...')
    
    // Run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
      await this.calculateAllScores()
    })

    // Run immediately on startup
    this.calculateAllScores()
  }

  // Stop the scoring service
  stop() {
    console.log('Stopping scoring service...')
    cron.getTasks().forEach(task => task.stop())
  }

  // Calculate scores for all active routes
  async calculateAllScores() {
    if (this.isRunning) {
      console.log('Scoring calculation already in progress, skipping...')
      return
    }

    this.isRunning = true
    console.log('Starting score calculation for all routes...')

    try {
      const routes = await Route.find({ isActive: true })
      const results = []

      for (const route of routes) {
        try {
          const score = await this.calculateRouteScore(route._id.toString())
          results.push({
            routeId: route._id,
            routeName: route.name,
            score: (score as any).overall,
            totalReports: (score as any).totalReports
          })
        } catch (error) {
          console.error(`Error calculating score for route ${route._id}:`, error)
        }
      }

      console.log(`Score calculation completed for ${results.length} routes`)
      console.log('Top 5 performing routes:', results
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(r => `${r.routeName}: ${r.score.toFixed(2)}`)
      )

    } catch (error) {
      console.error('Error in score calculation:', error)
    } finally {
      this.isRunning = false
    }
  }

  // Calculate score for a specific route
  async calculateRouteScore(routeId: string) {
    const reports = await Report.find({
      routeId,
      status: { $in: ['verified', 'resolved'] }
    })

    if (reports.length === 0) {
      // No reports, return default scores
      const defaultScore = {
        routeId,
        reliability: 0,
        safety: 0,
        punctuality: 0,
        comfort: 0,
        overall: 0,
        totalReports: 0,
        lastCalculated: new Date()
      }

      await Score.findOneAndUpdate(
        { routeId },
        defaultScore,
        { upsert: true, new: true }
      )

      return defaultScore
    }

    // Calculate scores based on report types and severity
    let reliabilityScore = 0
    let safetyScore = 0
    let punctualityScore = 0
    let comfortScore = 0

    const severityWeights = { low: 1, medium: 2, high: 3, critical: 4 }
    const reportTypeWeights: Record<string, Record<string, number>> = {
      delay: { reliability: 0.4, punctuality: 0.6 },
      safety: { safety: 1.0 },
      crowding: { comfort: 0.8, reliability: 0.2 },
      breakdown: { reliability: 0.6, safety: 0.4 },
      other: { reliability: 0.3, safety: 0.3, comfort: 0.4 }
    }

    for (const report of reports) {
      const severityWeight = severityWeights[report.severity] || 1
      const typeWeights = reportTypeWeights[report.reportType] || { 
        reliability: 0.25, 
        safety: 0.25, 
        punctuality: 0.25, 
        comfort: 0.25 
      }

      // Negative impact based on severity
      const impact = -severityWeight * 0.5

      if (typeWeights.reliability) reliabilityScore += impact * typeWeights.reliability
      if (typeWeights.safety) safetyScore += impact * typeWeights.safety
      if (typeWeights.punctuality) punctualityScore += impact * typeWeights.punctuality
      if (typeWeights.comfort) comfortScore += impact * typeWeights.comfort
    }

    // Normalize scores to 0-5 range, starting from 5 (perfect score)
    const normalizeScore = (score: number) => Math.max(0, Math.min(5, 5 + score))

    const reliability = normalizeScore(reliabilityScore);
    const safety = normalizeScore(safetyScore);
    const punctuality = normalizeScore(punctualityScore);
    const comfort = normalizeScore(comfortScore);
    const overall = (reliability + safety + punctuality + comfort) / 4;

    const finalScores: any = {
      routeId,
      reliability,
      safety,
      punctuality,
      comfort,
      overall,
      totalReports: reports.length,
      lastCalculated: new Date()
    };

    // Save or update score
    await Score.findOneAndUpdate(
      { routeId },
      finalScores,
      { upsert: true, new: true }
    )

    return finalScores
  }

  // Get scoring statistics
  async getScoringStats() {
    const totalRoutes = await Route.countDocuments({ isActive: true })
    const scoredRoutes = await Score.countDocuments()
    const totalReports = await Report.countDocuments({ 
      status: { $in: ['verified', 'resolved'] } 
    })

    const avgScore = await Score.aggregate([
      { $group: { _id: null, average: { $avg: '$overall' } } }
    ])

    return {
      totalRoutes,
      scoredRoutes,
      totalReports,
      averageScore: avgScore[0]?.average || 0,
      lastCalculated: new Date()
    }
  }
}

export default new ScoringService()
