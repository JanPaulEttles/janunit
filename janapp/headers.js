'use strict';

var randomXPoweredBy = require('./randomXPoweredBy');

module.exports = {
	set: function(res) {
	  res.setHeader('X-Powered-By', randomXPoweredBy.getRandom());
	  res.setHeader('Content-Type', 'text/html; charset=utf-8');
	  res.setHeader('X-XSS-Protection', '0'); //ERR_BLOCKED_BY_XSS_AUDITOR
  },
	help: function() {
		// whatever
	}
};