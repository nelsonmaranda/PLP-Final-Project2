declare class ScoringService {
    private isRunning;
    start(): void;
    stop(): void;
    calculateAllScores(): Promise<void>;
    calculateRouteScore(routeId: string): Promise<any>;
    getScoringStats(): Promise<{
        totalRoutes: number;
        scoredRoutes: number;
        totalReports: number;
        averageScore: any;
        lastCalculated: Date;
    }>;
}
declare const _default: ScoringService;
export default _default;
//# sourceMappingURL=scoringService.d.ts.map