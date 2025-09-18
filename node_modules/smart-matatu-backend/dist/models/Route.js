"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const StopSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    coordinates: {
        type: [Number],
        required: true,
        validate: {
            validator: function (coords) {
                return coords.length === 2 &&
                    coords[0] >= -180 && coords[0] <= 180 &&
                    coords[1] >= -90 && coords[1] <= 90;
            },
            message: 'Coordinates must be [longitude, latitude] with valid ranges'
        }
    },
    description: {
        type: String,
        trim: true
    }
}, { _id: false });
const RouteSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    path: {
        type: [[Number]],
        required: true,
        validate: {
            validator: function (path) {
                return path.length >= 2 && path.every(coord => coord.length === 2 &&
                    coord[0] >= -180 && coord[0] <= 180 &&
                    coord[1] >= -90 && coord[1] <= 90);
            },
            message: 'Path must contain at least 2 valid coordinate pairs'
        }
    },
    stops: [StopSchema],
    operator: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    fare: {
        type: Number,
        required: true,
        min: 0
    },
    operatingHours: {
        start: {
            type: String,
            required: true,
            match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
        },
        end: {
            type: String,
            required: true,
            match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format']
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
RouteSchema.index({ 'stops.coordinates': '2dsphere' });
RouteSchema.index({ 'path': '2dsphere' });
exports.default = mongoose_1.default.model('Route', RouteSchema);
//# sourceMappingURL=Route.js.map