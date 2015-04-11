var exec = require('child_process').exec;

function puts(error, stdout, stderr) {
    console.log(stdout);
}

function execute(cmd, callback) {
    if( !callback ) {
        callback = puts;
    }
    exec(cmd, callback);
}

exports.execute = execute;