var randomXPoweredBy = require('./randomXPoweredBy');

var frequency = [];
for(var i = 0; i < 50; i++) {

	var rxpb = randomXPoweredBy.getRandom();

	if(frequency[rxpb] !== undefined) {
		frequency[rxpb]++;
	} 
	else {
		frequency[rxpb] = 1;
	}
}

var total = 0;
for(var key in frequency) {
	total += frequency[key];
}

console.log(frequency);
console.log('total : ' + total);
