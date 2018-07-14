var fs = require('fs'),
    path = require('path'),
    Transform = require('stream').Transform;

module.exports = {
    checkImageTimestamp: function (fileName) {
        var imagesCount = {
            all: 0,
            processed: 0,
            skip: 0,
        }

        var imageHash = {};
        if (fs.existsSync('.gulp/cache/'+fileName)) {
            imageHash = JSON.parse(fs.readFileSync('.gulp/cache/'+fileName, 'utf8'));
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

        /*        transformStream.on('finish', () => {
                    //console.log('');
                });*/

        return transformStream;
    },

    ensureDirectoryExistence: function (filePath) {
        var dirname = path.dirname(filePath);
        if (fs.existsSync(dirname)) {
            return true;
        }
        this.ensureDirectoryExistence(dirname);
        fs.mkdirSync(dirname);
    },

    createImageTimestamp: function (fileName) {
        var transformStream = new Transform({objectMode: true});

        transformStream._transform = function(file, encoding, callback) {
            if (file.isStream()) {
                this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
                return cb();
            }

            if (file.isBuffer()) {
                var stats = fs.statSync(file.path).mtime.toString();
                var fileTimestamp = {};
                if (fs.existsSync('.gulp/cache/'+fileName)) {
                    fileTimestamp = JSON.parse(fs.readFileSync('.gulp/cache/'+fileName, 'utf8'));
                }
                fileTimestamp[file.path] = stats;

                var json = JSON.stringify(fileTimestamp);
                fs.writeFileSync('.gulp/cache/'+fileName, json, 'utf8');
            }

            callback(null, file);
        };

        /*        transformStream.on('finish', () => {
                    console.log('');
                    console.log(fileTimestamp);
                });*/

        return transformStream;
    },


    postcssImportResolve: function (id, basedir, importOptions) {
        var result = [];

        for (let element of importOptions.path) {
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
                    break;
                }
                else
                {
                    if (fs.existsSync(element + '/' + id + '.scss')) {
                        result.push(element + '/' + id + '.scss');
                        break;
                    }
                    if (fs.existsSync(element + '/' + id.replace(/[^\/]*$/,'_$&') + '.scss')) {
                        result.push(element + '/' + id.replace(/[^\/]*$/,'_$&') + '.scss');
                        break;
                    }
                    if (fs.existsSync(element + '/_' + id + '.scss')) {
                        result.push(element + '/_' + id + '.scss');
                        break;
                    }
                }
            }
            else {
                if (fs.existsSync(element + '/' + id)) {
                    result.push(element + '/' + id);
                    break;
                }

                if (fs.existsSync(element + '/' + id.replace(/[^\/]*$/,'_$&'))) {
                    result.push(element + '/' + id.replace(/[^\/]*$/,'_$&'));
                    break;
                }
                if (fs.existsSync(element + '/_' + id)) {
                    result.push(element + '/_' + id );
                    break;
                }
            }
        }
        return result;
    }
};