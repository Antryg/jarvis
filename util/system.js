var util = require('util');
var exec = require('child_process').exec;

function puts(error, stdout, stderr) {
    util.puts(stdout);
}

function execute(cmd) {
    exec(cmd, puts);
}

exports.execute = execute;