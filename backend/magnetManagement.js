
var MongoClient = require('mongodb').MongoClient;
var ObjectID    = require('mongodb').ObjectID;

function getEpList( req, res, next ) {
  MongoClient.connect('mongodb://127.0.0.1:27017/jarvis', function(err, db) {
      if (err) throw err;
      db.collection('episodes').find().sort({timestamp:-1}).limit(20).toArray( function (err, data) {
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

exports.getEpisodes = getEpList;
exports.queueEpisode = queueEp;