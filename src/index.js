const { RuntimeGlobals, version } = require('webpack');
const tinylr = require('tiny-lr');
const getPort = require('get-port');
const anymatch = require('anymatch');
const crypto = require('crypto');
const { arraysEqual, generateHashCode } = require('./utils');

const servers = {};
const isWebpack4 = version[0] === '4';

module.exports = class LiveReloadWebpackPlugin {
    constructor(options) {
        this.pluginName = 'LiveReloadPlugin';
        this.defaultOptions = {
            instanceId: crypto.randomBytes(8).toString('hex'),
            protocol: '', // http or https
            port: null,
            hostname: '',
            quiet: false,
            appendScript: false,
            delay: 0,
            ignore: null,
            useSourceHash: false
        };
        this.options = { ...this.defaultOptions, ...options };

        // Add delay, but remove it from options, so it doesn't get passed to tinylr
        this.delay = this.options.delay || 0;
        delete this.options.delay;

        this.lastHash = null;
        this.lastChildHashes = [];
        this.server = null;
        this.sourceHashs = {};
    }

    isRunning() {
        return !!this.server
    }

    apply(compiler) {
        if (this.options.appendScript || isWebpack4) {
            compiler.hooks.compilation.tap(this.pluginName, this.applyCompilation.bind(this));
        }
        compiler.hooks.watchRun.tapAsync(this.pluginName, this.start.bind(this));
        compiler.hooks.done.tap(this.pluginName, this.done.bind(this));
        compiler.hooks.failed.tap(this.pluginName, this.failed.bind(this));
    }

    applyCompilation(compilation) {
        if (isWebpack4) {
            compilation.mainTemplate.hooks.startup.tap(this.pluginName, (source) => {
                return (this.options.appendScript && this.isRunning())
                    ? require('./autoloadScript')(this.options) + source
                    : source;
            });
        } else {
            compilation.hooks.additionalChunkRuntimeRequirements.tap(this.pluginName, (chunk, set) => {
                set.add(RuntimeGlobals.require);
                set.add(RuntimeGlobals.startup);

                const LiveReloadRuntimeModule = require('./LiveReloadRuntimeModule');
                compilation.addRuntimeModule(chunk, new LiveReloadRuntimeModule(this.options));
            })
        }
    }

    listen(callback) {
        this.server = servers[this.options.port] = tinylr(this.options);

        this.server.listen(this.options.port, (err) => {
            if (!err || !this.options.quiet) {
                console.log('Live reload listening on port ' + this.options.port + '\n');
            }
            callback();
        });

        this.server.errorListener = (err) => {
            console.error('Live reload disabled: ' + err.message);
            if (err.code !== 'EADDRINUSE') {
                console.error(err.stack);
            }
            callback();
        };
    }

    start(watching, callback) {
        if (servers[this.options.port]) {
            this.server = servers[this.port];
            callback();
        } else {
            if (this.options.port === null) {
                (async () => {
                    this.options.port = await getPort({port: 35729});
                    this.listen(callback);
                })();
            } else {
                this.listen(callback);
            }
        }
    }

    fileIgnoredOrNotEmitted(data) {
        if (Array.isArray(this.options.ignore)) {
            return !anymatch(this.options.ignore, data.name) && data.emitted;
        }

        return !data.name.match(this.options.ignore) && data.emitted;
    }

    fileHashDoesntMatches(data) {
        if (!this.options.useSourceHash) {
            return true;
        }            

        if (isWebpack4) {
            const sourceHash = generateHashCode(data[1].source());
            if (this.sourceHashs.hasOwnProperty(data[0])
                && (this.sourceHashs[data[0]] === sourceHash)) {
                return false;
            }

            this.sourceHashs[data[0]] = sourceHash;
            return true;
        } else {
            // NOTE : in webpack 5, asset object has change 
            //        and source() method does not exist anymore            
            return true; // Temporary workaround
        }
    };

    done(stats) {
        const { hash, assets, children } = stats.compilation;
        const childHashes = (children || []).map(child => child.hash);
        let files = assets

        if (!isWebpack4) {
            const emittedAssets = stats.compilation.emittedAssets
            files = Object.keys(assets).map(asset => ({
                name: asset,
                emitted: emittedAssets.has(asset)
            }));
        }

        const include = files
            .filter(this.fileIgnoredOrNotEmitted.bind(this))
            .filter(this.fileHashDoesntMatches.bind(this))
            .map((data) => data.name);

        if (!this.isRunning() && Object.keys(servers).length > 0) {
            // Workaround : this.server = undefined after first compilation
            // NOTE : This workaround break the proper functioning of multiple instance 
            this.server = servers[Object.keys(servers)[0]];
        }

        if (this.isRunning() && (hash !== this.lastHash || !arraysEqual(childHashes, this.lastChildHashes)) && include.length > 0) {
            this.lastHash = hash;
            this.lastChildHashes = childHashes;
            setTimeout(() => {
                this.server.notifyClients(include);
            }, this.delay);
        }
    }

    failed() {
        this.lastHash = null;
        this.lastChildHashes = [];
    }
};
