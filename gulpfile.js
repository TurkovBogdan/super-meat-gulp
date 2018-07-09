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
    folders = require('gulp-folders');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminGiflossy = require('imagemin-giflossy');
const imageminPngquant = require('imagemin-pngquant');

var conf = require('./.gulp/gulpconf.js'),
    func = require('./.gulp/modules/func.js');

var isDev = (argv.dev === undefined) ? false : true;
var isSourceMap = ((isDev == false && conf.sourceMap.createSourceMapProd) || (isDev == true && conf.sourceMap.createSourceMapDev)) ? true : false;


//-------------------------------------------------------------------------
//                 ОЧИСТКА ФАЙЛОВ
//-------------------------------------------------------------------------

gulp.task('clear:sprites-retina', function () {
    return del(conf.clear.spritesRetina);
});

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

if(conf.images.compression.jpg.enable === true)
{
    if(conf.images.compression.jpg.mozjpgEnable)
        imageMinConfig.push(imageminMozjpeg({
            quality: conf.images.compression.jpg.quality
        }));
    else
        imageMinConfig.push(imagemin.jpegtran({
            quality: conf.images.compression.jpg.quality
        }));
}

if(conf.images.compression.png.enable === true)
    imageMinConfig.push(imageminPngquant({
        speed: 11 - conf.images.compression.png.speed
    }));

if(conf.images.compression.gif.enable === true)
    imageMinConfig.push(imageminGiflossy({
        optimizationLevel: 3,
        optimize: 3
    }));

if(conf.images.compression.svg.enable === true)
    imageMinConfig.push(imagemin.svgo({
        plugins: [
            {removeViewBox: true},
            {cleanupIDs: false}
        ]
    }));

gulp.task('images:optimization', function () {
    return gulp
        .src(conf.images.src)
        .pipe(gulpif(!conf.images.srcIsDist, newer(conf.images.dist)))
        .pipe(gulpif(conf.images.srcIsDist, func.checkImageTimestamp()))
        .pipe(imagemin(imageMinConfig, {
            verbose: true
        }))
        .pipe(gulp.dest(conf.images.dist))
        .pipe(gulpif(conf.images.srcIsDist, func.createImageTimestamp()));
});

gulp.task('sprites:not-retina-optimization', ['sprites:not-retina'], function () {
    return gulp
        .src(conf.sprites.notRetina.imgDist + conf.images.imageFormat)
        .pipe(plumber())
        .pipe(imagemin(imagemin(imageMinConfig, {
            verbose: true
        })))
        .pipe(gulp.dest(conf.sprites.notRetina.imgDist));
});

gulp.task('sprites:retina-optimization', ['sprites:retina'], function () {
    return gulp
        .src(conf.sprites.forRetina.imgDist + conf.images.imageFormat)
        .pipe(plumber())
        .pipe(imagemin(imagemin(imageMinConfig, {
            verbose: true
        })))
        .pipe(gulp.dest(conf.sprites.forRetina.imgDist));
});

//-------------------------------------------------------------------------
//                 СПРАЙТЫ С ПОДДЕРЖКОЙ РЕТИНЫ
//-------------------------------------------------------------------------

var imagePreparationLog = [];
gulp.task('sprites:retina-preparation', ['clear:sprites-retina'], folders(conf.sprites.forRetina.src, function (folder) {
    return gulp.src(path.join(conf.sprites.forRetina.src, folder, conf.images.imageFormat))
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
                         .extent(size.width + (size.width % 2), size.height + (size.height % 2),'!'));
                }
            });
        }))
        .pipe(gulp.dest(conf.sprites.forRetina.src + '/' + folder + '/x2/'));
}));


gulp.task('sprites:retina-resize', ['sprites:retina-preparation'], folders(conf.sprites.forRetina.src, function (folder) {
    return gulp.src(path.join(conf.sprites.forRetina.src, folder + '/x2', '*'))
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
        .pipe(rename(conf.sprites.forRetina.namex1))
        .pipe(gulp.dest(conf.sprites.forRetina.src + '/' + folder + '/x1/'));
}));


gulp.task('sprites:retina', ['sprites:retina-resize'], folders(conf.sprites.forRetina.src, function (folder) {
    if(imagePreparationLog.length > 0)
    {
        console.log(color('\nВнимание! Изображения по пути:', 'YELLOW'));
        for (var i = 0; i < imagePreparationLog.length; i++) {
            console.log(imagePreparationLog[i]);
        }
        console.log(color('Имееют нечётную высоту/ширину. Для правильного ресайза до размеров x1, мы увеличили размеры изображения на 1 пиксель.\n', 'YELLOW'));

        imagePreparationLog.length = [];
    }

    var salt = md5(Date());

    var spriteData = gulp.src([
        conf.sprites.forRetina.src + '/' + folder + '/x2/*',
        conf.sprites.forRetina.src + '/' + folder + '/x1/*'
    ])
        .pipe(spritesmith({
            retinaSrcFilter: [conf.sprites.forRetina.src + '/' + folder + '/x2/*.*'],
            retinaImgName: 'sprite-' + folder + '-' + salt + '@2x.png',
            imgName: 'sprite-' + folder + '-' + salt + '@1x.png',
            cssName: 'sprite-' + folder + '.scss',
            imgPath: '../img/sprites-retina/' + 'sprite-' + folder + '-' + salt + '@1x.png',
            retinaImgPath: '../img/sprites-retina/' + 'sprite-' + folder + '-' + salt + '@2x.png',
            padding: 10,
            cssVarMap: function (sprite) {
                sprite.name = sprite.name + '-' + folder;
            },
            cssRetinaGroupsName: 'sprite-retina-'+folder
        }));

    var imgStream = spriteData.img
        .pipe(gulp.dest(conf.sprites.forRetina.imgDist));

    var cssStream = spriteData.css
        .pipe(gulp.dest(conf.sprites.forRetina.scssDist));

    return merge(imgStream, cssStream);
}));



