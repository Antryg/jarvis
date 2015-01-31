/**
 * Created by g706138 on 27.01.2015.
 */

var jsdom         = require("jsdom");
var torrentStream = require('torrent-stream');
var colors        = require('colors');
var MongoClient   = require('mongodb').MongoClient;
var format        = require('util').format;
var Q             = require('q');

var numberRegEx = /[0-9]+$/;
var episodeNameRegEx = /^\([0-9]+\/[0-9]+\) (.*) - [0-9]+$/;

MongoClient.connect('mongodb://127.0.0.1:27017/jarvis', function(err, db) {

    if(err) throw err;

    jsdom.env(
        "http://horriblesubs.info/lib/latest.php",
        ["http://code.jquery.com/jquery.js"],
        function (errors, window) {

            var episodesCollection = db.collection('episodes');
//            var tvseriesCollection = db.collection('tvseries');
            var openEpisodes = window.$("div.episode").length;

            window.$("div.episode").each( function(index, value) {

                var epId   = value._attributes[1]._nodeValue;
                var tvName = value.firstChild.nodeValue.match(episodeNameRegEx)[1];

                window.$("div#" + epId + " div.linkful:first-child a[href^=\"magnet\"]").each( function(index, value) {

                    var magnetUrl = value._attributes[0]._nodeValue;

                    episodesCollection.count({ id : epId }, function( err, count ) {

//                        tvseriesCollection.find({ id : epId }, function( err, count ) {

                        if(err) throw err;

                        if( count == 0 ) {

                            episodeNumber = parseInt(epId.match(numberRegEx)[0]);

                            episodesCollection.insert( {
                                id            : epId,
                                series        : tvName,
                                episodeNumber : episodeNumber,
                                magnet        : magnetUrl,
                                timestamp     : new Date()
                            }, function(err) {
                                closeEpisode();
                                if(err) throw err;
                            } );

                        } else {
                            closeEpisode();
                        }

                    });

                });
            } );
            function closeEpisode() {
                openEpisodes--;
                if( openEpisodes < 1 ) {
                    db.close();
                }
            }

        }
    );

});