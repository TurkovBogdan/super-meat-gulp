var gulp = require('gulp'),
    argv = require('yargs').argv,
    path = require('path'),
    plumber = require('gulp-plumber'),
    include = require('gulp-include'),
    concat = require('gulp-concat'),
    sass = require('gulp-sass'),
    autoprefixer = require('autoprefixer'),
    sourcemaps = require('gulp-sourcemaps'),
    gulpif = require('gulp-if'),
    cssnano = require('cssnano'),
    del = require('del'),
    fs = require('fs'),
    md5 = require('md5'),
    watch = require('gulp-watch'),
    newer = require('gulp-newer'),
    spritesmith = require('gulp.spritesmith'),
    babel = require('gulp-babel'),
    uglify = require('gulp-uglify-es').default,
    color = require('gulp-color'),
    buffer = require('vinyl-buffer'),
    imagemin = require('gulp-imagemin'),
    merge = require('merge-stream'),
    postcssImport = require('postcss-partial-import'),
    rename = require('gulp-rename'),
    gm = require('gulp-gm'),
    gulpsync = require('gulp-sync')(gulp),
    postcss = require('gulp-postcss'),
    fsCache = require('gulp-fs-cache'),
    folders = require('gulp-folders'),
    batch = require('gulp-batch'),
    imageminMozjpeg = require('imagemin-mozjpeg'),
    imageminGiflossy = require('imagemin-giflossy'),
    imageminPngquant = require('imagemin-pngquant');

// Есть ли активный конфиг
if (!fs.existsSync('./.gulp/conf.js'))
{
    console.log(color('\nОтсутствует файл конфигурации сборщика.', 'RED'));
    console.log('Перейдите в директорию ' + color('.gulp', 'RED')+' и переименуйте один из представленных конфигов в ' + color('conf.js\n', 'RED'));
    process.exit();
}

var conf = require('./.gulp/conf.js'),
    func = require('./.gulp/modules/func.js'),
    isDev = (argv.dev === undefined) ? false : true,
    isSourceMap = ((isDev == false && conf.sourceMap.createSourceMapProd) || (isDev == true && conf.sourceMap.createSourceMapDev)) ? true : false,
    watchIsEnable = false;



//-------------------------------------------------------------------------
//                 ОБРАБОТКА ИЗОБРАЖЕНИЙ
//-------------------------------------------------------------------------
var imageMinConfig = [];

if (conf.images.compression.jpg.enable === true) {
    if (conf.images.compression.jpg.mozjpgEnable)
        imageMinConfig.push(imageminMozjpeg({
            quality: conf.images.compression.jpg.quality
        }));
    else
        imageMinConfig.push(imagemin.jpegtran({
            quality: conf.images.compression.jpg.quality
        }));
}

if (conf.images.compression.png.enable === true)
    imageMinConfig.push(imageminPngquant({
        speed: 11 - conf.images.compression.png.speed
    }));

if (conf.images.compression.gif.enable === true)
    imageMinConfig.push(imageminGiflossy({
        optimizationLevel: 3,
        optimize: 3
    }));

if (conf.images.compression.svg.enable === true)
    imageMinConfig.push(imagemin.svgo({
        plugins: [
            {removeViewBox: true},
            {cleanupIDs: false}
        ]
    }));

var images = {};
if (conf.project.structure.images.fileExtension.search(/\,/i) === -1)
    images.ext = conf.project.structure.images.fileExtension;
else
    images.ext = '{' + conf.project.structure.images.fileExtension + '}';

images.src = [
    conf.project.structure.images.sourcesDir + '**/*.' + images.ext,
    '!' + conf.project.structure.sprites.notRetina.sourcesDir + '**/*',
    '!' + conf.project.structure.sprites.retina.sourcesDir + '**/*',
    '!' + conf.project.structure.sprites.notRetina.imgDist + '**/*',
    '!' + conf.project.structure.sprites.retina.imgDist + '**/*',
];

images.dist = conf.project.structure.images.dist;
images.srcIsDist = false;
if (conf.project.structure.images.sourcesDir === conf.project.structure.images.dist)
    images.srcIsDist = true;

