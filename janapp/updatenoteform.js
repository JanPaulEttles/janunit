'use strict';

var logger = require('./logger');
var fragment = '';

var count = 0;
var lineReader = require('readline').createInterface({
	input: require('fs').createReadStream('updatenoteform.template')
});

lineReader.on('line', function (line) {
  count++;
  fragment += line;
});
lineReader.on('close', function (line) {
  logger.trace('read ' + count + ' lines for updatenoteform.template');
});

module.exports = {
	get: function(note) {

    var temp = fragment;

    var index = temp.indexOf('id="id"');
    temp = temp.substring(0, index) + ' value="' + note.id + '"' + temp.substring(index, temp.length);
    index = temp.indexOf('id="title"');
    temp = temp.substring(0, index) + ' value="' + note.title + '"' + temp.substring(index, temp.length);
    index = temp.indexOf('</textarea>');
    temp = temp.substring(0, index) + note.note + temp.substring(index, temp.length);

    return temp;
  },
	help: function() {
		// whatever
	}
};
