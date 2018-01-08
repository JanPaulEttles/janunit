'use strict';

var logger = require('./logger');

/**
*  build a list of server stacks and return a random one
*/
var xpoweredby = [];

var count = 0;
var lineReader = require('readline').createInterface({
	input: require('fs').createReadStream('xpoweredby.txt')
});

lineReader.on('line', function (line) {
  count++;
  xpoweredby.push(line);
});
lineReader.on('close', function (line) {
  logger.trace('read ' + count + ' lines for xpoweredby.txt');
});


module.exports = {
	getRandom: function() {
		return xpoweredby[getRandomInt(0, xpoweredby.length - 1)];
	},
	help: function() {
		// whatever
	}
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}


