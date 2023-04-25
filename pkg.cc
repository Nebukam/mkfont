//// LOCAL

{
    "name": "mkfont",
    "version": "1.2.3",
    "author": {
        "name": "Timothé Lapetite",
        "email": "nebukam@gmail.com"
    },
    "license": "SEE LICENSE IN LICENSE",
    "dependencies": {
        "@nkmjs/core": "^1.0.2",
        "svg-path-reverse": "^1.3.0",
        "svg2ttf": "^6.0.3",
        "svgo": "^2.8.0",
        "svgpath": "^2.5.0",
        "ttf2svg": "^1.2.0"
    },
    "scripts": {
        "nkmjs": "nkmjs",
        "processor": "node app/js-unicode/unicode-processor.js"
    },
    "devDependencies": {
        "@nkmjs/core-dev": "^1.0.2",
        "electron": "^24.1.2"
    }
}

//// RELEASE

{
    "name": "mkfont",
    "version": "1.2.3",
    "author": {
        "name": "Timothé Lapetite",
        "email": "nebukam@gmail.com"
    },
    "license": "SEE LICENSE IN LICENSE",
    "dependencies": {
        "@nkmjs/core": "../nkmjs/packages/nkmjs-core",
        "svg-path-reverse": "^1.3.0",
        "svg2ttf": "^6.0.3",
        "svgo": "^2.8.0",
        "svgpath": "^2.5.0",
        "ttf2svg": "^1.2.0"
    },
    "scripts": {
        "nkmjs": "nkmjs",
        "processor": "node app/js-unicode/unicode-processor.js"
    },
    "devDependencies": {
        "@nkmjs/core-dev": "../nkmjs/packages/nkmjs-core-dev",
        "electron": "^24.1.2"
    }
}