//-------------------------------------------------------------------------
//                 СПРАЙТЫ БЕЗ ПОДДЕРЖКИ РЕТИНЫ
//-------------------------------------------------------------------------

gulp.task('sprites:not-retina', ['clear:sprites-not-retina'], folders(conf.sprites.notRetina.src, function (folder) {
    var salt = md5(Date());
    var spriteData = gulp.src(path.join(conf.sprites.notRetina.src, folder, conf.images.imageFormat))
        .pipe(spritesmith({
            imgName: conf.sprites.notRetina.imagePrefix + folder + '-' + salt + conf.sprites.notRetina.imageExtension,
            cssName: conf.sprites.notRetina.imagePrefix + folder + conf.sprites.notRetina.styleExtension,
            imgPath: conf.sprites.notRetina.styleLinkToImg + conf.sprites.notRetina.imagePrefix + folder + '-' + salt + conf.sprites.notRetina.imageExtension,
            padding: 10,
            cssVarMap: function (sprite) {
                sprite.name = folder + '-' + sprite.name;
            }
        }));

    var imgStream = spriteData.img
        .pipe(plumber())
        .pipe(buffer())
        .pipe(gulp.dest(conf.sprites.notRetina.imgDist));

    var cssStream = spriteData.css
        .pipe(gulp.dest(conf.sprites.notRetina.scssDist));

    return merge(imgStream, cssStream);
}));




//-------------------------------------------------------------------------
//                 СБОРКА СТИЛЕЙ
//-------------------------------------------------------------------------

var postCSSConfig = {
    before: [
        postcssImport({
            path: conf.styles.includePaths,
            extension: '.scss',
            resolve: func.postcssImportResolve,
        }),
    ],
    after: [
        autoprefixer({
            browsers: conf.project.supportedBrowsers,
            cascade: false
        }),
        cssnano({
            discardComments: {removeAll: true}
        }),
        require("css-mqpacker")()
    ]
};

// сборка основных стили сайта
gulp.task('styles:main', function () {
    return gulp
        .src(conf.styles.main.src)
        .pipe(plumber())
        .pipe(gulpif(isSourceMap, sourcemaps.init(conf.sourceMap.options)))
        .pipe(include())
        .pipe(concat(conf.styles.main.outputName))
        .pipe(postcss(postCSSConfig.before, {
            parser: require('postcss-scss'),
        }))
        .pipe(sass({
            includePaths: conf.styles.includePaths,
            errLogToConsole: true
        }))
        .pipe(postcss(postCSSConfig.after))
        .pipe(gulpif(isSourceMap, sourcemaps.write(conf.sourceMap.saveDir)))
        .pipe(gulp.dest(conf.styles.main.dist));
});

// сборка дополнительных файлов стилей
gulp.task('styles:additional', function () {
    return gulp
        .src(conf.styles.additional.src)
        .pipe(plumber())
        .pipe(gulpif(isSourceMap, sourcemaps.init(conf.sourceMap.options)))
        .pipe(include())
        .pipe(postcss(postCSSConfig.before, {
            parser: require('postcss-scss'),
        }))
        .pipe(sass({
            includePaths: conf.styles.includePaths,
            errLogToConsole: true
        }))
        .pipe(postcss(postCSSConfig.after))
        .pipe(gulpif(isSourceMap, sourcemaps.write(conf.sourceMap.saveDir)))
        .pipe(gulp.dest(conf.styles.additional.dist));
});



//-------------------------------------------------------------------------
//                 СБОРКА СКРИПТОВ
//-------------------------------------------------------------------------

gulp.task('scripts:main', function () {
    return gulp
        .src(conf.scripts.main.src)
        .pipe(plumber())
        .pipe(gulpif(isSourceMap, sourcemaps.init(conf.sourceMap.options)))
        .pipe(include())
        .pipe(concat(conf.scripts.main.outputName))
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
        .pipe(gulp.dest(conf.scripts.main.dist));
});

gulp.task('scripts:additional', function () {
    return gulp
        .src(conf.scripts.additional.src)
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
        .pipe(gulp.dest(conf.scripts.additional.dist));
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

gulp.task('watch', function () {
    console.log(color('\nСкрипты и стили собранны\nЗапущен watch\n', 'GREEN'));

    conf.tasks.mainCSS === true &&
        watch(conf.styles.main.watchDir, conf.watch, function () {
            gulp.start('styles:main');
        });

    conf.tasks.additionalCSS === true &&
        watch(conf.styles.additional.watchDir, conf.watch, function () {
            //todo: отдельная обработка для сокращения времени обработки
            gulp.start('styles:additional');
        });

    conf.tasks.mainJS === true &&
        watch(conf.scripts.main.watchDir, conf.watch, function () {
            gulp.start('scripts:main');
        });

    conf.tasks.additionalJS === true &&
        watch(conf.scripts.additional.watchDir, conf.watch, function () {
            //todo: отдельная обработка для сокращения времени обработки
            gulp.start('scripts:additional');
        });
    conf.tasks.images === true &&
        watch(conf.images.watchDir, conf.watch, function () {
            gulp.start('images:optimization');
        });
});



//-------------------------------------------------------------------------
//                 Инициализация шаблона структуры
//-------------------------------------------------------------------------

gulp.task('styles:structure-pattern', function () {
    return gulp
        .src('./.gulp/structure-pattern/styles/'+conf.project.styleStructurePattern.pattern+'/**/*')
        .pipe(gulp.dest(conf.project.styleStructurePattern.dist));
});