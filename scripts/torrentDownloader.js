/**
 * Created by g706138 on 27.01.2015.
 */

//    var engine = torrentStream(magnets[0]);
//
//    engine.on('ready', function() {
//        engine.files.forEach(function(file) {
//            console.log( ('Starting: ' + file.name).underline );
//            var stream = file.createReadStream();
//            stream.on('data', function() {});
//            stream.on('end', function() {
//              console.log(('Finished: ' + file.name).green.bold);
//              engine.destroy();
//            });
//        });
//    });
//
//
//    engine.on('download', function(index) {
//      console.log((' Piece: ' + index + ' downloaded').grey);
//    });