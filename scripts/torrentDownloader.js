/**
 * Created by g706138 on 27.01.2015.
 */

var torrentStream    = require('torrent-stream');
var MongoClient      = require('mongodb').MongoClient;
var log4js           = require('log4js');
var ping             = require('ping');
var system           = require(__dirname + "/../util/system.js");
var diskspace        = require('diskspace');
var fs               = require('fs');
var fs_extra         = require('fs-extra');
var Q                = require('q');
var sanitize         = require("sanitize-filename");
var glob             = require("glob");
var path             = require("path");
var ps               = require('ps-node');

log4js.configure( __dirname + '/../config/torrent_downloader.json', { reloadSecs: 300 });

console.log('starting...');

start();

function start() {

    var self = this;

    self.diskSpaceLimit = 1000 * 1024;
    self.workerLimit = 2;
    self.hostname = 'Odin';
    self.streamingFolder = '/tmp/torrent-stream/';
    self.localStoreFolder = '/home/pi/torrentStore/';
    self.remoteStoreFolder = '/mnt/odin/video/anime/';

    self.openActions = 0;

    ps.lookup(
        {
            command   : 'node',
            psargs    : 'aux',
            arguments : 'torrentDownloader.js'
        },
        function(err, resultList ) {

            if (err) {
                throw new Error(err);
            }

            if (resultList.length > 1) {
                console.log('...process already running');
                log4js.shutdown(function () {
                    process.exit(1);
                });
            } else {

                system.execute("rm -rf " + self.streamingFolder + "*");

                MongoClient.connect('mongodb://127.0.0.1:27017/jarvis', function (err, db) {

                    if (err) throw err;

                    diskspace.check('/', function (err, total, free, status) {

                        if (free < diskSpaceLimit) {
                            console.error('...not enough space left on device');
                            self.uploadLocalStore()
                                .then(self.closeAction);
                        } else {

                            self.episodesCollection = db.collection('episodes');
                            self.tvseriesCollection = db.collection('tvseries');

                            self.episodesCollection.find({ queue: true }).limit(workerLimit).toArray(function (err, data) {

                                self.openActions += data.length;

                                if (openActions < 1) {
                                    console.log('...nothing to do');
                                    self.closeAction();
                                } else {

                                    self.openActions++;

                                    self.uploadLocalStore()
                                        .then(function () {
                                            var deferred = Q.defer();
                                            var openEpisodes = data.length;
                                            data.forEach(function (episode) {
                                                new episodeDownloader(self, episode)
                                                    .then(function () {
                                                        openEpisodes--;
                                                        if (openEpisodes < 1) {
                                                            deferred.resolve();
                                                        }
                                                    });
                                            });
                                            return deferred.promise;
                                        })
                                        .then(self.uploadLocalStore)
                                        .catch(function (error) {
                                            console.error(error);
                                        })
                                        .finally(function () {
                                            self.closeAction();
                                        });

                                }

                            });


                        }

                    });

                });

            }

        }

    );



    self.closeAction = function () {
        openActions--;
        if (openActions < 1) {
            db.close();
            console.log('...shutting down');
            log4js.shutdown(function () {
                process.exit(1);
            });
        }
    };

    self.moveFile = function (srcPath, dstPath) {

        var deferred = Q.defer();
        var source = fs.createReadStream(srcPath);
        var destination = fs.createWriteStream(dstPath);

        console.log('...start piping from ' + srcPath);
        source.pipe(destination);

        destination.on('finish', function () {
            console.log('...finished piping to ' + dstPath);
            fs.unlinkSync(srcPath);
            deferred.resolve();
        });

        source.on('error', function (err) {
            deferred.reject(new Error(err));
        });
        destination.on('error', function (err) {
            deferred.reject(new Error(err));
        });

        return deferred.promise;

    };

    self.uploadLocalStore = function () {

        var deferred = Q.defer();

        self.checkFileHost()
            .then(function () {

                var fileList = glob.sync('**/*.*', { cwd: localStoreFolder });
                var openFiles = fileList.length;

                console.log('...start uploading local Storage (' + openFiles + ' files)');

                if (openFiles > 0) {

                    fileList.forEach(function (file) {

                        var srcPath = localStoreFolder + file;
                        var dstPath = remoteStoreFolder + file;

                        self.createFolder(remoteStoreFolder + path.dirname(file) + "/")
                            .then(function () {
                                return self.moveFile(srcPath, dstPath);
                            })
                            .catch(function (error) {
                                console.error(error);
                            })
                            .finally(function () {
                                openFiles--;
                                if (openFiles < 1) {
                                    deferred.resolve();
                                }
                            });

                    });

                } else {
                    system.execute("rm -rf " + localStoreFolder + "*");
                    deferred.resolve();
                }

            })
            .catch(function (error) {
                //Host down nothing to move
                deferred.resolve();
            });

        return deferred.promise;

    };

    self.checkFileHost = function () {
        var deferred = Q.defer();
        ping.sys.probe(hostname, function (isAlive) {
            if (isAlive) {
                deferred.resolve();
            } else {
                deferred.reject(new Error('Host ' + hostname + ' is down'));
            }
        });
        return deferred.promise;
    };

    self.createFolder = function (path) {
        var deferred = Q.defer();
        fs.exists(path, function (exists) {
            if (exists) {
                deferred.resolve();
            } else {
                fs_extra.mkdirs(path, function (err) {
                    if (err) {
                        deferred.reject(new Error(err));
                    } else {
                        deferred.resolve();
                    }
                });
            }
        });

        return deferred.promise;

    };

}

