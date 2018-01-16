
var logger = require('./logger');
var sessiondatabase = require('./sessiondatabase');

var SESSION_TOKEN = 'Session-Token';
var SESSION_TIMEOUT = 1800000;

module.exports = {
	isAuthenticated: function(req) {
  	var token = req.cookies[SESSION_TOKEN];
	  if(token !== null) {
  		var session = sessiondatabase.getSession(token);
	  	if(session !== null) {
		  	logger.info('user ' + session.username + ' has a session: ' + session.authenticated);
		  	return session.authenticated;
		  }
	  }
	  return false;
  },
  getSessionFromRequest: function(req) {

    var session = { username: undefined, authenticated: false };

    if(req.cookies[SESSION_TOKEN] !== null) {
        if(module.exports.getSession(req.cookies[SESSION_TOKEN]) !== null) {
        session = module.exports.getSession(req.cookies[SESSION_TOKEN]);
      }
    }
	  return session;
  },
	getSession: function(token) {
    logger.trace('fetching session : ' + token);
    return sessiondatabase.getSession(token);
  },
  putSession: function(token, session, timeout) {
    logger.info('storing session : ' + token);
    sessiondatabase.putSession(token, session, timeout);
  },
  getSessionTokens: function() {
      logger.trace('fetching tokens');
      return sessiondatabase.getSessionTokens();
  },
  login: function(username, password, user, req, res) {
    logger.info('login session');
    var session = { username: username, authenticated: false	};

    //this is prone to a timing attack
    if(user.username === username && user.password === password) {
      session.authenticated = true;
    }
	  module.exports.refresh(session, req, res);
  },
  logout: function(req, res) {
      logger.trace('logout session');
      var token = req.cookies[SESSION_TOKEN];
      var username = sessiondatabase.getSession(req.cookies[SESSION_TOKEN]).username;

      var session = { username: username, authenticated: false	};

      sessiondatabase.putSession(token, session, SESSION_TIMEOUT);
  },
  createToken: function() {
      logger.trace('creating token');
      return sessiondatabase.createToken();
  },
  clear: function(req, res) {
    req.session = null;
    res.clearCookie('Session-Token', { path: '/' });


	},
  refresh: function(session, req, res) {

    var token = req.cookies[SESSION_TOKEN];

	  if(req.cookies[SESSION_TOKEN] === undefined) {
      token = module.exports.createToken();
      logger.trace("CREATING token: " + token);
    }

    sessiondatabase.putSession(token, session, SESSION_TIMEOUT);
    //res.cookie(SESSION_TOKEN, token, { maxAge: SESSION_TIMEOUT, httpOnly: true, secure: true });
    res.cookie(SESSION_TOKEN, token, { maxAge: SESSION_TIMEOUT });
    logger.trace("refreshed session: " + token + ' for ' + session.username + ' : isAuthenticated: ' + session.authenticated);
  },
  help: function() {
		// whatever
	}
};


