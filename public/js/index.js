$(document).foundation();
var houseCode = 10010;
var alertSequence = 1;

function sendCommand( outlet, command ) {

    $.ajax({
        url  : "/powerManagement",
        data : {
            houseCode   : houseCode,
            outletCode  : outlet,
            command     : command
        }
    }).done(function(rspData) {
        if( rspData.status === 'ok' ) {
            showAlert('#errorBox', 'success', 'Action successful');
        } else {
            showAlert('#errorBox', 'alert', 'Something went wrong');
        }
    }).fail(function(rspData) {
        showAlert('#errorBox', 'alert', 'Something went wrong');
    });

}

function showAlert( contentArea, type, text ) {
    var alertBox = '<div id="alert-' + alertSequence + '" data-alert class="alert-box ' + type + ' round" style="display: none;"> ' + text + '  <a href="#" class="close">&times;</a></div>';
    $( contentArea ).append(alertBox).foundation();
    $( '#alert-' + alertSequence).fadeIn().delay(2000).fadeOut();
    alertSequence++;
}
