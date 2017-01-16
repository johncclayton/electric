// this is a custom dictionary to make it easy to extend/override
// provide a name for an entry, it can be anything such as 'copyAssets' or 'copyFonts'
// then provide an object with a `src` array of globs and a `dest` string
module.exports = {
    copyAssets: {
        src: ['{{SRC}}/assets/**/*'],
        dest: '{{WWW}}/assets'
    },
    copyIndexContent: {
        src: ['{{SRC}}/index.html', '{{SRC}}/manifest.json', '{{SRC}}/service-worker.js'],
        dest: '{{WWW}}'
    },
    copyFonts: {
        src: ['{{ROOT}}/node_modules/ionicons/dist/fonts/**/*', '{{ROOT}}/node_modules/ionic-angular/fonts/**/*'],
        dest: '{{WWW}}/assets/fonts'
    },
    copyPolyfills: {
        src: ['{{ROOT}}/node_modules/ionic-angular/polyfills/polyfills.js'],
        dest: '{{BUILD}}'
    },
    copySwToolbox: {
        src: ['{{ROOT}}/node_modules/sw-toolbox/sw-toolbox.js'],
        dest: '{{BUILD}}'
    },
    copyFontAwesomeCSS: {
        src: '{{ROOT}}/node_modules/font-awesome/css/font-awesome.min.css',
        dest: '{{WWW}}/assets/css/'
    },
    copyFontAwesome: {
        src: '{{ROOT}}/node_modules/font-awesome/fonts/**/*',
        dest: '{{WWW}}/assets/fonts/'
    },
    copyBourbon: {
        src: '{{ROOT}}/bourbon/**/*',
        dest: '{{WWW}}/assets/bourbon/'
    },
    copyWebAnimations: {
        src: ['{{ROOT}}/node_modules/web-animations-js/web-animations.min.js', '{{ROOT}}/node_modules/web-animations-js/web-animations.min.js.map'],
        dest: '{{WWW}}/assets/js/'
    }
};
