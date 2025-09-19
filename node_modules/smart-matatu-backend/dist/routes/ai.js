"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const aiService_1 = require("../services/aiService");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.post('/predict', auth_1.authenticateToken, async (req, res) => {
    try {
        const parsed = aiService_1.inferenceInputSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input',
                errors: parsed.error.flatten(),
            });
        }
        const result = await (0, aiService_1.runInference)(parsed.data);
        return res.json({ success: true, data: result });
    }
    catch (error) {
        console.error('AI inference error:', error);
        return res.status(500).json({ success: false, message: 'Inference failed' });
    }
});
exports.default = router;
//# sourceMappingURL=ai.js.map