gulp.task('images:optimization', function () {
    return gulp
        .src(images.src)
        .pipe(plumber())
        .pipe(gulpif(!images.srcIsDist, newer(images.dist)))
        .pipe(gulpif(images.srcIsDist, func.checkImageTimestamp('processedImages.json')))
        .pipe(imagemin(imageMinConfig, {
            verbose: true
        }))
        .pipe(gulp.dest(images.dist))
        .pipe(gulpif(images.srcIsDist, func.createImageTimestamp('processedImages.json')));
});



//-------------------------------------------------------------------------
//                 СПРАЙТЫ С ПОДДЕРЖКОЙ РЕТИНЫ
//-------------------------------------------------------------------------
var spritesRetina = {
    src: conf.project.structure.sprites.retina.sourcesDir,
    imgDist: conf.project.structure.sprites.retina.imgDist,
    ext: '*.' + images.ext
};

gulp.task('clear:sprites-retina-cache', function () {
    return del([
        conf.project.structure.sprites.retina.sourcesDir + '**/x2/',
        conf.project.structure.sprites.retina.sourcesDir + '**/x1/',
    ]);
});

gulp.task('clear:sprites-retina', function () {
    return del([
        conf.project.structure.sprites.retina.imgDist + '*',
    ]);
});

var imagePreparationLog = [];
gulp.task('sprites:retina-preparation', ['clear:sprites-retina'], folders(spritesRetina.src, function (folder) {
    return gulp.src(path.join(spritesRetina.src, folder, '*.' + images.ext))
        .pipe(newer(spritesRetina.src + folder + '/x2/'))
        .pipe(gm(function handleGm(gmfile, done) {
            gmfile.size(function (err, size) {
                if (err) {
                    console.log(color('\nВнимание! Ошибка при обработке файла:\n', 'RED'));
                    console.log(gmfile.source);
                    return done(err);
                }

                if (size.width % 2 === 0 && size.height % 2 === 0) {
                    return done(null, gmfile);
                }

                if (size.width % 2 !== 0 || size.height % 2 !== 0) {
                    imagePreparationLog.push(gmfile.source);
                    return done(null, gmfile
                        .background('transparent')
                        .gravity('center')
                        .extent(size.width + (size.width % 2), size.height + (size.height % 2), '!'));
                }
            });
        }))
        .pipe(gulp.dest(spritesRetina.src + folder + '/x2/'));
}));

gulp.task('sprites:retina-resize', ['sprites:retina-preparation'], folders(spritesRetina.src, function (folder) {
    return gulp.src(path.join(spritesRetina.src, folder + '/x2', '*'))
        .pipe(newer({
            dest: spritesRetina.src + folder + '/x1/',
            map: function (relativePath) {
                return "ic-"+relativePath;
            }
        }))
        .pipe(gm(function handleGm(gmfile, done) {
            gmfile.size(function handleSize(err, size) {
                if (err) {
                    return done(err);
                }
                return done(null, gmfile
                    .background('transparent')
                    .gravity('northwest')
                    .quality(100)
                    .filter('Sinc')
                    //http://www.graphicsmagick.org/GraphicsMagick.html#details-filter
                    .resize(size.width / 2, size.height / 2, '!'));
            });
        }))
        .pipe(rename({
            prefix: "ic-",
        }))
        .pipe(gulp.dest(spritesRetina.src + folder + '/x1/'));
}));

gulp.task('sprites:retina-builder', ['sprites:retina-resize'], folders(spritesRetina.src, function (folder) {
    if (imagePreparationLog.length > 0) {
        console.log(color('\nВнимание! Изображения по пути:', 'YELLOW'));
        for (var i = 0; i < imagePreparationLog.length; i++) {
            console.log(imagePreparationLog[i]);
        }
        console.log(color('Имееют нечётную высоту/ширину. Для правильного ресайза до размеров x1, мы увеличили размеры изображения на 1 пиксель.\n', 'YELLOW'));
        imagePreparationLog.length = [];
    }

    var salt = md5(Date());
    var spriteData = gulp.src([
        spritesRetina.src + folder + '/x2/*',
        spritesRetina.src + folder + '/x1/*'
    ])
        .pipe(spritesmith({
            retinaSrcFilter: [spritesRetina.src + folder + '/x2/*.*'],
            retinaImgName: 'sprite-' + folder + '-' + salt + '@2x.png',
            imgName: 'sprite-' + folder + '-' + salt + '@1x.png',
            cssName: 'sprite-' + folder + '.scss',
            imgPath: '../img/sprites-retina/' + 'sprite-' + folder + '-' + salt + '@1x.png',
            retinaImgPath: '../img/sprites-retina/' + 'sprite-' + folder + '-' + salt + '@2x.png',
            padding: 10,
            cssVarMap: function (sprite) {
                sprite.name = sprite.name + '-' + folder;
            },
            cssRetinaGroupsName: folder + '-retina-groups'
        }));

    var imgStream = spriteData.img
        .pipe(gulp.dest('./img/sprites-retina/'));

    var cssStream = spriteData.css
        .pipe(gulp.dest('./styles/sprites-retina/'));

    return merge(imgStream, cssStream);
}));

