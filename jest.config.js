module.exports = {
    testURL: 'http://localhost/',
    transformIgnorePatterns: ['/node_modules/'],
    watchPathIgnorePatterns: ['<rootDir>/tests/js'],
    setupFilesAfterEnv: ['<rootDir>/setupTest.js'],
};