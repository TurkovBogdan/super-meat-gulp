module.exports = {
    /* Настройки задач */
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

        structure: {
            pmdir: '.vendor',                             // директория в которую складывает файлы ващ менеджер пакетов (bower/yarn)
            styles: {
                fileExtension: 'css,scss',                  // расширения файлов для сборки
                sourcesDir: 'styles/',                    // директоиря исходников стилей
                vendorDir: 'styles/vendor/',              // вендоры
                mainFile: 'template_styles.scss',                      // основной файл для сборки
                additionalSourcesDir: 'styles/pages/',    // директория отдельно собираемых (дополнительных) стилей

                dist: 'css/',                             // директория для сохранения основного файла стилей
                distFileName: 'template_styles.css',                 // имя собранного основго файла стилей
                additionalDist: 'css/',                   // директория для сохранения дополнительных файлов стилей

                patterns: [
                    'sass-7-1-without-themes',
                    'sass-help',
                ],
            },
            scripts: {
                fileExtension: 'js',                              // расширения файлов для сборки
                sourcesDir: 'scripts/',                           // директоиря исходников скриптов
                vendorDir: 'scripts/vendor/',                     // вендоры
                mainFile: 'main.js',                                // основной файл для сборки
                additionalSourcesDir: 'scripts/pages/',      // директория отдельно собираемых (дополнительных) стилей

                dist: 'js/',                                      // директория для сохранения основного файла стилей
                distFileName: 'scripts.js',                         // имя собранного основго файла стилей
                additionalDist: 'js/',                            // директория для сохранения дополнительных файлов стилей
                patterns: [

                ],
            },
            images: {
                fileExtension: 'jpg,jpeg,png,gif,svg',
                sourcesDir: 'img/',                               // Где храниться графика для сборки
                dist: 'img/',
            },
            sprites: {
                notRetina: {
                    sourcesDir: 'img/.sprites/',
                    imgDist: 'img/sprites/',
                    scssDist: 'styles/sprites/',
                },
                retina: {
                    sourcesDir: 'img/.sprites-retina/',
                    imgDist: 'img/sprites-retina/',
                    scssDist: 'styles/sprites-retina/',
                },
            }
        },
    },

    /* Общие плагины */
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
    scripts: {
        plugins: {
            uglify: false,                               // Минификация
            babel: false,                                // Поддержка ES6
        }
    },

    images: {
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
            /*'./img/sprites-retina/',*/
            /*'./styles/sprites-retina/',*/
        ],
        spritesNotRetina: [
            './img/sprites/',
            './styles/sprites/',
        ]
    },
};