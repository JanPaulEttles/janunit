'use strict';

var uuid = require('node-uuid');

var logger = require('./logger');
var midget = require('./midget');
var db = new midget();

var index = 0;

module.exports = {
	getSession: function(token) {
    logger.trace('fetching session : ' + token);

    var session = db.get(token);
    if(session === null) {
      logger.debug('session : ' + token + ' not found');
    }
    else {
      logger.debug('session :' + token + ' for username : ' + session.username);
    }
	  //return JSON.parse(session);
    return session;
  },
  putSession: function(token, session, timeout) {
    logger.info('storing session : ' + token);
    db.put(token, session, timeout);
  },
  getSessionTokens: function() {
      logger.trace('fetching tokens');
      return db.keys;
  },
  createToken: function() {
      logger.trace('creating token');
      var token = uuid.v4();
      //var token = 'asd897asd675asd765asd765sad543';
      return token;
  },
  help: function() {
		// whatever
	}
};


/*
key: token
obj: session

session: username, isauthenticated
*/
