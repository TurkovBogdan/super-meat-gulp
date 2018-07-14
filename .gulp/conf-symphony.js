module.exports = {
    /* Настройки задач */
    tasks: {
        mainCSS: true,  //Сборка основного файла стилей
        additionalCSS: true,  //Сборка дополнительных файлов стилей
        mainJS: true,  //Сборка основного файла стилей
        additionalJS: true,  //Сборка дополнительных файлов стилей
        sprites: true,  //Спрайты без поддержки ретины
        spritesRetina: true,  //Спрайты c поддержкой ретины
        images: true,  //Обработка изображений
        watch: true,  //Отслеживание и автоприменение изменений
    },

    /* Настройки проетка */
    project: {
        // Поддерживаемые браузеры, используеться в автопрефиксере и других плагинах
        supportedBrowsers: ['> 1% in RU', 'ie >=9'],
        // Структура проекта
        structure: {
            pmdir: '.vendor',  //директория в которую складывает файлы ващ менеджер пакетов (bower/yarn)
            styles: {
                fileExtension: 'css,scss',  //расширения файлов для сборки
                sourcesDir: 'app/Resources/public/styles/',  //директоиря исходников стилей
                vendorDir: 'app/Resources/public/vendor/',  //вендоры
                // основной файл/файлы для сборки
                mainFile: [
                    'main.scss'
                ],
                dist: 'web/styles/',  //директория для сохранения основного файла стилей
                distFileName: 'styles.css',  //имя собранного основго файла стилей

                additionalSourcesDir: 'app/Resources/public/styles/pages/',  //директория отдельно собираемых (дополнительных) стилей
                additionalDist: 'web/styles/pages/',  //директория для сохранения дополнительных файлов стилей

                patterns: [],
            },
            scripts: {
                fileExtension: 'js',  //расширения файлов для сборки
                sourcesDir: 'app/Resources/public/scripts/',  //директоиря исходников скриптов
                vendorDir: 'app/Resources/public/scripts/vendor/',  //вендоры
                // основной файл/файлы для сборки
                mainFile: [
                    'main.js'
                ],
                additionalSourcesDir: 'app/Resources/public/scripts/pages/',  //директория отдельно собираемых (дополнительных) стилей
                dist: 'web/scripts/',  //директория для сохранения основного файла стилей
                distFileName: 'scripts.js',  //имя собранного основго файла стилей
                additionalDist: 'web/scripts/pages/',  //директория для сохранения дополнительных файлов стилей
                patterns: [],
            },
            images: {
                fileExtension: 'jpg,jpeg,png,gif,svg',
                sourcesDir: 'app/Resources/public/images/',  //Где храниться графика для сборки
                dist: 'web/images/',
            },
            sprites: {
                notRetina: {
                    sourcesDir: 'app/Resources/public/images/.sprites/',
                    imgDist: 'web/images/sprites/',
                    scssDist: 'app/Resources/public/styles/sprites/',
                },
                retina: {
                    sourcesDir: 'app/Resources/public/images/.sprites-retina/',
                    imgDist: 'web/images/sprites-retina/',
                    scssDist: 'app/Resources/public/styles/sprites-retina/',
                },
            }
        },
    },

    /* Настройка плагинов */
    // Генерация карты кода
    sourceMap: {
        createSourceMapProd: true,  //Генерация карты в режиме прода
        createSourceMapDev: true,  //Генерация карты в режиме дева
        saveDir: '.source_maps',  //Куда сохранять файлы карт, null — сохранять информацию прямо в файле
    },
    // Обработка скриптов
    scripts: {
        plugins: {
            uglify: true,  //Минификация
            babel: true,  //Поддержка ES6
        }
    },
    // Обработка изображений
    images: {
        compression: {
            jpg: {
                enable: true,
                quality: 100,  //Потеря качества, если 100, потери качества нет
                mozjpgEnable: true,  //Включить обработку через mozjpeg. Если отключено, используеться jpegtran
            },
            png: {
                enable: true,
                speed: 10,  //Колличество подходов при обработке, от 1 до 10 (больше = лучше и дольше)
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