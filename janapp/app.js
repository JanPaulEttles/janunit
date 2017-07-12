/*
npm install express
npm install body-parser
npm install cookie-parser
npm install tinycache
npm install node-uuid
*/

var express = require('express');
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser');
var tinycache = require('tinycache');
var uuid = require('node-uuid');

var db = new tinycache();

var server = express();
server.set('port', 3000);
server.use(express.static(__dirname + '/'));

server.use(cookieParser());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));


server.get('/authenticated', function(req, res) {

	if(!isAuthenticated(req)) {
		res.send("<div id=\"result\">You are NOT authenticated</div>");
	}
	else {
		res.send("<div id=\"result\">You are authenticated</div>");
	}
});

server.get('/profile', function(req, res) {
		
	if(!isAuthenticated(req)) {
		console.log('Session has expired');
		res.redirect('http://localhost:3000/login.html');
	}

	var user = getUserFromToken(req);

	if(user !== null) { 

		refreshSession({
			username: user.username,
			authenticated: true
			}, req, res);

		setHeaders(res); 

		var result = "<div id=\"result\">";
		result += "<br/>username : " + user.username;
		result += "<br/>email : " + user.email;
		result += "<br/>firstname : " + user.firstname;
		result += "<br/>lastname : " + user.lastname;
		result += "</div>";

		res.send(result);
	}
	else {
		res.send("<div id=\"result\">User not found</div>");
	}
});

server.get('/reset', function(req, res) {

	db.clear();

	res.setHeader('Content-Type', 'text/html; charset=utf-8');
	res.setHeader('X-XSS-Protection', '0'); //ERR_BLOCKED_BY_XSS_AUDITOR

	req.session = null;
	res.clearCookie('Session-Token', { path: '/' });

	res.redirect('http://localhost:3000/index.html');
});



server.post('/forgotten', function(req, res) {

	res.setHeader('Content-Type', 'text/html; charset=utf-8');
	res.setHeader('X-XSS-Protection', '0'); //ERR_BLOCKED_BY_XSS_AUDITOR
	res.send("<div id=\"result\">Your password will be sent to: " + req.body.email + "</div>");
});

server.post('/search', function(req, res) {
	//console.log('you posted:  ' + JSON.stringify(req.body));

	res.setHeader('Content-Type', 'text/html; charset=utf-8');
	res.setHeader('X-XSS-Protection', '0'); //ERR_BLOCKED_BY_XSS_AUDITOR
	res.send("<div id=\"result\">You searched: " + req.body.search + "</div>");
});

server.post('/login', function(req, res) {
 
	var user = getUser(req.body.username);

	if(user.username === req.body.username && user.password === req.body.password) { 

		refreshSession({
			username: req.body.username,
			authenticated: true
			}, req, res);

		setHeaders(res); 
		res.send("<div id=\"result\">Welcome: "+ user.username + "</div>");
	}
	else {
		res.send("<div id=\"result\">You are NOT authenticated</div>");
	}


});

server.post('/register', function(req, res) {

	putUser({
        	username: req.body.username || null,
        	password: req.body.password || null,
        	email: req.body.email || null,
        	firstname: req.body.firstname || null,
        	lastname: req.body.lastname || null
        });

	refreshSession({
		username: req.body.username,
		authenticated: false
		}, req, res);

	setHeaders(res); 
	res.send("<div id=\"result\">Welcome: "+ req.body.username + "</div>");
});


server.listen(server.get('port'), function() {
	console.log('running on... ' + server.get('port'));
});






function setHeaders(res) {
	res.setHeader('Content-Type', 'text/html; charset=utf-8');
	res.setHeader('X-XSS-Protection', '0'); //ERR_BLOCKED_BY_XSS_AUDITOR
}


/*
* Session Management
*/
function isAuthenticated(req) {
	if(req.cookies["Session-Token"] !== null) {
		if(db.get(req.cookies["Session-Token"]) !== null) {
			console.log('user ' + db.get(req.cookies["Session-Token"]).username + ' has a session: ' + db.get(req.cookies["Session-Token"]).authenticated);
			return db.get(req.cookies["Session-Token"]).authenticated;
		}
	}
	return false;
}


function refreshSession(session, req, res) {

	//remove previous token from cache if present
	if(req.cookies["Session-Token"] !== null) {
		db.del(req.cookies["Session-Token"]);
	}

	var token = uuid.v4();
	db.put(token, session, 1800000);		
	res.cookie('Session-Token', token, { maxAge: 1800000, httpOnly: true });

	console.log("refreshed session: " + token + ' for ' + session.username + ' ' + session.authenticated);
}

function getSessionToken(req) {
	return req.cookies["Session-Token"];
}

function getSession(token) {
	return db.get(token);
}


function getUserFromToken(req) {
	return getUser(db.get(req.cookies["Session-Token"]).username);
}


/*
* User storage
*/
function getUser(username) {
	return JSON.parse(db.get(username));
}

function putUser(user) {
	db.put(user.username, JSON.stringify(user));
}



/*
	//console.log('you posted:  ' + JSON.stringify(req.body));

	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify({
        	username: req.body.username || null,
        	email: req.body.email || null
        }));
*/
