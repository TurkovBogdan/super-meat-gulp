module.exports = {
    /* Что нам требуется? */
    tasks: {
      mainCSS: true,        // Сборка основного файла стилей
      additionalCSS: true,  // Сборка дополнительных файлов стилей
      mainJS: true,         // Сборка основного файла стилей
      additionalJS: true,   // Сборка дополнительных файлов стилей
      sprites: true,        // Спрайты без поддержки ретины
      spritesRetina: true,  // Спрайты c поддержкой ретины
      images: true,         // Обработка изображений
      watch: true,          // Отслеживание и автоприменение изменений
    },

    /* Настройки проетка */
    project: {
        // Поддерживаемые браузеры, используеться в автопрефиксере и других плагинах
        // Список запросов https://github.com/browserslist/browserslist#queries
        supportedBrowsers: ['> 1% in RU', 'ie >=9'],
        // Шаблоны структуры стилей
        // Доступные можно посмотреть тут .gulp/structure-pattern/styles
        styleStructurePattern: {
            dist: './styles/',  // Путь к директории с исходниками стилей
            pattern: 'sass-7-1',
        },
    },

    /* Настройки задач, путей, плагинов */
    styles: {
        // Сборка основных стилей
        main: {
            src: ['styles/template_styles.scss'],       // файл/файлы с которых начнёться сборка.
            dist: './css/',                             // куда сохранить собранный файл
            outputName: 'template_styles.css',          // имя собранного файла
            watchDir: [                                 // при изменении каких файлов запускать задачу
                'styles/**/*.{css,scss}',
                '!styles/additional/**',                // отключите отслеживание изменений для дополнительных стилей
            ],
        },
        // Сборка дополнительных стилей
        additional: {
            src: ['./styles/additional/**/*.scss'],     // директория/директории или файлы для сборки
            dist: './css/',                             // куда сохранить собранные файлы
            watchDir: [                                 // при изменении каких файлов запускать задачу
                'styles/**/*.{css,scss}'
            ]
        },
        // Перечень путей, где сборщик будет искать файлы при использовании @import
        includePaths: [
            './styles/',
            './styles/.vendor/',
            './.vendor/',
            './',
        ],
    },
    scripts: {
        // Сборка основных скриптов
        main: {
            src: ['./scripts/main.js'],                 // файл/файлы с которых начнёться сборка.
            dist: './js/',                              // куда сохранить собранный файл
            outputName: 'scripts.min.js',               // имя собранного файла
            watchDir: [                                 // при изменении каких файлов запускать задачу
                'scripts/**/*.js',
                '!scripts/additional/**',               // отключите отслеживание изменений для дополнительных скриптов
            ],
        },
        // Сборка дополнительных стилей
        additional: {
            src: ['./scripts/additional/**/*.js'],      // файл/файлы с которых начнёться сборка.
            dist: './js/',                              // куда сохранить собранный файл
            watchDir: [                                 // при изменении каких файлов запускать задачу
                'scripts/**/*.js'
            ],
        },
        // Плагины
        plugins: {
            uglify: true,                               // Минификация
            babel: true,                                // Поддержка ES6
        }
    },

    sprites: {
        forRetina: {
            src: './img/.sprites-retina',
            imgDist: './img/sprites-retina/',
            scssDist: './styles/sprites-retina/',
            namex1: {
                prefix: "sprite-retina-",
            },
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
            watchImg: [
                './img/.sprites-retina/**/*.{jpg,jpeg,png,gif}',
                '!/img/.sprites-retina/**/x1/*',
                '!/img/.sprites-retina/**/x2/*'
            ],
            watchStyle: ['./styles/sprites-retina/**/*'],
        },

        notRetina: {
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

    images: {
        imageFormat: '*.{jpg,jpeg,png,gif,svg}',
        src: [
            'img/**/*.{jpg,jpeg,png,gif,svg}',
            '!img/.sprites/**/*',
            '!img/.sprites-retina/**/*',
            '!img/sprites/**/*',
            '!img/sprites-retina/**/*',
        ],
        dist: './img/',
        watchDir: [
            'img/**/*.{jpg,jpeg,png,gif,svg}',
            '!img/.sprites/**/*',
            '!img/.sprites-retina/**/*',
            '!img/sprites/**/*',
            '!img/sprites-retina/**/*',
        ],

        // Директория выборки и сохранения изображений совпадают
        // Эта переменная переключает режим проверки были ли изображения оптимизированны
        // Если при обработке изображений сборщик копирует файлы из одной директории в другую, присвойте значение false
        srcIsDist: true,

        // Нужно ли оптимизировать изображения
        compression: {
            jpg: {
                enable: true,
                quality: 100,               // Потеря качества, если 100, потери качества нет
                mozjpgEnable: true,         // Включить обработку через mozjpeg. Если отключено, используеться jpegtran
            },
            png: {
                enable: true,
                speed: 10,                  // Колличество подходов при обработке, от 1 до 10 (больше = лучше и дольше)
            },
            gif: {
                enable: true
            },
            svg: {
                enable: true
            },
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
            './img/.sprites-retina/**/x1/',
            './img/.sprites-retina/**/x2/',
        ],
        spritesNotRetina: [
            './img/sprites/',
            './styles/sprites/',
        ]
    },

    /* Плагины */
    // Генерация sourceMap
    sourceMap: {
        createSourceMapProd: true,
        createSourceMapDev: true,
        // Директория сохранения карт
        // null — сохранять информацию прямо в файле
        saveDir: './.source_maps',
        options: {
            largeFile: true
        }
    },

    // Отслеживание изменений
    watch: {
        ignoreInitial: true,
        awaitWriteFinish: true,
        read: false,
    }
};