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
var https = require('https')
var fs = require('fs');

var randomXPoweredBy = require('./randomXPoweredBy');

var db = new tinycache();

var app = express();
app.set('port', 3000);
app.use(express.static(__dirname + '/'));

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


/**
*
*	parse login form
*	https://localhost.ssl:3000/login?username=74n&password=password
*
*/
app.get('/login', function(req, res) {
 
	var user = getUser(req.query.username);

	setHeaders(res); 
	if(user.username === req.query.username && user.password === req.query.password) { 

		refreshSession({
			username: req.query.username,
			authenticated: true
			}, req, res);

		res.send("<div id=\"result\">Welcome: "+ user.username + "</br>You are authenticated</div>");
	}
	else {
		res.send("<div id=\"result\">You are attempting to log in as: " + req.query.username + "</br>You are NOT authenticated</div>");
	}
});

/**
*
*	get request to check if the user is authenticated
*	https://localhost:3000/authenticated
*
*/
app.get('/authenticated', function(req, res) {

	if(!isAuthenticated(req)) {
		res.send("<div id=\"result\">You are NOT authenticated</div>");
	}
	else {
		res.send("<div id=\"result\">You are authenticated</div>");
	}
});

/**
*
*	get request to show the user profile associated with the session token
*	https://localhost:3000/profile
*
*/
app.get('/profile', function(req, res) {
		
	if(!isAuthenticated(req)) {
		res.redirect('https://localhost:3000/login.html');
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

/**
*
*	get request to clear cache, session, cookies and redirect to index.html
*	https://localhost:3000/reset
*	
*/
app.get('/reset', function(req, res) {

	db.clear();

	setHeaders(res);

	req.session = null;
	res.clearCookie('Session-Token', { path: '/' });

	res.redirect('https://localhost:3000/index.html');
});


/**
*
*	parse forgotten password form
*	https://localhost:3000/forgotten.html
*
*/
app.post('/forgotten', function(req, res) {

	setHeaders(res);
	res.send("<div id=\"result\">Your password will be sent to: " + req.body.email + "</div>");
});

/**
*
*	parse search form
*	https://localhost:3000/forgotten.html
*
*/
app.post('/search', function(req, res) {
	//console.log('you posted:  ' + JSON.stringify(req.body));

	setHeaders(res);
	res.send("<div id=\"result\">You searched: " + req.body.search + "</div>");
});

/**
*
*	parse login form
*	https://localhost:3000/login.html
*
*/
app.post('/login', function(req, res) {
 

	//' or 1=1--
	//fake an SQLi vulnerability
	if(req.body.username === '\' or 1=1--') {
		//res.redirect('https://localhost.ssl:3000/tbl_users.db.txt');

		var data = '';
		var readStream = fs.createReadStream('tbl_users.db.txt', 'utf8');

		setHeaders(res); 
		res.setHeader('Content-Type', 'text/plain; charset=utf-8');
		readStream.on('data', function(chunk) {  
		    data += chunk;
		}).on('end', function() {
	    	res.send(data);
		});

	}
	else {
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
	}

});

/**
*
*	parse registration form
*	https://localhost:3000/register.html
*
*/
app.post('/register', function(req, res) {

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




//app.listen(app.get('port'), function() {
//	console.log('running on... ' + app.get('port'));
//});


var httpsOptions = {
	key: fs.readFileSync('./ca/server-key.pem'),
	cert: fs.readFileSync('./ca/server-crt.pem'),
    ca: fs.readFileSync('./ca/ca-crt.pem'),
    requestCert: true,
    rejectUnauthorized: false
}

//	crl: fs.readFileSync('./ca/ca-crl.pem'),
//    rejectUnauthorized: true


var server = https.createServer(httpsOptions, app).listen(app.get('port'), () => {
  console.log('server running on port ' + app.get('port'))
})

function setHeaders(res) {
	res.setHeader('X-Powered-By', randomXPoweredBy.getRandom());
	res.setHeader('Content-Type', 'text/html; charset=utf-8');
	res.setHeader('X-XSS-Protection', '0'); //ERR_BLOCKED_BY_XSS_AUDITOR
}


/*
* Session Management
*/
function isAuthenticated(req) {
	var token = req.cookies["Session-Token"];
	if(token !== null) {
		var session = db.get(token);
		if(session !== null) {
			console.log('user ' + session.username + ' has a session: ' + session.authenticated);
			return session.authenticated;
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
* User storage, wrap around the tinycache
*/
function getUser(username) {
	return JSON.parse(db.get(username));
}

function putUser(user) {
	db.put(user.username, JSON.stringify(user));
}