gulp.task('sprites:retina', ['sprites:retina-builder'], function () {
    if (watchIsEnable) {
        gulp.start('styles:main');
        gulp.start('styles:additional');
    }
    return gulp
        .src(spritesRetina.imgDist + spritesRetina.ext)
        .pipe(plumber())
        .pipe(imagemin(imageMinConfig, {
            verbose: true
        }))
        .pipe(gulp.dest('./img/sprites-retina/'));
});



//-------------------------------------------------------------------------
//                 СПРАЙТЫ БЕЗ ПОДДЕРЖКИ РЕТИНЫ
//-------------------------------------------------------------------------
var spritesNotRetina = {
    src: conf.project.structure.sprites.notRetina.sourcesDir,
    ext: '*.' + images.ext
};

gulp.task('clear:sprites-not-retina', function () {
    return del([
        conf.project.structure.sprites.notRetina.imgDist + '*',
        conf.project.structure.sprites.notRetina.scssDist + '*',
    ]);
});

gulp.task('sprites:not-retina-builder', ['clear:sprites-not-retina'], folders(spritesNotRetina.src, function (folder) {
    var salt = md5(Date());
    var spriteData = gulp.src(path.join(spritesNotRetina.src, folder, spritesNotRetina.ext))
        .pipe(spritesmith({
            imgName: 'sprite-' + folder + '-' + salt + '.png',
            cssName: 'sprite-' + folder + '.scss',
            imgPath: '../img/sprites/' + 'sprite-' + folder + '-' + salt + '.png',
            padding: 10,
            cssVarMap: function (sprite) {
                sprite.name = folder + '-' + sprite.name;
            }
        }));

    var imgStream = spriteData.img
        .pipe(plumber())
        .pipe(buffer())
        .pipe(gulp.dest('./img/sprites/'));

    var cssStream = spriteData.css
        .pipe(gulp.dest('./styles/sprites/'));

    return merge(imgStream, cssStream);
}));

gulp.task('sprites:not-retina', ['sprites:not-retina-builder'], function () {
    if (watchIsEnable) {
        gulp.start('styles:main');
        gulp.start('styles:additional');
    }
    return gulp
        .src('./img/sprites/' + spritesNotRetina.ext)
        .pipe(plumber())
        .pipe(imagemin(imagemin(imageMinConfig, {
            verbose: true
        })))
        .pipe(gulp.dest('./img/sprites/'));
});



//-------------------------------------------------------------------------
//                 СБОРКА СТИЛЕЙ
//-------------------------------------------------------------------------
gulp.task('styles:clear', function () {
    return del([
        conf.project.structure.styles.dist+'*'
    ]);
});

// сборка основных стили сайта
var stylesMain = {};
if (conf.project.structure.styles.fileExtension.search(/\,/i) === -1)
    stylesMain.ext = conf.project.structure.styles.fileExtension;
else
    stylesMain.ext = '{' + conf.project.structure.styles.fileExtension + '}';


if(Array.isArray(conf.project.structure.styles.mainFile))
{
    stylesMain.src = [];
    conf.project.structure.styles.mainFile.forEach(function(file) {
        stylesMain.src.push(conf.project.structure.styles.sourcesDir + file);
    });
}
else
    stylesMain.src = conf.project.structure.styles.sourcesDir + conf.project.structure.styles.mainFile;

stylesMain.dist = conf.project.structure.styles.dist;
stylesMain.fileName = conf.project.structure.styles.distFileName;
stylesMain.includePaths = [
    conf.project.structure.styles.sourcesDir,
    conf.project.structure.styles.vendorDir,
    conf.project.structure.pmdir,
    './'
];

