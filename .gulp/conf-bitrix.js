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
        supportedBrowsers: ['> 1% in RU', 'ie >=9'],
        // Структура проекта
        structure: {
            pmdir: '.vendor',                             // директория в которую складывает файлы ващ менеджер пакетов (bower/yarn)
            styles: {
                fileExtension: 'css,scss',                  // расширения файлов для сборки
                sourcesDir: 'styles/',                    // директоиря исходников стилей
                vendorDir: 'styles/vendor/',              // вендоры
                // основной файл/файлы для сборки
                mainFile: [
                    'template_styles.scss'
                ],
                dist: 'css/',                             // директория для сохранения основного файла стилей
                distFileName: 'template_styles.css',                 // имя собранного основго файла стилей

                additionalSourcesDir: 'styles/pages/',    // директория отдельно собираемых (дополнительных) стилей
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
                // основной файл/файлы для сборки
                mainFile: [
                    'main.js'
                ],
                additionalSourcesDir: 'scripts/additionally/',      // директория отдельно собираемых (дополнительных) стилей
                dist: 'js/',                                      // директория для сохранения основного файла стилей
                distFileName: 'scripts.js',                         // имя собранного основго файла стилей
                additionalDist: 'js/',                            // директория для сохранения дополнительных файлов стилей
                patterns: [
                    'module'
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

    /* Настройка плагинов */
    // Генерация карты кода
    sourceMap: {
        createSourceMapProd: true,          // Генерация карты в режиме прода
        createSourceMapDev: true,           // Генерация карты в режиме дева
        saveDir: '.source_maps',          // Куда сохранять файлы карт, null — сохранять информацию прямо в файле
    },
    // Обработка скриптов
    scripts: {
        plugins: {
            uglify: false,                               // Минификация
            babel: false,                                // Поддержка ES6
        }
    },
    // Обработка изображений
    images: {
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
    }
};