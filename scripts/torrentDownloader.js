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

var diskSpaceLimit = 500 * 1024;
var openActions = 0;
var hostname = 'Odin';
var systemfolder = '/tmp/torrent-stream/';
var hostfolder   = '/mnt/odin/video/anime/';

log4js.configure( __dirname + '/../config/torrent_downloader.json', { reloadSecs: 300 });
system.execute("rm -rf /tmp/torrent-stream/*");

console.log('starting...');

diskspace.check('/', function (err, total, free, status) {

    if( free < diskSpaceLimit ) {
        console.error('...not enough space left on device');
        closeAction();
    } else {

        MongoClient.connect('mongodb://127.0.0.1:27017/jarvis', function(err, db) {

            if (err) throw err;

            var episodesCollection = db.collection('episodes');
            var tvseriesCollection = db.collection('tvseries');

            episodesCollection.find({ queue : true }).toArray( function( err, data ) {

                var openActions = data.length;
                if( openActions == 0 ) {
                    console.log('...nothing to do');
                    closeAction();
                }

                if( openActions > 0 ) {

        //            for( var episode in data ) {
                    var episode = data[0];
                    if(true) {

                        tvseriesCollectiontvseriesCollection.find({ 'id' : episode.tvid}).toArray(function( err, data ) {

                            if( data.length == 0 ) {
                                console.error('...no tvseries to episode found: ' + episode.tvid);
                                closeAction();
                            } else {

                                var engine = torrentStream(episode.magnet);
                                var tvseries = data[0];

                                engine.on('ready', function () {
                                    engine.files.forEach(function (file) {

                                        console.log('...streaming: ' + file.name);

                                        var stream = file.createReadStream();

                                        stream.on('data', function () {
                                        });

                                        stream.on('end', function () {

                                            console.log('...finished: ' + file.name);

                                            ping.sys.probe(hostname, function (isAlive) {
                                                if (isAlive) {
                                                    fs.rename(
                                                        systemfolder + engine.infoHash + '/' + file.name,
                                                        hostfolder + '/' + tvseries.desc + "/" + file.name,
                                                        function (err) {
                                                            console.log('...copy failed of: ' + file.name);
                                                            console.error(err);
                                                            closeAction();
                                                        }
                                                    );
                                                } else {
                                                    console.log('...host (' + hostname + ') is down');
                                                    closeAction();
                                                }
                                            });

                                            //                            engine.destroy();

                                        });

                                    });
                                });


                                engine.on('download', function (index) {
                                    console.log((' Piece: ' + index + ' downloaded'));
                                });

                            }

                        });

                    }

                }

            });

        });

    }
});

    function closeAction() {
        openActions--;
        if( openActions < 1 ) {
            db.close();
            console.log('...shutting down');
            log4js.shutdown(function() {
                process.exit(1);
            });
        }
    }