// Конфиг PostCSS
var postCSSConfig = {
    // Плагины выполняемые до обработки препроцессором
    before: [
        postcssImport({
            path: stylesMain.includePaths,
            extension: '.scss',
            resolve: func.postcssImportResolve,
        }),
    ],
    // Плагины выполняемые после обработки препроцессором
    after: [
        require("css-mqpacker")(),
        autoprefixer({
            browsers: conf.project.supportedBrowsers,
            cascade: false
        }),
        cssnano({
            discardComments: {removeAll: true}
        }),
    ]
};

gulp.task('styles:main', function () {
    return gulp
        .src(stylesMain.src)
        .pipe(plumber())
        .pipe(gulpif(isSourceMap, sourcemaps.init({largeFile: true})))
        .pipe(include())
        .pipe(concat(stylesMain.fileName))
        .pipe(postcss(postCSSConfig.before, {
            parser: require('postcss-scss'),
        }))
        .pipe(sass({
            includePaths: stylesMain.includePaths,
            errLogToConsole: true
        }))
        .pipe(postcss(postCSSConfig.after))
        .pipe(gulpif(isSourceMap, sourcemaps.write(conf.sourceMap.saveDir)))
        .pipe(gulp.dest(stylesMain.dist));
});

// сборка дополнительных файлов стилей
var stylesAdditional = {};
stylesAdditional.src = conf.project.structure.styles.additionalSourcesDir + '**/*.' + stylesMain.ext;
stylesAdditional.dist = conf.project.structure.styles.additionalDist;
gulp.task('styles:additional', function () {
    return gulp
        .src(stylesAdditional.src)
        .pipe(plumber())
        .pipe(gulpif(isSourceMap, sourcemaps.init({largeFile: true})))
        .pipe(include())
        .pipe(postcss(postCSSConfig.before, {
            parser: require('postcss-scss'),
        }))
        .pipe(sass({
            includePaths: stylesMain.includePaths,
            errLogToConsole: true
        }))
        .pipe(postcss(postCSSConfig.after))
        .pipe(gulpif(isSourceMap, sourcemaps.write(conf.sourceMap.saveDir)))
        .pipe(gulp.dest(stylesAdditional.dist));
});


//-------------------------------------------------------------------------
//                 СБОРКА СКРИПТОВ
//-------------------------------------------------------------------------
gulp.task('scripts:clear', function () {
    return del([
        conf.project.structure.scripts.dist+'*'
    ]);
});

var scriptsMain = {};

if(Array.isArray(conf.project.structure.scripts.mainFile))
{
    scriptsMain.src = [];
    conf.project.structure.scripts.mainFile.forEach(function(file) {
        scriptsMain.src.push(conf.project.structure.scripts.sourcesDir + file);
    });
}
else
    scriptsMain.src = conf.project.structure.scripts.sourcesDir + conf.project.structure.scripts.mainFile;
scriptsMain.dist = conf.project.structure.scripts.dist;
scriptsMain.fileName = conf.project.structure.scripts.distFileName;

gulp.task('scripts:main', function () {
    var jsCache = fsCache('.gulp/cache/js');

    return gulp
        .src(scriptsMain.src)
        .pipe(plumber())
        .pipe(gulpif(isSourceMap, sourcemaps.init({largeFile: true})))
        .pipe(include())
        .pipe(jsCache)
        .pipe(gulpif(conf.scripts.plugins.babel, babel({
            presets: [
                ["env", {
                    "targets": {
                        "browsers": conf.project.browsers
                    }
                }]
            ]
        })))
        .pipe(gulpif(conf.scripts.plugins.uglify, uglify()))
        .pipe(jsCache.restore)
        .pipe(concat(scriptsMain.fileName))
        .pipe(gulpif(isSourceMap, sourcemaps.write(conf.sourceMap.saveDir)))
        .pipe(gulp.dest(scriptsMain.dist));
});

// Дополнительные файлы скриптов
var scriptsAdditional = {};
if (conf.project.structure.scripts.fileExtension.search(/\,/i) === -1)
    scriptsAdditional.ext = conf.project.structure.scripts.fileExtension;
else
    scriptsAdditional.ext = '{' + conf.project.structure.scripts.fileExtension + '}';
