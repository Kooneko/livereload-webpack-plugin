const crypto = require('crypto');
const { version } = require('webpack')
const LiveReloadWebpackPlugin = require('../src/index');
const autoloadScript = require('../src/autoloadScript');

const isWebpack4 = version[0] === '4';

test('default options', () => {
    const plugin = new LiveReloadWebpackPlugin();
    expect(plugin.options.ignore).toBeNull();
    expect(plugin.options.quiet).toBeFalsy();
    expect(plugin.server).toBeNull();
});

test('not running', () => {
    const plugin = new LiveReloadWebpackPlugin();
    expect(plugin.server).toBeNull();
});

test('running after start', (done) => {
    const plugin = new LiveReloadWebpackPlugin();
    plugin.start(null, () => {
        expect(plugin.server).not.toBeNull();
        expect(plugin.server).not.toBeFalsy();

        plugin.server.on('close', () => {
            done();
        });
        plugin.server.close();
        done();
    });
});

test('finds available ports', (done) => {
    const plugin1 = new LiveReloadWebpackPlugin();
    const plugin2 = new LiveReloadWebpackPlugin();

    let count = 0;
    const tryEnd = () => {
        count++;
        if (count === 2) {
            expect(plugin1.options.port).not.toEqual(plugin2.options.port)
            done();
        }
    };

    const startPlugin = (p) => {
        p.start(null, () => {
            expect(p.server).not.toBeNull();
            expect(p.server).not.toBeUndefined();
            expect(p.isRunning()).toBeTruthy();

            p.server.on('close', () => {
                tryEnd();
            });
            setTimeout(() => {
                p.server.close();
            });
        });
    };

    startPlugin(plugin1);
    startPlugin(plugin2);
});

test('notifies when done', function (done) {
    const plugin = new LiveReloadWebpackPlugin();
    const stats = {
        compilation: {
            assets: {
                'b.js': { emitted: true },
                'a.js': { emitted: true },
                'c.css': { emitted: true },
                'd.css': { emitted: false }
            },
            hash: 'hash',
            children: []
        }
    };

    if (!isWebpack4) {
        stats.compilation.assets = {
            'b.js': { key: 'value' },
            'a.js': { key: 'value' },
            'c.css': { key: 'value' },
            'd.css': { key: 'value' }
        };
        stats.compilation.emittedAssets = new Set(['b.js', 'a.js', 'c.css']);
    }

    plugin.server = {
        notifyClients: function (files) {
            expect(files.sort()).toEqual(['a.js', 'b.js', 'c.css']);
            expect(plugin.lastHash).toBe(stats.compilation.hash);
            done()
        }
    };
    plugin.done(stats);
});

test('filters out ignored files', function (done) {
    const plugin = new LiveReloadWebpackPlugin({
        ignore: /\.css$/
    });
    const stats = {
        compilation: {
            assets: {
                'b.js': { emitted: true },
                'a.js': { emitted: true },
                'c.css': { emitted: true },
                'd.css': { emitted: false }
            },
            children: []
        }
    };

    if (!isWebpack4) {
        stats.compilation.assets = {
            'b.js': { key: 'value' },
            'a.js': { key: 'value' },
            'c.css': { key: 'value' },
            'd.css': { key: 'value' }
        };
        stats.compilation.emittedAssets = new Set(['b.js', 'a.js', 'c.css']);
    }

    plugin.server = {
        notifyClients: function (files) {
            expect(files.sort()).toEqual(['a.js', 'b.js']);
            done()
        }
    };
    plugin.done(stats);
});

test('filters out ignored files as array', function (done) {
    const plugin = new LiveReloadWebpackPlugin({
        ignore: [/.map/, /.json/]
    });
    const stats = {
        compilation: {
            assets: {
                'b.js': { emitted: true },
                'a.js': { emitted: true },
                'c.map': { emitted: true },
                'd.json': { emitted: true }
            },
            children: []
        }
    };

    if (!isWebpack4) {
        stats.compilation.assets = {
            'b.js': { key: 'value' },
            'a.js': { key: 'value' },
            'c.map': { key: 'value' },
            'd.json': { key: 'value' }
        };
        stats.compilation.emittedAssets = new Set(['b.js', 'a.js', 'c.map', 'd.json']);
    }

    plugin.server = {
        notifyClients: function (files) {
            expect(files.sort()).toEqual(['a.js', 'b.js']);
            done()
        }
    };
    plugin.done(stats);
});

test('filters out hashed files', function (done) {
    function hashCode(str) {
        const hash = crypto.createHash('sha256');
        hash.update(str);
        return hash.digest('hex');
    }

    const plugin = new LiveReloadWebpackPlugin({
        useSourceHash: true,
    });
    const stats = {
        compilation: {
            assets: {
                'b.js': {
                    emitted: true,
                    source: function () {
                        return "fdsa";
                    },
                },
                'a.js': {
                    emitted: true,
                    source: function () {
                        return "asdf";
                    },
                },
            },
            children: []
        }
    };

    if (!isWebpack4) {
        stats.compilation.assets = {
            'b.js': { key: 'value' },
            'a.js': { key: 'value' }
        };
        stats.compilation.emittedAssets = new Set(['b.js', 'a.js']);
    }

    plugin.sourceHashs = {
        'b.js': 'Wrong hash',
        'a.js': hashCode('asdf'),
    };
    plugin.server = {
        notifyClients: function (files) {
            expect(files.sort()).toEqual(isWebpack4 ? ['b.js'] : ['a.js', 'b.js']);
            done()
        }
    };
    plugin.done(stats);
});

test('children trigger notification', () => {
    const plugin = new LiveReloadWebpackPlugin();
    const stats = {
        compilation: {
            assets: {
                'b.js': { emitted: true },
                'a.js': { emitted: true },
                'c.css': { emitted: false }
            },
            hash: null,
            children: [{ hash: 'hash' }]
        }
    };

    if (!isWebpack4) {
        stats.compilation.assets = {
            'b.js': { key: 'value' },
            'a.js': { key: 'value' },
            'c.css': { key: 'value' }
        };
        stats.compilation.emittedAssets = new Set(['b.js', 'a.js']);
    }

    plugin.server = {
        notifyClients: function (files) {
            expect(plugin.lastChildHashes).toEqual(stats.compilation.children.map((child) => child.hash))
        }
    };
    plugin.done(stats);
});

test('autoloadScript hostname defaults to location.hostname', () => {
    const plugin = new LiveReloadWebpackPlugin();
    expect(autoloadScript(plugin.options)).toMatch(/ \+ location\.hostname \+ /)
});

test('autoloadScript contains hostname option', () => {
    expect(autoloadScript({ hostname: 'example.com' })).toMatch(/example.com/)
});

test('every instance has random id', () => {
    const plugin = new LiveReloadWebpackPlugin();
    const plugin2 = new LiveReloadWebpackPlugin();
    expect(plugin.options.instanceId).not.toEqual(plugin2.options.instanceId);
});

test('autoloadScript contains instanceId', () => {
    const instanceId = crypto.randomBytes(8).toString('hex');
    expect(autoloadScript({ instanceId })).toMatch(instanceId);
});