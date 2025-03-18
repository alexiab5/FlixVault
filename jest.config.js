// jest.config.js
module.exports = {
    testEnvironment: "jsdom",
    transform: {
      "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
    },
    moduleNameMapper: {
      "^@/(.*)$": "<rootDir>/src/app/$1",
    },
  };
  