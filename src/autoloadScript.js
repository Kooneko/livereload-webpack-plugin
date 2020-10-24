module.exports = (options) => {
    const { instanceId, port } = options
    const protocol = options.protocol ? options.protocol + ':' : '';
    const hostname = options.hostname || '" + location.hostname + "';

    return [
        '// livereload-webpack-plugin',
        '(function() {',
        '  if (typeof window === "undefined") { return };',
        '  var id = "livereload-webpack-plugin-script-' + instanceId + '";',
        '  if (document.getElementById(id)) { return; }',
        '  var el = document.createElement("script");',
        '  el.id = id;',
        '  el.async = true;',
        '  el.src = "' + protocol + '//' + hostname + ':' + port + '/livereload.js";',
        '  document.getElementsByTagName("head")[0].appendChild(el);',
        '}());',
        ''
    ].join('\n')
}