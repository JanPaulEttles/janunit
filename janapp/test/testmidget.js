var midget = require('../midget.js');

var db = new midget();

db.put('tom', 'dick');

if(db.get('harry') === null) {
	console.log('null');
}
else {
	console.log('not null');
}

if(db.get('tom') !== null) {
	console.log('not null');
}
else {
	console.log('null');
}

