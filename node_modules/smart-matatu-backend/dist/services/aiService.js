"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferenceInputSchema = void 0;
exports.runInference = runInference;
const zod_1 = require("zod");
exports.inferenceInputSchema = zod_1.z.object({
    routeId: zod_1.z.string().min(1),
    features: zod_1.z.record(zod_1.z.string(), zod_1.z.number()).default({}),
});
async function runInference(input) {
    const seed = Object.values(input.features).reduce((a, b) => a + b, 0);
    const score = Math.max(0, Math.min(1, (seed % 100) / 100));
    const label = score > 0.7 ? 'high' : score > 0.4 ? 'medium' : 'low';
    return {
        success: true,
        prediction: score,
        label,
        confidence: 0.5 + Math.abs(0.5 - score),
    };
}
//# sourceMappingURL=aiService.js.map