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

log4js.configure( __dirname + '/../config/torrent_downloader.json', { reloadSecs: 300 });
system.execute("rm -rf /tmp/torrent-stream/*");

console.log('starting...');

start();

function start() {

    var self = this;

    self.diskSpaceLimit = 500 * 1024;
    self.openActions = 0;
    self.hostname = 'Odin';
    self.systemfolder = '/tmp/torrent-stream/';
    self.hostfolder   = '/mnt/odin/video/anime/';

    diskspace.check('/', function (err, total, free, status) {

        if (free < diskSpaceLimit) {
            console.error('...not enough space left on device');
            self.closeAction();
        } else {

            MongoClient.connect('mongodb://127.0.0.1:27017/jarvis', function (err, db) {

                if (err) throw err;

                self.episodesCollection = db.collection('episodes');
                self.tvseriesCollection = db.collection('tvseries');

                self.episodesCollection.find({ queue: true }).toArray(function (err, data) {

                    self.openActions += data.length;

                    if (openActions == 0) {
                        console.log('...nothing to do');
                        self.closeAction();
                    }

                    if (openActions > 0) {

                        //            for( var episode in data ) {
                        var episode = data[0];
                        if (true) {

                            self.tvseriesCollection.find({ 'id': episode.tvid}).toArray(function (err, data) {
                                if (data.length == 0) {
                                    console.error('...no tvseries to episode found: ' + episode.tvid);
                                    self.closeAction();
                                } else {
                                    self.downloadTorrent(episode, data[0])
                                        .then(self.finalizeTorrent)
                                        .then(self.moveTorrent);
                                }
                            });

                        }

                    }

                });

            });

        }
    });

    self.downloadTorrent = function( episode, tvseries ) {

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
//                    finalizeTorrent(tvseries, file);
                    deferred.resolve(tvseries, file);
                });

            });
        });

        engine.on('download', function (index) {
            console.log((' Piece: ' + index + ' downloaded'));
        });

        return deferred.promise;

    };

    self.finalizeTorrent = function(tvseries, file) {

        var deferred = Q.defer();
        ping.sys.probe(hostname, function (isAlive) {
            if (isAlive) {

                fs.exists(hostfolder + '/' + tvseries.desc, function (exists) {
                    if (exists) {
//                        moveTorrent(file);
                        deferred.resolve(file);
                    } else {
                        fs.mkdir(hostfolder + '/' + tvseries.desc, function (err) {
                            if (err) {
                                console.log(err);
                                self.closeAction();
                            }
//                            moveTorrent(file);
                            deferred.resolve(file);
                        });
                    }
                });

            } else {
                console.log('...host (' + hostname + ') is down');
                self.closeAction();
            }
        });

        return deferred.promise;

    };

    self.moveTorrent = function(file) {

        fs.rename(
                systemfolder + engine.infoHash + '/' + file.name,
                hostfolder + '/' + tvseries.desc + "/" + file.name,
            function (err) {

                if (err) {
                    console.log('...copy failed of: ' + file.name);
                    console.error(err);
                    self.closeAction();
                }


            }
        );

    };

    self.closeAction = function() {
        openActions--;
        if (openActions < 1) {
            db.close();
            console.log('...shutting down');
            log4js.shutdown(function () {
                process.exit(1);
            });
        }
    };

}