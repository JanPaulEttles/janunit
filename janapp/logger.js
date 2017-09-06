'use strict';

module.exports = {
	log: function(message) {
    console.log(timeStamp() + " " + message);
  },
	help: function() {
		// whatever
	}
};


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

// Return the formatted string
  return date.join("-") + " " + time.join(":") + " ";// + suffix;
}