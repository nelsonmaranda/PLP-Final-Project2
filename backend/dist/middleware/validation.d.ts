import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
export declare const userRegistrationSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    displayName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    displayName: string;
}, {
    email: string;
    password: string;
    displayName: string;
}>;
export declare const userLoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const reportSchema: z.ZodObject<{
    routeId: z.ZodString;
    reportType: z.ZodEnum<["delay", "safety", "crowding", "breakdown", "other"]>;
    description: z.ZodString;
    location: z.ZodObject<{
        coordinates: z.ZodArray<z.ZodNumber, "many">;
        address: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        coordinates: number[];
        address?: string | undefined;
    }, {
        coordinates: number[];
        address?: string | undefined;
    }>;
    severity: z.ZodDefault<z.ZodOptional<z.ZodEnum<["low", "medium", "high", "critical"]>>>;
    isAnonymous: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    description: string;
    routeId: string;
    reportType: "delay" | "safety" | "crowding" | "breakdown" | "other";
    location: {
        coordinates: number[];
        address?: string | undefined;
    };
    severity: "low" | "medium" | "high" | "critical";
    isAnonymous: boolean;
}, {
    description: string;
    routeId: string;
    reportType: "delay" | "safety" | "crowding" | "breakdown" | "other";
    location: {
        coordinates: number[];
        address?: string | undefined;
    };
    severity?: "low" | "medium" | "high" | "critical" | undefined;
    isAnonymous?: boolean | undefined;
}>;
export declare const routeSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    path: z.ZodArray<z.ZodArray<z.ZodNumber, "many">, "many">;
    stops: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        coordinates: z.ZodArray<z.ZodNumber, "many">;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        coordinates: number[];
        description?: string | undefined;
    }, {
        name: string;
        coordinates: number[];
        description?: string | undefined;
    }>, "many">;
    operator: z.ZodString;
    fare: z.ZodNumber;
    operatingHours: z.ZodObject<{
        start: z.ZodString;
        end: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        end: string;
        start: string;
    }, {
        end: string;
        start: string;
    }>;
}, "strip", z.ZodTypeAny, {
    description: string;
    name: string;
    path: number[][];
    stops: {
        name: string;
        coordinates: number[];
        description?: string | undefined;
    }[];
    operator: string;
    fare: number;
    operatingHours: {
        end: string;
        start: string;
    };
}, {
    description: string;
    name: string;
    path: number[][];
    stops: {
        name: string;
        coordinates: number[];
        description?: string | undefined;
    }[];
    operator: string;
    fare: number;
    operatingHours: {
        end: string;
        start: string;
    };
}>;
export declare const validate: (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateQuery: (schema: z.ZodSchema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodEffects<z.ZodOptional<z.ZodString>, number, string | undefined>;
    limit: z.ZodEffects<z.ZodOptional<z.ZodString>, number, string | undefined>;
    sort: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    order: z.ZodDefault<z.ZodOptional<z.ZodEnum<["asc", "desc"]>>>;
}, "strip", z.ZodTypeAny, {
    sort: string;
    limit: number;
    page: number;
    order: "asc" | "desc";
}, {
    sort?: string | undefined;
    limit?: string | undefined;
    page?: string | undefined;
    order?: "asc" | "desc" | undefined;
}>;
export declare const locationQuerySchema: z.ZodObject<{
    lat: z.ZodEffects<z.ZodString, number, string>;
    lng: z.ZodEffects<z.ZodString, number, string>;
    radius: z.ZodEffects<z.ZodOptional<z.ZodString>, number, string | undefined>;
}, "strip", z.ZodTypeAny, {
    lat: number;
    lng: number;
    radius: number;
}, {
    lat: string;
    lng: string;
    radius?: string | undefined;
}>;
//# sourceMappingURL=validation.d.ts.map