function episodeDownloader(downloader, episode) {

    var self = this;

    var deferred = Q.defer();

    self.episode    = episode;
    self.downloader = downloader;

    self.downloader.tvseriesCollection.find({'id': self.episode.tvid}).toArray(function (err, data) {
        if (err) {
            deferred.reject( new Error(err) );
        } else {
            if (data.length < 1) {
                console.error('...no tvseries to episode found: ' + self.episode.tvid);
                self.downloader.closeAction();
                deferred.resolve();
            } else {

                self.tvseries = data[0];
                self.tvseries.desc = sanitize(self.tvseries.desc);

                self.downloadTorrent()
                    .then(self.createLocalEntry)
                    .then(self.finalizeTorrent)
                    .catch(function (error) {
                        console.error(error);
                    })
                    .finally(function () {
                        self.downloader.closeAction();
                        deferred.resolve();
                    });
            }
        }
    });


    self.downloadTorrent = function() {

        var deferred = Q.defer();
        var engine = torrentStream(self.episode.magnet);

        engine.on('ready', function () {
            engine.files.forEach(function (file) {

                console.log('...streaming: ' + file.name);
                self.file = file;
                var stream = self.file.createReadStream();

                stream.on('data', function () {});

                stream.on('end', function () {
                    console.log('...finished: ' + self.file.name);
                    engine.destroy();
                    self.file.infoHash = engine.infoHash;
                    deferred.resolve();
                });

            });
        });

        engine.on('download', function (index) {
            console.info((' Piece: ' + index + ' downloaded'));
        });

        return deferred.promise;

    };

    self.createLocalEntry = function() {
        var deferred = Q.defer();
        var destFolder = localStoreFolder + self.tvseries.desc + "/";
        var srcPath = streamingFolder + self.file.infoHash + '/' + self.file.name;
        var dstPath = destFolder + '1x' + String('000' + self.episode.episodeNumber).slice(-3) + ' ' + self.file.name;

        self.downloader.createFolder( destFolder )
            .then( function() { return self.downloader.moveFile(srcPath, dstPath); } )
            .finally( function() { deferred.resolve(); } );

        return deferred.promise;

    };

    self.finalizeTorrent = function() {

        var deferred = Q.defer();
        self.episode.queue = false;

        self.downloader.episodesCollection.save(self.episode, function(err) {
            if (err) {
                deferred.reject( new Error(err) );
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise;

    };

    return deferred.promise;

}