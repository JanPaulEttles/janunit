var tinycache = require('tinycache');

var db = new tinycache();

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
