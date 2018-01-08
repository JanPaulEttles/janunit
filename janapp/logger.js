'use strict';

var LevelEnum = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  FATAL: 5,
};

var LEVEL = LevelEnum.TRACE;

module.exports = {
	trace: function(message) {
    if(LEVEL <= LevelEnum.TRACE)  {
      log('\x1b[36m%s\x1b[0m', message);
    }
  },
  debug: function(message) {
    if(LEVEL <= LevelEnum.DEBUG)  {
      log('\x1b[35m%s\x1b[0m', message);
    }
  },
  info: function(message) {
    if(LEVEL <= LevelEnum.INFO)  {
      log('\x1b[34m%s\x1b[0m', message);
    }
  },
	warn: function(message) {
    if(LEVEL <= LevelEnum.WARN)  {
      log('\x1b[33m%s\x1b[0m', message);
    }
  },
	error: function(message) {
    if(LEVEL <= LevelEnum.ERROR)  {
      log('\x1b[32m%s\x1b[0m', message);
    }
  },
	fatal: function(message) {
    if(LEVEL <= LevelEnum.FATAL)  {
      log('\x1b[313m%s\x1b[0m', message);
    }
  },
	help: function() {
		// whatever
	}
};

function log(colour, message) {
  console.log(colour, timeStamp() + " " + message);
}

function timeStamp() {
  var now = new Date();

  var date = [ now.getFullYear(), now.getMonth() + 1, now.getDate() ];
  var time = [ now.getHours(), now.getMinutes(), now.getSeconds() ];

  //var suffix = ( time[0] < 12 ) ? "AM" : "PM";
  //time[0] = ( time[0] < 12 ) ? time[0] : time[0] - 12;
  //time[0] = time[0] || 12;

  // If month and days are less than 10, add a zero
  for ( var i = 1; i < 3; i++ ) {
    if ( date[i] < 10 ) {
      date[i] = "0" + date[i];
    }
  }

  // If seconds and minutes are less than 10, add a zero
  for ( var i = 1; i < 3; i++ ) {
    if ( time[i] < 10 ) {
      time[i] = "0" + time[i];
    }
  }

  return date.join("-") + " " + time.join(":") + " ";// + suffix;
}
