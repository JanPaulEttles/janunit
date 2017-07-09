var express = require('express');
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser');

var server = express();
server.set('port', 3000);
server.use(express.static(__dirname + '/'));

server.use(cookieParser());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

server.get('/reset', function(req, res) {
	//console.log('you posted:  ' + JSON.stringify(req.body));
	//console.log('Cookies: ', req.cookies);

	res.setHeader('Content-Type', 'text/html; charset=utf-8');
	res.setHeader('X-XSS-Protection', '0'); //ERR_BLOCKED_BY_XSS_AUDITOR

        req.session = null;
        res.clearCookie('Session-Token', { path: '/' });

        res.redirect('http://localhost:3000/index.html');
});

server.get('/authenticated', function(req, res) {
	//console.log('you posted:  ' + JSON.stringify(req.body));
	//console.log('Cookies: ', req.cookies);

	res.setHeader('Content-Type', 'text/html; charset=utf-8');
	res.setHeader('X-XSS-Protection', '0'); //ERR_BLOCKED_BY_XSS_AUDITOR

	if(req.cookies["Session-Token"]) {
		res.send("<div id=\"result\">You are authenticated</div>");
	}
	else {
		res.send("<div id=\"result\">You are NOT authenticated</div>");
	}
});

server.post('/forgotten', function(req, res) {
	//console.log('you posted:  ' + JSON.stringify(req.body));
	//console.log('Cookies: ', req.cookies);

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

	//console.log('you posted:  ' + JSON.stringify(req.body));

	res.cookie('Session-Token',123456789, { maxAge: 900000, httpOnly: true });
	res.setHeader('Content-Type', 'text/html; charset=utf-8');
	res.setHeader('X-XSS-Protection', '0'); //ERR_BLOCKED_BY_XSS_AUDITOR
	res.send("<div id=\"result\">Welcome: "+ req.body.username + "</div>");
});


server.listen(server.get('port'), function() {
	console.log('running on... ' + server.get('port'));
});








/*
	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify({
        	username: req.body.username || null,
        	email: req.body.email || null
        }));
*/
