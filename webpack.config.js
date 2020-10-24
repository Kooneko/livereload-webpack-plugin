const { resolve } = require('path');
const LiveReloadPlugin = require('./src/index');

module.exports = {
    entry: resolve(__dirname, 'dev/index.js'),
    output: {
        path: resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    plugins: [new LiveReloadPlugin({
        appendScript: true
    })]
};