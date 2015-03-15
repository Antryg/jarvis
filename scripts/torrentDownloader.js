/**
 * Created by g706138 on 27.01.2015.
 */

var torrentStream = require('torrent-stream');
var MongoClient   = require('mongodb').MongoClient;
var log4js        = require('log4js');
var ping          = require('ping');
var system        = require(__dirname + "/../util/system.js");
var diskspace     = require('diskspace');
var fs            = require('fs');
var Q             = require('q');
var sanitize      = require("sanitize-filename");

log4js.configure( __dirname + '/../config/torrent_downloader.json', { reloadSecs: 300 });
system.execute("rm -rf /tmp/torrent-stream/*");
//system.execute("find /tmp/torrent-stream/* -mtime +3 -exec rm {} \;");


console.log('starting...');

start();

function start() {

    var self = this;

    self.diskSpaceLimit = 500 * 1024;
    self.workerLimit = 1;
    self.openActions = 0;
    self.hostname = 'Odin';
    self.systemfolder = '/tmp/torrent-stream/';
    self.hostfolder   = '/mnt/odin/anime/';
//    self.hostfolder   = '/tmp/odin/';

    MongoClient.connect('mongodb://127.0.0.1:27017/jarvis', function (err, db) {

        if (err) throw err;

        diskspace.check('/', function (err, total, free, status) {

            if (free < diskSpaceLimit) {
                console.error('...not enough space left on device');
                self.closeAction();
            } else {

                self.episodesCollection = db.collection('episodes');
                self.tvseriesCollection = db.collection('tvseries');

                self.episodesCollection.find({ queue: true }).limit(workerLimit).toArray(function (err, data) {

                    self.openActions += data.length;

                    if ( openActions < 1 ) {
                        console.log('...nothing to do');
                        self.closeAction();
                    } else {

                        data.forEach( function(episode) {

                            self.tvseriesCollection.find({'id': episode.tvid}).toArray(function (err, data) {
                                if ( data.length < 1 ) {
                                    console.error('...no tvseries to episode found: ' + episode.tvid);
                                    self.closeAction();
                                } else {

                                    var tvseries = data[0];
                                    tvseries.desc = sanitize(tvseries.desc);

                                    self.checkFileHost()
                                        .then(function()     { return self.downloadTorrent(episode, tvseries); })
                                        .then(function(file) { return self.checkTvFolder(file, tvseries); })
                                        .then(function(file) { return self.moveTorrent(file, episode, tvseries); })
//                                        .then(function(file) { return self.finalizeTorrent(file, tvseries, episode); })
                                        .catch(function(error) { console.error(error); })
                                        .finally(self.closeAction);
                                }
                            });

                        } );

                    }

                });


            }

        });

        self.downloadTorrent = function (episode, tvseries) {

            var deferred = Q.defer();
            var engine = torrentStream(episode.magnet);

            engine.on('ready', function () {
                engine.files.forEach(function (file) {

                    console.log('...streaming: ' + file.name);
                    var stream = file.createReadStream();

                    stream.on('data', function () {});

                    stream.on('end', function () {
                        console.log('...finished: ' + file.name);
                        engine.destroy();
                        file.infoHash = engine.infoHash;
                        deferred.resolve(file);
                    });

                });
            });

//            engine.on('download', function (index) {
//                console.info((' Piece: ' + index + ' downloaded'));
//            });

            return deferred.promise;

        };

        self.checkTvFolder = function (file, tvseries) {

            var deferred = Q.defer();

            fs.exists(hostfolder + '/' + tvseries.desc, function (exists) {
                if (exists) {
                    deferred.resolve(file);
                } else {
                    fs.mkdir(hostfolder + '/' + tvseries.desc, function (err) {
                        if (err) {
                            deferred.reject( new Error(err) );
                        } else {
                            deferred.resolve(file);
                        }
                    });
                }
            });

            return deferred.promise;

        };

        self.moveTorrent = function (file, episode, tvseries) {

            var deferred = Q.defer();
            var sourcePath = systemfolder + file.infoHash + '/' + file.name;
            var destPath = hostfolder + '/' + tvseries.desc + "/" + '1x' + String('000' + episode.episodeNumber).slice(-3) + ' ' + file.name;

            var source = fs.createReadStream(sourcePath);
            var destination = fs.createWriteStream(destPath);

            source.pipe(destination);

            source.on(      'end',    function() { fs.unlinkSync(sourcePath); });
            destination.on( 'finish', function() { deferred.resolve(file);    });

            source.on(      'error', function(err) { deferred.reject( new Error(err) ); });
            destination.on( 'error', function(err) { deferred.reject( new Error(err) ); });

            return deferred.promise;

        };

        self.finalizeTorrent = function(file, tvseries, episode) {

            var deferred = Q.defer();
            deferred.resolve();
            return deferred.promise;

        };

        self.checkFileHost = function() {
            var deferred = Q.defer();
            ping.sys.probe(hostname, function (isAlive) {
                if (isAlive) {
                    deferred.resolve();
                } else {
                    deferred.reject( new Error( 'Host ' + hostname + ' is down' ) );
                }
            });
            return deferred.promise;
        };

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

    });

}