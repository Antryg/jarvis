/**
 * Created by g706138 on 27.01.2015.
 */

var torrentStream = require('torrent-stream');
var MongoClient   = require('mongodb').MongoClient;
var log4js        = require('log4js');

log4js.configure( __dirname + '/../config/torrent_downloader.json', { reloadSecs: 300 });

console.log('starting...');

MongoClient.connect('mongodb://127.0.0.1:27017/jarvis', function(err, db) {

    if (err) throw err;

    var episodesCollection = db.collection('episodes');

    episodesCollection.find({ queued : true }).toArray( function( err, data ) {

        var openActions = data.length;

        if( openActions > 0 ) {
            
            for( var episode in data ) {

                var engine = torrentStream(episode.magnet);

                engine.on('ready', function() {
                    engine.files.forEach(function(file) {
                        console.log( '...streaming: ' + file.name );
                        var stream = file.createReadStream();
                        stream.on('data', function() {});
                        stream.on('end', function() {
                            console.log( '...finished: ' + file.name);
                            closeAction();
                            engine.destroy();
                        });
                    });
                });


//                engine.on('download', function(index) {
//                  console.log((' Piece: ' + index + ' downloaded').grey);
//                });

            }

        }

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

    });

});