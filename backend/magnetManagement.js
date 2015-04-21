
var MongoClient = require('mongodb').MongoClient;
var ObjectID    = require('mongodb').ObjectID;

function getEpList( req, res, next ) {
  MongoClient.connect('mongodb://127.0.0.1:27017/jarvis', function(err, db) {
      if (err) throw err;
      db.collection('episodes').find().sort({timestamp:-1}).limit(50).toArray( function (err, data) {
          db.close();
          if (err) throw err;
          res.json({ data: data, status:'ok' });
      });
  });
}

function getTvList( req, res, next ) {
    MongoClient.connect('mongodb://127.0.0.1:27017/jarvis', function(err, db) {
        if (err) throw err;
        db.collection('tvseries').find().sort({timestamp:-1}).toArray( function (err, data) {
            db.close();
            if (err) throw err;
            res.json({ data: data, status:'ok' });
        });
    });
}

function queueEp( req, res, next ) {

    MongoClient.connect('mongodb://127.0.0.1:27017/jarvis', function(err, db) {

        if (err) throw err;

        if( req.body.queue === 'true' ) {
            req.body.queue = true;
        } else {
            req.body.queue = false;
        }

        db.collection('episodes').update({ _id :  new ObjectID(req.body._id) }, { $set : { queue: req.body.queue } }, function (err, data) {
            db.close();
            if (err) throw err;
            res.json({ data: data, status:'ok' });
        });

    });
}

function watchTv( req, res, next ) {

    MongoClient.connect('mongodb://127.0.0.1:27017/jarvis', function(err, db) {

        if (err) throw err;

        if( req.body.watching === 'true' ) {
            req.body.watching = true;
        } else {
            req.body.watching = false;
        }

        db.collection('tvseries').update({ _id :  new ObjectID(req.body._id) }, { $set : { watching: req.body.watching } }, function (err, data) {
            db.close();
            if (err) throw err;
            res.json({ data: data, status:'ok' });
        });

    });
}

exports.getEpisodes = getEpList;
exports.queueEpisode = queueEp;
exports.getTvseries = getTvList;
exports.watchTvseries = watchTv;