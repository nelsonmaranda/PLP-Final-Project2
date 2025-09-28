"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
}));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, morgan_1.default)('combined'));
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});
const auth_1 = __importDefault(require("./routes/auth"));
const routes_1 = __importDefault(require("./routes/routes"));
const reports_1 = __importDefault(require("./routes/reports"));
const scores_1 = __importDefault(require("./routes/scores"));
const ai_1 = __importDefault(require("./routes/ai"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const scoringService_1 = __importDefault(require("./services/scoringService"));
app.use('/api/auth', auth_1.default);
app.use('/api/routes', routes_1.default);
app.use('/api/reports', reports_1.default);
app.use('/api/scores', scores_1.default);
app.use('/api/ai', ai_1.default);
app.use('/api/analytics', analytics_1.default);
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`
    });
});
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/smart-matatu';
        await mongoose_1.default.connect(mongoURI);
        console.log('✅ MongoDB connected successfully');
        scoringService_1.default.start();
    }
    catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};
const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
};
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    process.exit(1);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    scoringService_1.default.stop();
    mongoose_1.default.connection.close();
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    scoringService_1.default.stop();
    mongoose_1.default.connection.close();
    process.exit(0);
});
startServer();
exports.default = app;
//# sourceMappingURL=server.js.map