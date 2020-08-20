module.exports = {
  clearMocks: true,
  setupFilesAfterEnv: ['<rootDir>/setupTests.js'],
  testEnvironment: 'node',
  testRegex: '(/__tests__/.*|(\\.|/)(test))\\.[jt]sx?$'
};