scriptsAdditional.src = conf.project.structure.scripts.additionalSourcesDir + '**/*.' + scriptsAdditional.ext;
scriptsAdditional.dist = conf.project.structure.scripts.additionalDist;

gulp.task('scripts:additional', function () {
    return gulp
        .src(scriptsAdditional.src)
        .pipe(plumber())
        .pipe(gulpif(isSourceMap, sourcemaps.init({largeFile: true})))
        .pipe(include())
        .pipe(gulpif(conf.scripts.plugins.babel, babel({
            presets: [
                ["env", {
                    "targets": {
                        "browsers": conf.project.browsers
                    }
                }]
            ]
        })))
        .pipe(gulpif(conf.scripts.plugins.uglify, uglify()))
        .pipe(gulpif(isSourceMap, sourcemaps.write(conf.sourceMap.saveDir)))
        .pipe(gulp.dest(scriptsAdditional.dist));
});


//-------------------------------------------------------------------------
//                 ОСНОВНАЯ СБОРКА
//-------------------------------------------------------------------------
var tasks = [[], [], []];
var tasksSync = [];
if(conf.tasks.mainCSS || conf.tasks.additionalCSS)
    tasks[0].push('styles:clear');
conf.tasks.mainCSS === true && tasks[2].push('styles:main');
conf.tasks.additionalCSS === true && tasks[2].push('styles:additional');
if(conf.tasks.mainJS || conf.tasks.additionalJS)
    tasks[0].push('scripts:clear');
conf.tasks.mainJS === true && tasks[2].push('scripts:main');
conf.tasks.additionalJS === true && tasks[2].push('scripts:additional');
conf.tasks.sprites === true && tasks[1].push('sprites:not-retina');
conf.tasks.spritesRetina === true && tasks[1].push('sprites:retina');
conf.tasks.images === true && tasks[1].push('images:optimization');
tasks[0].length !== 0 && tasksSync.push(tasks[0]);
tasks[1].length !== 0 && tasksSync.push(tasks[1]);
tasks[2].length !== 0 && tasksSync.push(tasks[2]);
conf.tasks.watch === true && tasksSync.push('watch');

gulp.task('default', gulpsync.sync(tasksSync, 'Группа задач '));



//-------------------------------------------------------------------------
//                 ОТСЛЕЖИВАНИЕ ИЗМЕНЕНИЙ
//-------------------------------------------------------------------------

var watchConfig = {
    ignoreInitial: true,
    awaitWriteFinish: true,
    read: false,
    verbose: false,
    readDelay: 600,
};

