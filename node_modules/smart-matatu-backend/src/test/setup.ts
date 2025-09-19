// Test setup for backend
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGO_URI = 'mongodb://localhost:27017/smart-matatu-test';

// Mock MongoDB connection
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

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn((password) => Promise.resolve(`hashed_${password}`)),
  compare: jest.fn((password, hash) => Promise.resolve(hash === `hashed_${password}`)),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn(() => ({ userId: 'test-user-id' })),
}));

// Mock express-rate-limit
jest.mock('express-rate-limit', () => {
  return jest.fn(() => (req: any, res: any, next: any) => next());
});

// Mock node-cron
jest.mock('node-cron', () => ({
  schedule: jest.fn(),
}));
