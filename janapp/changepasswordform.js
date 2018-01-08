'use strict';

var logger = require('./logger');

var fragment = '';

var count = 0;
var lineReader = require('readline').createInterface({
	input: require('fs').createReadStream('changepasswordform.template')
});

lineReader.on('line', function (line) {
  count++;
  fragment += line;
});
lineReader.on('close', function (line) {
  logger.trace('read ' + count + ' lines for changepasswordform.template');
});

module.exports = {
	get: function(title) {
    return fragment;
  },
	help: function() {
		// whatever
	}
};
