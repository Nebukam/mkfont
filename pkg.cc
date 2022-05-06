{
    "name": "mkfont",
    "version": "0.7.1",
    "author": {
        "name": "Timothé Lapetite",
        "email": "nebukam@gmail.com"
    },
    "license": "SEE LICENSE IN LICENSE",
    "dependencies": {
        "@nkmjs/core": "^0.2.25",
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
        "@nkmjs/core-dev": "^0.2.25",
        "electron": "^17.1.0"
    }
}

{
    "name": "mkfont",
    "version": "0.7.1",
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
        "electron": "^17.1.0"
    }
}