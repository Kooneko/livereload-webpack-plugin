const { RuntimeModule, Template } = require('webpack');

class LiveReloadRuntimeModule extends RuntimeModule {
    constructor(options) {
        super('livereload');
        this.options = options;
    }

    generate() {
        return Template.asString([
            require('./autoloadScript')(this.options)
        ]);
    }
}

module.exports = LiveReloadRuntimeModule;
