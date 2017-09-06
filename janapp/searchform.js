'use strict';

var fs = require('fs');

var fragment = '';

var count = 0;
var lineReader = require('readline').createInterface({
	input: require('fs').createReadStream('searchform.template')
});

lineReader.on('line', function (line) {
  count++;
  fragment += line;
});
lineReader.on('close', function (line) {
  console.log('read ' + count + ' lines for searchform.template');
});

module.exports = {
	get: function(title) {
    return fragment;
  },
	help: function() {
		// whatever
	}
};
