import { Request, Response } from 'express';
export declare const apiLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const reportLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const authLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const deviceFingerprintLimiter: (req: Request, res: Response, next: any) => void;
declare global {
    namespace Express {
        interface Request {
            deviceFingerprint?: string;
        }
    }
}
//# sourceMappingURL=rateLimiter.d.ts.map