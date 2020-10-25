# livereload-webpack-plugin

[![Build Status](https://travis-ci.org/Kooneko/livereload-webpack-plugin.svg?branch=main)](https://travis-ci.org/Kooneko/livereload-webpack-plugin)

This plugin for Webpack is based from statianzo's plugin : [webpack-livereload-plugin](https://github.com/statianzo/webpack-livereload-plugin)  
This plugin is compatible wih Webpack 4 & Webpack 5

## Installation

Install the package

```sh
npm install --save-dev @kooneko/livereload-webpack-plugin
```

Add the plugin to your webpack config

```js
// webpack.config.js

var LiveReloadWebpackPlugin = require('@kooneko/livereload-webpack-plugin');

module.exports = {
  plugins: [
    new LiveReloadWebpackPlugin(options)
  ]
}
```

Add a script tag to your page pointed at the livereload server

```html
<script src="http://localhost:35729/livereload.js"></script>
```


## Options

| Option | Default | Description |
| --- | --- | --- |
| `protocol` | protocol of the page, either `http` or `https` | Protocol for livereload `<script>` src attribute value |
| `port` | 35729 | The desired port for the livereload server. If you not define port, an available port will be searched for, starting from 35729 |
| `hostname` | hostname of the page, like `localhost` or `10.0.2.2` | The desired hostname for the appended `<script>` (if present) to point to |
| `quiet` | `false` | Prevent message " Live reload listening on port ..." from appearing in the console |
| `appendScript` | false | Append livereload `<script>` automatically to `<head>` |
| `delay` | `0` | amount of milliseconds by which to delay the live reload (in case build takes longer) |
| `ignore` | `null` | RegExp of files to ignore. Null value means ignore nothing. It is also possible to define an array and use multiple [anymatch](https://github.com/micromatch/anymatch) patterns |
| `useSourceHash` | `false` | [WEBPACK 4 ONLY!] create hash for each file source and only notify livereload if hash has changed |

## Why?

Yes, there's already `webpack-dev-server` that handles live reloading
and more complex scenarios. This project aims to solve the case where
you want assets served by your app server, but still want reloads
triggered from webpack's build pipeline.

## HTTPS

If you set `key`, `cert`, or `pfx` options, they'll get passed through to
[tiny-lr as options](https://github.com/mklabs/tiny-lr#options) and it will
serve over HTTPS. You'll also also set `protocol` to `https`.

## FAQ

##### Webpack always generates js and css together

If your webpack is always generating js and css files together you could set 
`useSourceHash` to `true` to generate a hash for each changed asset and it 
should prevent multiple reloads. 

Alternatively if this slows your build process you could set `liveCSS` 
and `liveImg` to `false` to prevent multiple reloads.