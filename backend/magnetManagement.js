
var MongoClient = require('mongodb').MongoClient;

function getList( req, res, next ) {
  MongoClient.connect('mongodb://127.0.0.1:27017/jarvis', function(err, db) {
      if (err) throw err;
      db.collection('episodes').find().toArray( function (err, data) {
          db.close();
          if (err) throw err;
          res.json({ data: data, status:'ok' });
      });
  });
}

exports.get = getList;