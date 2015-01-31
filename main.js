var log4js = require('log4js');
var router = require("./util/router.js");

log4js.configure( __dirname + '/config/log4js.json', { reloadSecs: 300 });

try {
    router.start();
} catch( err ) {
    console.error(err);
    console.info('Shutting down...');
    log4js.shutdown(function() {
        process.exit(1);
    });
}