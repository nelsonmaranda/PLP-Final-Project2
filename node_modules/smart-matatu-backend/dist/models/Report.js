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
const ReportSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    routeId: {
        type: String,
        required: true
    },
    reportType: {
        type: String,
        enum: ['delay', 'safety', 'crowding', 'breakdown', 'other'],
        required: true
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    location: {
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
        address: {
            type: String,
            trim: true,
            maxlength: 200
        }
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true,
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['pending', 'verified', 'resolved', 'dismissed'],
        default: 'pending'
    },
    deviceFingerprint: {
        type: String,
        required: true,
        trim: true
    },
    images: [{
            type: String,
            trim: true
        }],
    isAnonymous: {
        type: Boolean,
        default: false
    },
    verifiedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    verifiedAt: {
        type: Date
    },
    resolvedAt: {
        type: Date
    }
}, {
    timestamps: true
});
ReportSchema.index({ 'location.coordinates': '2dsphere' });
ReportSchema.index({ routeId: 1, status: 1 });
ReportSchema.index({ reportType: 1, severity: 1 });
ReportSchema.index({ createdAt: -1 });
exports.default = mongoose_1.default.model('Report', ReportSchema);
//# sourceMappingURL=Report.js.map