
var system = require("../util/system.js");

function powerSwitch( req, res, next ) {

    var houseCode  = req.query.houseCode;  // 10010
    var outletCode = req.query.outletCode; // 4
    var command    = req.query.command;    // 1

    if( houseCode && outletCode && command ) {
        system.execute("sudo /opt/raspberry-remote/send " + houseCode + " " + outletCode + " " + command);
        res.json({ status: 'ok' })
    } else {
        res.json({ status: 'error' })
    }

}

exports.switch = powerSwitch;