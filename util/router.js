var express     = require('express');
var bodyParser  = require("body-parser");
//var favicon    = require('serve-favicon');
//var serveIndex = require('serve-index');

var app        = express();

//app.use(favicon('public/jarvis.ico'));
//app.use(serveIndex('public', {'icons': true}))

//app.set('views', __dirname + '/views');
//app.set('view engine', 'jade');
//app.use(express.logger('dev'));
//app.use(express.bodyParser());
//app.use(express.methodOverride());
//app.use(express.cookieParser('CrusoeNode'));
app.use(express.static(__dirname + '/../public'));
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(express.errorHandler());


var powerManagement = require("./../backend/powerManagement.js");
var magnetManagement = require("./../backend/magnetManagement.js");

function start(route) {

    //app.use(express.static(__dirname + "/public"));
    //
    //app.route('/').all( function( req, res, next ) {
    //    res.render('public/index');
    //})

    app.route('/powerManagement').all( powerManagement.switch );
    app.route('/magnetManagement/episodes').get(  magnetManagement.getEpisodes  );
    app.route('/magnetManagement/episodes/queue').post( magnetManagement.queueEpisode );

    app.listen(8080);
    console.log("Server has started.");

}

exports.start = start;
