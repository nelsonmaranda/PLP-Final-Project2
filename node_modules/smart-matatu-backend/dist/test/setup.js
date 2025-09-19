"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '.env.test' });
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGO_URI = 'mongodb://localhost:27017/smart-matatu-test';
jest.mock('mongoose', () => {
    const mockSchema = {
        pre: jest.fn(),
        index: jest.fn(),
        methods: {},
        statics: {},
        Types: {
            ObjectId: 'ObjectId',
            String: 'String',
            Number: 'Number',
            Date: 'Date',
            Boolean: 'Boolean',
            Array: 'Array',
        },
    };
    return {
        connect: jest.fn(),
        connection: {
            close: jest.fn(),
            readyState: 1,
        },
        Schema: jest.fn().mockImplementation(() => mockSchema),
        model: jest.fn(() => ({
            findById: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
        })),
    };
});
jest.mock('bcryptjs', () => ({
    hash: jest.fn((password) => Promise.resolve(`hashed_${password}`)),
    compare: jest.fn((password, hash) => Promise.resolve(hash === `hashed_${password}`)),
}));
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(() => 'mock-jwt-token'),
    verify: jest.fn(() => ({ userId: 'test-user-id' })),
}));
jest.mock('express-rate-limit', () => {
    return jest.fn(() => (req, res, next) => next());
});
jest.mock('node-cron', () => ({
    schedule: jest.fn(),
}));
//# sourceMappingURL=setup.js.map