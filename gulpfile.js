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
    doiuse = require('doiuse'),
    postcss = require('gulp-postcss'),
    fsCache = require('gulp-fs-cache'),
    folders = require('gulp-folders'),
    batch = require('gulp-batch'),
    imageminMozjpeg = require('imagemin-mozjpeg'),
    imageminGiflossy = require('imagemin-giflossy'),
    imageminPngquant = require('imagemin-pngquant');

var conf = require('./.gulp/gulpconf.js'),
    func = require('./.gulp/modules/func.js');

var isDev = (argv.dev === undefined) ? false : true;
var isSourceMap = ((isDev == false && conf.sourceMap.createSourceMapProd) || (isDev == true && conf.sourceMap.createSourceMapDev)) ? true : false;
var watchIsEnable = false;

//-------------------------------------------------------------------------
//                 ОЧИСТКА ФАЙЛОВ
//-------------------------------------------------------------------------


gulp.task('clear:sprites-not-retina', function () {
    return del(conf.clear.spritesNotRetina);
});

gulp.task('clear:build', function () {
    return del(conf.clear.build);
});

gulp.task('clear:cache', function () {
    return del(conf.clear.cache);
});


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

// Основной скрипт
var images = {};
if (conf.project.structure.images.fileExtension.search(/\,/i) === -1)
    images.ext = conf.project.structure.images.fileExtension;
else
    images.ext = '{' + conf.project.structure.images.fileExtension + '}';

images.src = [];
images.src.push(conf.project.structure.images.sourcesDir + '**/*.' + images.ext);
images.src.push('!' + conf.project.structure.sprites.notRetina.sourcesDir + '**/*');
images.src.push('!' + conf.project.structure.sprites.retina.sourcesDir + '**/*');
images.src.push('!' + conf.project.structure.sprites.notRetina.imgDist + '**/*');
images.src.push('!' + conf.project.structure.sprites.retina.imgDist + '**/*');

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
var spritesRetina = {};
spritesRetina.src = conf.project.structure.sprites.retina.sourcesDir;
spritesRetina.imgDist = conf.project.structure.sprites.retina.imgDist;
spritesRetina.ext = '*.' + images.ext;

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


gulp.task('sprites:retina', ['sprites:retina-resize'], folders(spritesRetina.src, function (folder) {
    if (imagePreparationLog.length > 0) {
        console.log(color('\nВнимание! Изображения по пути:', 'YELLOW'));
        for (var i = 0; i < imagePreparationLog.length; i++) {
            console.log(imagePreparationLog[i]);
        }
        console.log(color('Имееют нечётную высоту/ширину. Для правильного ресайза до размеров x1, мы увеличили размеры изображения на 1 пиксель.\n', 'YELLOW'));
        imagePreparationLog.length = [];
    }

    var salt = md5(Date());

    /**/
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

    /**/
    return merge(imgStream, cssStream);
}));

gulp.task('sprites:retina-optimization', ['sprites:retina'], function () {
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
var spritesNotRetina = {};
spritesNotRetina.src = conf.project.structure.sprites.notRetina.sourcesDir;
spritesNotRetina.ext = '*.' + images.ext;

gulp.task('sprites:not-retina', ['clear:sprites-not-retina'], folders(spritesNotRetina.src, function (folder) {
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

gulp.task('sprites:not-retina-optimization', ['sprites:not-retina'], function () {
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
// сборка основных стили сайта
var stylesMain = {};
if (conf.project.structure.styles.fileExtension.search(/\,/i) === -1)
    stylesMain.ext = conf.project.structure.styles.fileExtension;
else
    stylesMain.ext = '{' + conf.project.structure.styles.fileExtension + '}';

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
        .pipe(gulpif(isSourceMap, sourcemaps.init(conf.sourceMap.options)))
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
        .pipe(gulpif(isSourceMap, sourcemaps.init(conf.sourceMap.options)))
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
// Основной скрипт
var scriptsMain = {};
scriptsMain.src = conf.project.structure.scripts.sourcesDir + conf.project.structure.scripts.mainFile;
scriptsMain.dist = conf.project.structure.scripts.dist;
scriptsMain.fileName = conf.project.structure.scripts.distFileName;

gulp.task('scripts:main', function () {
    var jsCache = fsCache('.gulp/cache/js');

    return gulp
        .src(scriptsMain.src)
        .pipe(plumber())
        .pipe(gulpif(isSourceMap, sourcemaps.init(conf.sourceMap.options)))
        .pipe(include())
        .pipe(jsCache)
        .pipe(concat(scriptsMain.fileName))
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
        .pipe(gulpif(isSourceMap, sourcemaps.init(conf.sourceMap.options)))
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
var tasks = [[], []];
var tasksSync = ['clear:build'];
conf.tasks.mainCSS === true && tasks[1].push('styles:main');
conf.tasks.additionalCSS === true && tasks[1].push('styles:additional');
conf.tasks.mainJS === true && tasks[1].push('scripts:main');
conf.tasks.additionalJS === true && tasks[1].push('scripts:additional');
conf.tasks.sprites === true && tasks[0].push('sprites:not-retina-optimization');
conf.tasks.spritesRetina === true && tasks[0].push('sprites:retina-optimization');
conf.tasks.images === true && tasks[0].push('images:optimization');

tasks[0].length !== 0 && tasksSync.push(tasks[0]);
tasks[1].length !== 0 && tasksSync.push(tasks[1]);
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
        gulp.start('sprites:not-retina-optimization');
    }));

    //watch для спрайтов с ретиной
    var watchSpritesRetina = [];
    watchSpritesRetina.push(conf.project.structure.sprites.retina.sourcesDir + '**/*');
    watchSpritesRetina.push('!' + conf.project.structure.sprites.retina.sourcesDir + '**/x1/*');
    watchSpritesRetina.push('!' + conf.project.structure.sprites.retina.sourcesDir + '**/x2/*');
    conf.tasks.spritesRetina === true &&
    watch(watchSpritesRetina, watchConfig, batch({timeout: 500}, function (events, cb) {
        gulp.start('sprites:retina-optimization')
    }));
});


//-------------------------------------------------------------------------
//                 Инициализация шаблона структуры
//-------------------------------------------------------------------------
gulp.task('patterns:base-structure', function () {
    if (conf.tasks.mainCSS) {
        if (!fs.existsSync(conf.project.structure.styles.dir))
            fs.mkdirSync(conf.project.structure.styles.dir);

        if (!fs.existsSync(conf.styles.main.src)) {
            func.ensureDirectoryExistence(conf.styles.main.src);
            fs.writeFileSync(conf.styles.main.src, '', 'utf8');
        }
    }

    if (conf.tasks.additionalCSS) {

    }

    /*
    if (!fs.existsSync(conf.project.structure.images.dir))
        fs.mkdirSync(conf.project.structure.images.dir);

    if (!fs.existsSync(conf.project.structure.styles.dir))
        fs.mkdirSync(conf.project.structure.styles.dir);

    if (!fs.existsSync(conf.project.structure.scripts.dir))
        fs.mkdirSync(conf.project.structure.scripts.dir);


*/
});


gulp.task('styles:structure-pattern', function () {
    return gulp
        .src('./.gulp/structure-pattern/styles/' + conf.project.styleStructurePattern.pattern + '/**/*')
        .pipe(gulp.dest(conf.project.styleStructurePattern.dist));
});