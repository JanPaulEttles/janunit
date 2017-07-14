/*
npm install express
npm install body-parser
npm install cookie-parser
npm install tinycache
npm install node-uuid
*/


/*
Generate a private key
openssl genrsa -des3 -out ca.key 2048

Generate the csr (Certificate Signing Request)
openssl req -new -key ca.key -out ca.csr

Generate self-signed SSL certificate 
openssl x509 -req -days 365 -in ca.csr -out ca.crt -signkey ca.key

openssl genrsa -des3 -out server.key 2048
openssl req -new -key server.key -out server.csr
cp server.key server.key.passphrase
remove the passphrase
openssl rsa -in server.key.passphrase -out server.key
openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt

Update the hosts file with the domain
echo "127.0.0.1 localhost.ssl" | sudo tee -a /etc/hosts


With the app running, fetch the cert
echo QUIT | openssl s_client -connect localhost.ssl:3000 | sed -ne '/-BEGIN CERTIFICATE-/,/-END CERTIFICATE-/p' > janunitcacert.pem
Use the cert within curl to test
curl --cacert janunitcacert.pem https://localhost.ssl:3000/index.html


fetch the zap cert
curl http://host:8080/OTHER/core/other/rootcert/?formMethod=GET > zap.pem
test with curl specifying zap as the proxy
curl --proxy localhost.ssl:8080 --cacert zap.pem https://localhost.ssl:3000/index.html


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

	res.setHeader('Content-Type', 'text/html; charset=utf-8');
	res.setHeader('X-XSS-Protection', '0'); //ERR_BLOCKED_BY_XSS_AUDITOR

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

	res.setHeader('Content-Type', 'text/html; charset=utf-8');
	res.setHeader('X-XSS-Protection', '0'); //ERR_BLOCKED_BY_XSS_AUDITOR
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

	res.setHeader('Content-Type', 'text/html; charset=utf-8');
	res.setHeader('X-XSS-Protection', '0'); //ERR_BLOCKED_BY_XSS_AUDITOR
	res.send("<div id=\"result\">You searched: " + req.body.search + "</div>");
});

/**
*
*	parse login form
*	https://localhost:3000/login.html
*
*/
app.post('/login', function(req, res) {
 
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


//	passphrase: 'changeit'
var httpsOptions = {
	key: fs.readFileSync('./server.key'),
	cert: fs.readFileSync('./server.crt'),
    ca: fs.readFileSync('./ca.crt'),
    requestCert: true,
    rejectUnauthorized: false
}

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
