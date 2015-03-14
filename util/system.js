var exec = require('child_process').exec;

function puts(error, stdout, stderr) {
    console.log(stdout);
}

function execute(cmd) {
    exec(cmd, puts);
}

exports.execute = execute;