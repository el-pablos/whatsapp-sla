module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests", "<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  // Allow transformation of ESM modules from @whiskeysockets/baileys
  transformIgnorePatterns: [
    "node_modules/(?!(@whiskeysockets/baileys|@hapi/boom)/)",
  ],
  // Module name mapper for ESM imports
  moduleNameMapper: {
    "^@whiskeysockets/baileys$": "<rootDir>/tests/__mocks__/baileys.ts",
  },
  collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts", "!src/**/*.test.ts"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
};
