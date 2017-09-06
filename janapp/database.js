'use strict';

var midget = require('./midget');
var db = new midget();


var fs = require('fs');
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
  console.log('read ' + count + ' users from user database');
});


module.exports = {
  getUsernames: function() {
      console.log('fetching usernames');
      return db.keys;
  },
	putUser: function(user) {
      console.log('storing username : ' + user.username);
      db.put(user.username, JSON.stringify(user));
  },
  getUser: function(username) {
    console.log('fetching username : ' + username);

    var user = db.get(username);
    if(user === null) {
      console.log('username : ' + username + ' not found');
    }
    else {
      console.log(user);
    }
	  return JSON.parse(user);
  },
	help: function() {
		// whatever
	}
};
