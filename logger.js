const fs = require('fs');
const path = require('path');
const cwd = process.cwd();
const logFolder = path.join(cwd, 'log');
if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder, { recursive: true });
}
let infoMsgs = [];

//-----------------------------------------------------------------------------
var logMsg = function(msg) {
	//var timeNow = new Date();
	//var timestr = timeNow.toLocaleString();
    const timestr = formatDateTime();
	var msg = timestr + ' ' + msg;	
	console.log(msg);
	var msgline = msg + "\r\n";
	infoMsgs.push(msgline);
}

//-----------------------------------------------------------------------------
var checkAndLogMsg = function() {
    var timeNow = new Date();
    var timestr = timeNow.toLocaleDateString('en-CA');
    var datestr = timestr.substring(0, 10);
    var logfile = path.join(logFolder, 'log-' + datestr + '.txt');
    while (infoMsgs.length > 0){
        var msg = infoMsgs.shift();	
        fs.appendFileSync(logfile, msg);
    }
}

//-----------------------------------------------------------------------------
var formatDateTime = function(date = new Date()) {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  const zzz = String(date.getMilliseconds()).padStart(3, '0');

  return `${mm}/${dd}/${yyyy} ${hh}:${min}:${ss}.${zzz}`;
}

const logIntervalId = setInterval(checkAndLogMsg, 30000);

module.exports = logMsg;