gulp.task('watch', function () {
    watchIsEnable = true;
    console.log(color('\nСкрипты и стили собранны\nЗапущен watch\n', 'GREEN'));

    // watch для основных стилей
    var watchStylesMain = [];
    watchStylesMain.push(conf.project.structure.styles.sourcesDir + '**/*.' + stylesMain.ext);
    watchStylesMain.push('!' + conf.project.structure.styles.additionalSourcesDir + '**');
    watchStylesMain.push('!' + conf.project.structure.sprites.notRetina.scssDist + '**');
    watchStylesMain.push('!' + conf.project.structure.sprites.retina.scssDist + '**');
    conf.tasks.mainCSS === true &&
    watch(watchStylesMain, watchConfig, function () {
        gulp.start('styles:main');
        gulp.start('styles:additional');
    });

    // watch для дополнительных стилей
    var watchStylesAdditional = [];
    watchStylesAdditional.push(conf.project.structure.styles.sourcesDir + '**/*.' + stylesMain.ext);
    watchStylesAdditional.push('!' + conf.project.structure.sprites.notRetina.scssDist + '**');
    watchStylesAdditional.push('!' + conf.project.structure.sprites.retina.scssDist + '**');
    conf.tasks.additionalCSS === true &&
    watch(watchStylesAdditional, watchConfig, function () {
        //todo: отдельная обработка для сокращения времени обработки
        gulp.start('styles:additional');
    });

    // watch для основных скриптов
    var watchScriptsMain = [];
    watchScriptsMain.push(conf.project.structure.scripts.sourcesDir + '**/*.' + scriptsMain.ext);
    watchScriptsMain.push('!' + conf.project.structure.scripts.additionalSourcesDir + '**');
    conf.tasks.mainJS === true &&
    watch(watchScriptsMain, watchConfig, function () {
        gulp.start('scripts:main');
        gulp.start('scripts:additional');
    });

    // watch для дополнительных скриптов
    var watchScriptsAdditional = [];
    watchScriptsAdditional.push(conf.project.structure.scripts.sourcesDir + '**/*.' + scriptsAdditional.ext);
    conf.tasks.additionalJS === true &&
    watch(watchScriptsAdditional, watchConfig, batch({timeout: 600},function (events, cb) {
        gulp.start('scripts:additional');
    }));

    // watch для изображений
    var watchImages = [];
    watchImages.push(conf.project.structure.images.sourcesDir + '**/*.' + images.ext);
    watchImages.push('!' + conf.project.structure.sprites.notRetina.sourcesDir + '**/*');
    watchImages.push('!' + conf.project.structure.sprites.retina.sourcesDir + '**/*');
    watchImages.push('!' + conf.project.structure.sprites.notRetina.imgDist + '**/*');
    watchImages.push('!' + conf.project.structure.sprites.retina.imgDist + '**/*');
    conf.tasks.images === true &&
    watch(watchImages, watchConfig, batch({timeout: 1200}, function (events, cb) {
        gulp.start('images:optimization');
    }));

    // watch для спрайтов без ретины
    var watchSprites = [];
    watchSprites.push(conf.project.structure.sprites.notRetina.sourcesDir + '**/*');
    conf.tasks.sprites === true &&
    watch(watchSprites, watchConfig, batch({timeout: 500}, function (events, cb) {
        gulp.start('sprites:not-retina');
    }));

    //watch для спрайтов с ретиной
    var watchSpritesRetina = [];
    watchSpritesRetina.push(conf.project.structure.sprites.retina.sourcesDir + '**/*');
    watchSpritesRetina.push('!' + conf.project.structure.sprites.retina.sourcesDir + '**/x1/*');
    watchSpritesRetina.push('!' + conf.project.structure.sprites.retina.sourcesDir + '**/x2/*');
    conf.tasks.spritesRetina === true &&
    watch(watchSpritesRetina, watchConfig, batch({timeout: 500}, function (events, cb) {
        gulp.start('sprites:retina')
    }));
});


