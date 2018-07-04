var fs = require('fs'),
    Transform = require('stream').Transform;

module.exports = {
    checkImageTimestamp: function () {
        var imagesCount = {
            all: 0,
            processed: 0,
            skip: 0,
        }

        var imageHash = {};
        if (fs.existsSync('.gulp/cache/processedImages.json')) {
            imageHash = JSON.parse(fs.readFileSync('.gulp/cache/processedImages.json', 'utf8'));
        }

        var transformStream = new Transform({objectMode: true});

        transformStream._transform = function(file, encoding, callback) {
            //process.stdout.clearLine();  // clear current text
            //process.stdout.cursorTo(0);  // move cursor to beginning of line
            //process.stdout.write("Изображений: " + imagesCount.all + ", требуют оптимизации: "+ imagesCount.processed);  // write text
            //console.log("Изображений: " + imagesCount.all + ", требуют оптимизации: "+ imagesCount.processed);

            if (file.isStream()) {
                this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
                return cb();
            }

            if (file.isBuffer()) {
                var stats = fs.statSync(file.path).mtime;

                imagesCount.all += 1;

                if(imageHash[file.path] == fs.statSync(file.path).mtime.toString())
                {
                    imagesCount.skip +=1;
                    callback();
                    return;
                }
                else
                    imagesCount.processed +=1;
            }

            callback(null, file);
        };

        transformStream.on('finish', () => {
            console.log('');
        });

        return transformStream;
    },

    createImageTimestamp: function () {
        var fileTimestamp = {};
        if (fs.existsSync('.gulp/cache/processedImages.json')) {
            fileTimestamp = JSON.parse(fs.readFileSync('.gulp/cache/processedImages.json', 'utf8'));
        }
        var transformStream = new Transform({objectMode: true});

        transformStream._transform = function(file, encoding, callback) {
            if (file.isStream()) {
                this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
                return cb();
            }

            if (file.isBuffer()) {
                var stats = fs.statSync(file.path).mtime.toString();
                fileTimestamp[file.path] = stats;
            }

            callback(null, file);
        };

        transformStream.on('finish', () => {
            var json = JSON.stringify(fileTimestamp);
            fs.writeFileSync('.gulp/cache/processedImages.json', json, 'utf8');
        });

        return transformStream;
    },


    postcssImportResolve: function (id, basedir, importOptions) {

        var result = [];

        importOptions.path.forEach(function (element) {
            id = id.replace(/(\.\.\/){1,}/,'');

            if (!id.match(/(.scss)/g)) {
                var isDir = false;
                try {
                    var stat = fs.lstatSync(element + '/' + id);
                    isDir = stat.isDirectory();
                }
                catch (ex) {}

                if(isDir)
                {
                    var files = fs.readdirSync(element + '/' + id);
                    files.forEach(function (fileName) {
                        result.push(element + '/' + id + '/' + fileName);
                    });
                }
                else
                {
                    if (fs.existsSync(element + '/' + id + '.scss')) {
                        result.push(element + '/' + id + '.scss');
                    }
                    if (fs.existsSync(element + '/' + id.replace(/[^\/]*$/,'_$&') + '.scss')) {
                        result.push(element + '/' + id.replace(/[^\/]*$/,'_$&') + '.scss');
                    }
                }
            }
            else {
                if (fs.existsSync(element + '/' + id)) {
                    result.push(element + '/' + id);
                }

                if (fs.existsSync(element + '/' + id.replace(/[^\/]*$/,'_$&'))) {
                    result.push(element + '/' + id.replace(/[^\/]*$/,'_$&'));
                }
            }
        });

        return result;
    }


};