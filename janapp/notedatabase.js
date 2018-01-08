'use strict';

var logger = require('./logger');
var midget = require('./midget');
var notes = new midget();

//todo - refector this to an init method so we can nuke and reset all the data
var count = 0;
var lineReader = require('readline').createInterface({
	input: require('fs').createReadStream('note.database')
});

lineReader.on('line', function (line) {
  count++;
  var split = line.split('::');
  module.exports.putNote({
    title: split[0] || null,
    note: split[1] || null
  });

});
lineReader.on('close', function (line) {
  logger.debug('read ' + count + ' notes from note database');
});


var index = 0;

module.exports = {
	deleteNote: function(note) {
      logger.debug('deleting note : ' + note.title);
      notes.put(note.id, JSON.stringify(note));
  },
	updateNote: function(note) {
      logger.debug('updating note : ' + note.title);
      notes.put(note.id, JSON.stringify(note));
  },
	putNote: function(note) {
      logger.debug('storing note : ' + note.title);
      note.id = index++;
      notes.put(note.id, JSON.stringify(note));
  },
  getNote: function(id) {
    logger.debug('fetching note : ' + id);

    var note = notes.get(id);
    if(note === null) {
      logger.debug('note : ' + id + ' not found');
    }
    else {
      logger.debug(note);
    }
	  return JSON.parse(note);
  },
  getNotes: function() {
      logger.debug('fetching notes');
      return notes.keys;
  },
  help: function() {
		// whatever
	}
};
