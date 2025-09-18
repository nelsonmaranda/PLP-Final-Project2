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
const ScoreSchema = new mongoose_1.Schema({
    routeId: {
        type: String,
        required: true,
        unique: true
    },
    reliability: {
        type: Number,
        required: true,
        min: 0,
        max: 5,
        default: 0
    },
    safety: {
        type: Number,
        required: true,
        min: 0,
        max: 5,
        default: 0
    },
    punctuality: {
        type: Number,
        required: true,
        min: 0,
        max: 5,
        default: 0
    },
    comfort: {
        type: Number,
        required: true,
        min: 0,
        max: 5,
        default: 0
    },
    overall: {
        type: Number,
        required: true,
        min: 0,
        max: 5,
        default: 0
    },
    totalReports: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    lastCalculated: {
        type: Date,
        required: true,
        default: Date.now
    }
}, {
    timestamps: true
});
ScoreSchema.pre('save', function (next) {
    const doc = this;
    doc.overall = (doc.reliability + doc.safety + doc.punctuality + doc.comfort) / 4;
    next();
});
ScoreSchema.index({ routeId: 1 });
ScoreSchema.index({ overall: -1 });
ScoreSchema.index({ lastCalculated: -1 });
exports.default = mongoose_1.default.model('Score', ScoreSchema);
//# sourceMappingURL=Score.js.map