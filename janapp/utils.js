'use strict';

var logger = require('./logger');

var sqli = [];

var count = 0;
var lineReader = require('readline').createInterface({
	input: require('fs').createReadStream('sqli.txt')
});

lineReader.on('line', function (line) {
  count++;
  sqli.push(line.replace(/[ \t\r]+/g, '').toLowerCase());
});
lineReader.on('close', function (line) {
  logger.trace('read ' + count + ' lines for sqli.txt');
});


module.exports = {
	checkSQLi: function(parameter) {

    var vulnerable = false;
    var clean = parameter.replace(/[ \t\r]+/g, '').toLowerCase();

    for(var i = 0; i < sqli.length; ++i) {
      if(clean.indexOf(sqli[i]) !== -1) {
        vulnerable = true;
        break;
      }
    }

		return vulnerable;
	},
	filterXSS: function(obj) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        logger.debug(key + " -> " + obj[key]);
        obj[key] = obj[key].replace('>','&gt;').replace('<','&lt;').replace('\\','\\\\');
        logger.debug(key + " -> " + obj[key]);
      }
    }
    return obj;
  },
	help: function() {
		// whatever
	}
};

