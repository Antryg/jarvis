/**
 * Created by g706138 on 27.01.2015.
 */

var jsdom         = require("jsdom");
var MongoClient   = require('mongodb').MongoClient;
var log4js        = require('log4js');

log4js.configure( __dirname + '/../config/magnet_grabber.json', { reloadSecs: 300 });

console.log('starting...');

var numberRegEx = /[0-9]+$/;
var tvRegEx = /^(.*)-[0-9]+$/;
var episodeNameRegEx = /^\([0-9]+\/[0-9]+\) (.*) - [0-9]+$/;

MongoClient.connect('mongodb://127.0.0.1:27017/jarvis', function(err, db) {

    if(err) throw err;

    jsdom.env(
        "http://horriblesubs.info/lib/latest.php",
        ["http://code.jquery.com/jquery.js"],
        function (errors, window) {

            var episodesCollection = db.collection('episodes');
            var tvseriesCollection = db.collection('tvseries');
            var openActions = window.$("div.episode").length;

            window.$("div.episode").each( function(index, value) {

                var epId   = value._attributes[1]._nodeValue;
                var tvId   = epId.match(tvRegEx)[1];
                var tvName = value.firstChild.nodeValue.match(episodeNameRegEx)[1];
                var magnet = window.$("div#" + epId + " div.linkful:first-child a[href^=\"magnet\"]");

                if( magnet.length == 1 ) {

                    magnet.each(function (index, value) {
                        if (epId == 'gundam-reconguista-in-g-24') {
                            console.log('jup1');
                        }

                        var magnetUrl = value._attributes[0]._nodeValue;

                        episodesCollection.count({ id: epId }, function (err, count) {

                            if (err) throw err;

                            if (count == 0) {

                                tvseriesCollection.find({ id: tvId }).toArray(function (err, data) {

                                    if (err) throw err;
                                    var queueEpisode = false;

                                    if (data.length == 0) {

                                        console.log('...adding tvseries ' + tvId);

                                        openActions++;
                                        queueEpisode = true;

                                        tvseriesCollection.insert({
                                            id: tvId,
                                            alias: tvId,
                                            desc: tvName,
                                            watching: false,
                                            timestamp: new Date()
                                        }, function (err) {
                                            closeAction();
                                            if (err) throw err;
                                        });

                                    } else {
                                        queueEpisode = data[0].watching;
                                    }

                                    console.log('...adding episode ' + epId);

                                    episodeNumber = parseInt(epId.match(numberRegEx)[0]);

                                    episodesCollection.insert({
                                        id: epId,
                                        tvid: tvId,
                                        series: tvName,
                                        episodeNumber: episodeNumber,
                                        magnet: magnetUrl,
                                        queue: queueEpisode,
                                        timestamp: new Date(),
                                        downloaddate: null
                                    }, function (err) {
                                        closeAction();
                                        if (err) throw err;
                                    });

                                });

                            } else {
                                closeAction();
                            }

                        });

                    });

                } else {
                    console.error('Could not match: ' + epId);
                    closeAction();
                }

            } );

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

        }
    );

});