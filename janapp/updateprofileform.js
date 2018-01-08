'use strict';

var logger = require('./logger');
var fragment = '';

var count = 0;
var lineReader = require('readline').createInterface({
	input: require('fs').createReadStream('updateprofileform.template')
});

lineReader.on('line', function (line) {
  count++;
  fragment += line;
});
lineReader.on('close', function (line) {
  logger.trace('read ' + count + ' lines for updateprofileform.template');
});

module.exports = {
	get: function(user) {
    var temp = fragment;

    var index = temp.indexOf('id="username"');
    temp = temp.substring(0, index) + ' value="' + user.username + '"' + temp.substring(index, temp.length);
    index = temp.indexOf('id="password"');
    temp = temp.substring(0, index) + ' value="' + user.password + '"' + temp.substring(index, temp.length);
    index = temp.indexOf('id="email"');
    temp = temp.substring(0, index) + ' value="' + user.email + '"' + temp.substring(index, temp.length);
    index = temp.indexOf('id="firstname"');
    temp = temp.substring(0, index) + ' value="' + user.firstname + '"' + temp.substring(index, temp.length);
    index = temp.indexOf('id="lastname"');
    temp = temp.substring(0, index) + ' value="' + user.lastname + '"' + temp.substring(index, temp.length);

    return temp;
  },
	help: function() {
		// whatever
	}
};
