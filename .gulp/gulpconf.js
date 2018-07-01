module.exports = {
    styles: {
        main:{
            enable: true,
            src: ['./styles/template_styles.scss'],
            dist: './css/',
            outputName: 'template_styles.css',
            replaceUrl: {
                enable: true,
                from: /^((\.\.\/){0,}|(\/){0,})img/,
                to: '../img'
            },
            watchDir: [
                'styles/**/*.{css,scss}',
                '!styles/pages/**',
            ],
        },
        pages: {
            enable: true,
            src: './styles/pages/**/*.scss',
            srcRoot: './styles/pages/',
            dist: './css/',
            replaceUrl: {
                enable: false,
                from: /^((\.\.\/){0,}|(\/){0,})img/,
                to: '../img'
            },
            watchDir: [
                'styles/**/*.{css,scss}'
            ]
        },
        options: {
            includePaths: [
                './styles/',
                './styles/.vendor/',
                './.vendor/',
                './',
            ],
            cssnano: {
                enable: true,
                options: {
                    discardComments: {removeAll: true}
                },
            },
            imageHash: {
                enable: true,
                regexp: /(\.png|\.jpg)$/
            },
            autoprefixer: {
                browsers: ['last 5 versions', 'safari 5', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'],
                cascade: false
            },
        }
    },

    scripts: {
        main:{
            enable: true,
            src: ['./scripts/main.js'],
            dist: './js/',
            outputName: 'scripts.min.js',
            watchDir: [
                'scripts/**/*.js',
                '!scripts/additional/**',
            ],
        },
        additional:{
            enable: true,
            src: ['./scripts/additional/**/*.js'],
            dist: './js/',
            outputName: 'scripts.js',
            watchDir: [
                'scripts/**/*.js'
            ],
        },
        options: {
            uglify: {
                enable: true,
                options: null,
            },
            babel: {
                enable: true,
                options: {
                    presets: [
                        ["env", {
                            "targets": {
                                "browsers": ["last 2 versions", "safari >= 7"]
                            }
                        }]
                    ]
                }
            }
        }
    },

    sprites: {
        forRetina: {
            enable: true,
            src: './img/.sprites-retina',
            imgDist: './img/sprites-retina/',
            scssDist: './styles/sprites-retina/',
            dist: '',
            namex1: {
                prefix: "ic-",
            },

            clearDir: [//Временные директории, очищаются перед сборкой спрайтов
                './img/.sprites-retina/**/x2/',//Директория подготовки x2 изображений
                './img/.sprites-retina/**/x1/',//Директория подготовки x1 изображений
                './img/sprites-retina/*'//Директория с сформированными спрайтами (удаляем, т.к. файлы имеют хеш в названии)
            ],

            spritesmith: {
                retinaSrcFilter: ['/x2/*'],
                retinaImgName: 'sprite@2x.png',
                imgName: 'sprite-nr.png',
                cssName: '_sprite-nr.scss',
                imgPath: 'img/sprites-retina/',
                padding: 10,
                cssVarMap: function (sprite) {
                    sprite.name = sprite.name + '-nr';
                }
            },

            renameX1: {
                //basename: "",
                prefix: "ic-",
                //suffix: '-x1',
                //extname: ""
            },

            renameX2: {
                //basename: "",
                //prefix: "fix_",
                suffix: '@x2',
                //extname: ""
            },

            watchImg: [
                './img/.sprites-retina/**/*.{jpg,jpeg,png,gif}',
                '!/img/.sprites-retina/**/x1/*',
                '!/img/.sprites-retina/**/x2/*'
            ],
            watchStyle: ['./styles/sprites-retina/**/*'],
        },

        notRetina: {
            enable: true,
            src: './img/.sprites',
            imgDist: './img/sprites/',
            scssDist: './styles/sprites/',
            clearDir: [//Временные директории, очищаются перед сборкой спрайтов
                './img/sprites/!*'//Директория с сформированными спрайтами (удаляем, т.к. файлы имеют хеш в названии)
            ],
            watchImg: ['./img/.sprites/!**!/!*.{jpg,jpeg,png,gif}'],
            watchStyle: ['./styles/sprites/!**!/!*'],
            inputDir: './img/.sprites',
            imagePrefix: 'sprite-',
            imageExtension: '.png',
            styleExtension: '.scss',
            styleLinkToImg: '../img/sprites/',
            outputDirImage: './img/sprites/',
            outputDirStyle: './styles/sprites/',
        }
    },

    images:{
        enable: true,
        imageFormat: '*.{jpg,jpeg,png,gif}',
        src: [
            'img/**/*.{jpg,jpeg,png,gif,svg}',
            '!img/.sprites/**/*',
            '!img/.sprites-retina/**/*',
            '!img/sprites/**/*',
            '!img/sprites-retina/**/*',
        ],
        dist: './img/',
        directoriesCoincide: true,
        watchDir: [
            'img/**/*.{jpg,jpeg,png,gif,svg}',
            '!img/.sprites/**/*',
            '!img/.sprites-retina/**/*',
            '!img/sprites/**/*',
            '!img/sprites-retina/**/*',
        ],
        imagemin: {
            option: {/*verbose: true*/}
        },
    },

    clear: {
        build: [
            './.source_maps',
            './css',
            './js'
        ],
        cache: [
            './.gulp/cache',
        ],
        spritesRetina: [
            './img/sprites-retina/',
            './styles/sprites-retina/',
        ],
        spritesNotRetina: [
            './img/sprites/',
            './styles/sprites/',
        ]
    },

    sourceMap: {
        createSourceMapProd: true,
        createSourceMapDev: true,
        // Директория сохранения карт
        // null — сохранять информацию прямо в файле
        saveDir: '../.source_maps',
        options: {
            largeFile: true
        }
    },

    watch: {
        ignoreInitial: true,
        awaitWriteFinish: true,
        read: false,
    }
};