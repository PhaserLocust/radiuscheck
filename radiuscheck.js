/*jslint node: true, vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */

var fs = require('fs');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

var radiusStopped = false;

var transporter = nodemailer.createTransport(smtpTransport({
    host: '172.16.1.38',
    port: 25,
    secure: false,
    ignoreTLS: true
}));

// verify connection configuration 
transporter.verify(function (error, success) {
    'use strict';
    if (error) {
        console.log(error);
    } else {
        console.log('Server is ready to take our messages');
    }
});

// setup email data
var stopped = {
    from: '"radiuscheck.js" <noreply@radiuscheck.com>', // sender address
    to: 'rscheunemann@clddigital.com', // list of receivers
    subject: 'Printflow updates have stopped', // Subject line
    html: '<b>Danger! </b>Printflow has not updated in the last 20 minutes.<br /><img src="http://digital/images/danger.jpg"/>'
};

var restored = {
    from: '"radiuscheck.js" <noreply@radiuscheck.com>', // sender address
    to: 'rscheunemann@clddigital.com', // list of receivers
    subject: "Printflow updates back online", // Subject line
    html: '<b>it\'s ba-ack...</b>Printflow updates have started again.<br /><img src="http://digital/images/ba-ack.jpg"/>'
};

var fileError = {
    from: '"radiuscheck.js" <noreply@radiuscheck.com>', // sender address
    to: 'rscheunemann@clddigital.com', // list of receivers
    subject: "Printflow Volume Unavailable", // Subject line
    html: '<b>Taken </b>Either the DBServer has lost the connection, or the server radapp12-ocon is offline.<br /><img src="http://digital/images/ba-ack.jpg"/>'
};

//var targetDir = "/Volumes/Jobs/111000-Test Customer92-mm template test";
var targetDir = "/Volumes/apps/PrintFlow/DigitalPF2Rad/Archived Files";

function chkDir() {
    'use strict';
    // get current time, minus 20 min (folder should update every 10 minutes, but it is not exact.)
    var now = new Date().getTime() - 1.2e+6;
    
    //get modified date of folder
    fs.stat(targetDir, function (err, stats) {
        if (err) {
            console.log(Date());
            transporter.sendMail(fileError, function (error, info) {
                if (error) {
                    return console.log(error);
                }
            });
            radiusStopped = true;
            return console.log(err);
        }
        var cTime = stats.ctime;
        if (cTime.getTime() < now) {
            //dir was not changed in last 20 min
            if (!radiusStopped) {
                radiusStopped = true;
                transporter.sendMail(stopped, function (error, info) {
                    if (error) {
                        return console.log(error);
                    }
                    console.log(cTime + ' - Message %s sent: %s', info.messageId, info.response);
                });
            }
        } else if (radiusStopped) {
            //dir was changed in last 20 min after being stopped
            console.log(cTime + ' - printflow started after stop');
            radiusStopped = false;
            transporter.sendMail(restored, function (error, info) {
                if (error) {
                    return console.log(error);
                }
                console.log('Message %s sent: %s', info.messageId, info.response);
            });
        }
    });
}

setInterval(chkDir, 1.2e+6); // check directory (1.2e+6 = 20min)