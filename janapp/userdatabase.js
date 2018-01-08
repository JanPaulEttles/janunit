'use strict';

var logger = require('./logger');
var midget = require('./midget');
var db = new midget();

var count = 0;
var lineReader = require('readline').createInterface({
	input: require('fs').createReadStream('user.database')
});

lineReader.on('line', function (line) {
  count++;
  var split = line.split('::');
  module.exports.putUser({
    username: split[0] || null,
    password: split[1] || null,
    email: split[2] || null,
    firstname: split[3] || null,
    lastname: split[4] || null
  });

});
lineReader.on('close', function (line) {
  logger.trace('inserted ' + count + ' users into the user database');
});

module.exports = {
  getUsernames: function() {
      logger.trace('fetching usernames');
      return db.keys;
  },
	putUser: function(user) {
      logger.debug('storing username : ' + user.username);
      db.put(user.username, JSON.stringify(user));
  },
  getUser: function(username) {
    logger.debug('fetching username : ' + username);

    var user = db.get(username);
    if(user === null) {
      logger.debug('username : ' + username + ' not found');
    }
    else {
      logger.debug(user);
    }
	  return JSON.parse(user);
  },
  getUserByEmail: function(email) {
    logger.debug('fetching email : ' + email);

    var keys = db.keys;

    for(var i = 0; i < keys.length; ++i){
      var user = JSON.parse(db.get(keys[i]));
      if(user.email === email) {
        logger.debug('email : ' + email + ' found');
        return user;
      }
    }
    return null;
  },
  help: function() {
		// whatever
	}
};