//-------------------------------------------------------------------------
//                 Инициализация шаблона структуры
//-------------------------------------------------------------------------
gulp.task('project:create-structure', function () {
    // Структура стилей
    if (conf.tasks.mainCSS) {
        if (!fs.existsSync(conf.project.structure.styles.sourcesDir))
            fs.mkdirSync(conf.project.structure.styles.sourcesDir);

        if(Array.isArray(conf.project.structure.styles.mainFile))
        {
            conf.project.structure.styles.mainFile.forEach(function(file) {
                if (!fs.existsSync(conf.project.structure.styles.sourcesDir + file))
                    fs.writeFileSync(conf.project.structure.styles.sourcesDir + file, '');
            });
        }
        else
        {
            if (!fs.existsSync(conf.project.structure.styles.sourcesDir + conf.project.structure.styles.mainFile))
                fs.writeFileSync(conf.project.structure.styles.sourcesDir + conf.project.structure.styles.mainFile, '');
        }
    }

    if (conf.tasks.additionalCSS) {
        if (!fs.existsSync(conf.project.structure.styles.additionalSourcesDir))
            fs.mkdirSync(conf.project.structure.styles.additionalSourcesDir);
    }

    if(conf.tasks.mainCSS || conf.tasks.additionalCSS)
    {
        if (!fs.existsSync(conf.project.structure.styles.vendorDir))
            fs.mkdirSync(conf.project.structure.styles.vendorDir);

        // Шаблоны стркутур стилей
        gulp.start('project:structure-pattern-style-copy');
        gulp.start('project:structure-pattern-style-main');
    }

    // Структура скриптов
    if (conf.tasks.mainJS) {
        if (!fs.existsSync(conf.project.structure.scripts.sourcesDir))
            fs.mkdirSync(conf.project.structure.scripts.sourcesDir);

        if(Array.isArray(conf.project.structure.scripts.mainFile))
        {
            conf.project.structure.scripts.mainFile.forEach(function(file) {
                if (!fs.existsSync(conf.project.structure.scripts.sourcesDir + file))
                    fs.writeFileSync(conf.project.structure.scripts.sourcesDir + file, '');
            });
        }
        else
        {
            if (!fs.existsSync(conf.project.structure.scripts.sourcesDir + conf.project.structure.scripts.mainFile))
                fs.writeFileSync(conf.project.structure.scripts.sourcesDir + conf.project.structure.scripts.mainFile, '');
        }
    }

    if (conf.tasks.additionalJS) {
        if (!fs.existsSync(conf.project.structure.scripts.additionalSourcesDir))
            fs.mkdirSync(conf.project.structure.scripts.additionalSourcesDir);
    }

    if(conf.tasks.mainJS || conf.tasks.additionalJS)
    {
        if (!fs.existsSync(conf.project.structure.scripts.vendorDir))
            fs.mkdirSync(conf.project.structure.scripts.vendorDir);

        // Шаблоны стркутур стилей
        gulp.start('project:structure-pattern-scripts-copy');
        gulp.start('project:structure-pattern-scripts-main');
    }

    if(conf.tasks.images)
    {
        if (!fs.existsSync(conf.project.structure.images.sourcesDir))
            fs.mkdirSync(conf.project.structure.images.sourcesDir);
    }

    if(conf.tasks.sprites)
    {
        if (!fs.existsSync(conf.project.structure.sprites.notRetina.sourcesDir))
            fs.mkdirSync(conf.project.structure.sprites.notRetina.sourcesDir);
        if (!fs.existsSync(conf.project.structure.sprites.notRetina.sourcesDir+'global/'))
            fs.mkdirSync(conf.project.structure.sprites.notRetina.sourcesDir+'global/');
    }

    if(conf.tasks.spritesRetina)
    {
        if (!fs.existsSync(conf.project.structure.sprites.retina.sourcesDir))
            fs.mkdirSync(conf.project.structure.sprites.retina.sourcesDir);
        if (!fs.existsSync(conf.project.structure.sprites.retina.sourcesDir+'global/'))
            fs.mkdirSync(conf.project.structure.sprites.retina.sourcesDir+'global/');
    }

});

//todo: придумать способ объединения любых файлов, а не только основного
gulp.task('project:structure-pattern-style-copy', function () {
    var patternList = [];
    conf.project.structure.styles.patterns.forEach(function(file) {
        patternList.push('.gulp/pattern/styles/'+file+'/**/*');
        patternList.push('!.gulp/pattern/styles/'+file+'/{main}.scss');
    });

    return gulp
        .src(patternList)
        .pipe(gulp.dest(conf.project.structure.styles.sourcesDir));
});

gulp.task('project:structure-pattern-style-main', function () {
    var patternList = [];
    conf.project.structure.styles.patterns.forEach(function(file) {
        patternList.push('.gulp/pattern/styles/'+file+'/{main}.scss');
    });

    var fileName = '';
    if(Array.isArray(conf.project.structure.styles.mainFile))
        fileName = conf.project.structure.styles.mainFile[0];
    else
        fileName = conf.project.structure.styles.mainFile;

    return gulp
        .src(patternList)
        .pipe(concat(fileName))
        .pipe(gulp.dest(conf.project.structure.styles.sourcesDir));
});

gulp.task('project:structure-pattern-scripts-copy', function () {
    var patternList = [];
    conf.project.structure.scripts.patterns.forEach(function(file) {
        patternList.push('.gulp/pattern/scripts/'+file+'/**/*');
        patternList.push('!.gulp/pattern/scripts/'+file+'/{main}.js');
    });

    return gulp
        .src(patternList)
        .pipe(gulp.dest(conf.project.structure.scripts.sourcesDir));
});

gulp.task('project:structure-pattern-scripts-main', function () {
    var patternList = [];
    conf.project.structure.scripts.patterns.forEach(function(file) {
        patternList.push('.gulp/pattern/scripts/'+file+'/{main}.js');
    });

    var fileName = '';
    if(Array.isArray(conf.project.structure.scripts.mainFile))
        fileName = conf.project.structure.scripts.mainFile[0];
    else
        fileName = conf.project.structure.scripts.mainFile;

    return gulp
        .src(patternList)
        .pipe(concat(fileName))
        .pipe(gulp.dest(conf.project.structure.scripts.sourcesDir));
});