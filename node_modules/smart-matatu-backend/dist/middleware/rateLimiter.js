"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deviceFingerprintLimiter = exports.authLimiter = exports.reportLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.reportLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: 'Too many reports submitted, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: 'Too many login attempts, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
});
const deviceFingerprintLimiter = (req, res, next) => {
    const deviceFingerprint = req.headers['x-device-fingerprint'];
    if (!deviceFingerprint) {
        res.status(400).json({
            success: false,
            message: 'Device fingerprint required'
        });
        return;
    }
    req.deviceFingerprint = deviceFingerprint;
    next();
};
exports.deviceFingerprintLimiter = deviceFingerprintLimiter;
//# sourceMappingURL=rateLimiter.js.map