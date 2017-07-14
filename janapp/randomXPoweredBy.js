'use strict';

/**
*  build a list of server stacks and return a random one
*/
var xpoweredby = ["PHP/5.4.0", "Express", "PHP/5.1.3", "Microsoft-IIS/8.0", "Greyskull", "randomserver", "jboss", "apache"];

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


