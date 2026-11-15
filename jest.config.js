module.exports = {
  testEnvironment: 'node',
  maxWorkers: 1,

  collectCoverage: false,

  collectCoverageFrom: [
    'src/**/*.js',
    '!src/utils/_dev/**',
  ],

  coverageDirectory: 'coverage',

  coverageReporters: [
    'text',
    'html',
    'lcov',
  ],
};