"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.locationQuerySchema = exports.paginationSchema = exports.validateQuery = exports.validate = exports.routeSchema = exports.reportSchema = exports.userLoginSchema = exports.userRegistrationSchema = void 0;
const zod_1 = require("zod");
exports.userRegistrationSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    displayName: zod_1.z.string().min(2, 'Display name must be at least 2 characters').max(50, 'Display name too long')
});
exports.userLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required')
});
exports.reportSchema = zod_1.z.object({
    routeId: zod_1.z.string().min(1, 'Route ID is required'),
    reportType: zod_1.z.enum(['delay', 'safety', 'crowding', 'breakdown', 'other']),
    description: zod_1.z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description too long'),
    location: zod_1.z.object({
        coordinates: zod_1.z.array(zod_1.z.number()).length(2, 'Coordinates must be [longitude, latitude]'),
        address: zod_1.z.string().optional()
    }),
    severity: zod_1.z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
    isAnonymous: zod_1.z.boolean().optional().default(false)
});
exports.routeSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Route name must be at least 2 characters').max(100, 'Route name too long'),
    description: zod_1.z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description too long'),
    path: zod_1.z.array(zod_1.z.array(zod_1.z.number()).length(2)).min(2, 'Path must have at least 2 coordinates'),
    stops: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string().min(1, 'Stop name is required'),
        coordinates: zod_1.z.array(zod_1.z.number()).length(2, 'Stop coordinates must be [longitude, latitude]'),
        description: zod_1.z.string().optional()
    })).min(2, 'Route must have at least 2 stops'),
    operator: zod_1.z.string().min(1, 'Operator is required').max(100, 'Operator name too long'),
    fare: zod_1.z.number().min(0, 'Fare must be non-negative'),
    operatingHours: zod_1.z.object({
        start: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format'),
        end: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format')
    })
});
const validate = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
                return;
            }
            next(error);
        }
    };
};
exports.validate = validate;
const validateQuery = (schema) => {
    return (req, res, next) => {
        try {
            schema.parse(req.query);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid query parameters',
                    errors: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
                return;
            }
            next(error);
        }
    };
};
exports.validateQuery = validateQuery;
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: zod_1.z.string().optional().transform(val => val ? parseInt(val) : 10),
    sort: zod_1.z.string().optional().default('createdAt'),
    order: zod_1.z.enum(['asc', 'desc']).optional().default('desc')
});
exports.locationQuerySchema = zod_1.z.object({
    lat: zod_1.z.string().transform(val => parseFloat(val)),
    lng: zod_1.z.string().transform(val => parseFloat(val)),
    radius: zod_1.z.string().optional().transform(val => val ? parseFloat(val) : 5)
});
//# sourceMappingURL=validation.js.map