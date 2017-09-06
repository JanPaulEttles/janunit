/*
npm install express
npm install body-parser
npm install cookie-parser
npm install node-uuid

get the cert
http://host:8080/OTHER/core/other/rootcert/?formMethod=GET


enable http session tracking
http://localhost:8080/JSON/core/action/setOptionHttpStateEnabled/?zapapiformat=JSON&formMethod=GET&Boolean=true

get all the urls picked up during the period when functional tests ran
http://localhost:8080/JSON/core/view/urls/?zapapiformat=JSON&formMethod=GET


curl "http://localhost:8080/JSON/ascan/action/scan/?zapapiformat=JSON&url=https://localhost.ssl:3000&recurse=True&inScopeOnly=True"

curl "http://localhost:8080/JSON/ascan/action/scan/?zapapiformat=JSON&url=https://localhost.ssl:3000&recurse=True&inScopeOnly=True"
curl "http://localhost:8080/JSON/ascan/view/status/?zapapiformat=JSON&formMethod=GET&scanId=0"
curl "http://localhost:8080/OTHER/core/other/htmlreport/?formMethod=GET"
curl "http://localhost:8080/JSON/ascan/action/scan/?zapapiformat=JSON&url=https://localhost.ssl:3000&recurse=True"


*/

var express = require('express');
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser');
var uuid = require('node-uuid');

var https = require('https')
var fs = require('fs');

var logger = require('./logger');
var midget = require('./midget');
var headers = require('./headers');

var head = require('./head');
var foot = require('./foot');

var profileform = require('./profileform');
var searchform = require('./searchform');
var registerform = require('./registerform');
var loginform = require('./loginform');
var forgottenform = require('./forgottenform');

var db = new midget();

var database = require('./database');


var app = express();
app.set('port', 3000);
//app.use(express.static(__dirname + '/'));

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


/**
*	https://localhost.ssl:3000/
*/
app.get('/', function(req, res) {

  logger.log("home page");

  var session = getSessionFromRequest(req);
	refreshSession(session, req, res);

  headers.set(res);

  var response = head.get('Home');
  response += getUserFragment(session, req, res);
  response += '<br><br><div>YAVA :: Yet Another Vulnerable App</div>';
  response += foot.get();

  res.send(response);
});

/*
* shared by both get and post login
*/
function processLogin(username, password, req, res) {

  var user = database.getUser(username);

  headers.set(res);

  var response = head.get('Log In Reponse');
  var session = { username: username, authenticated: false	};

  //this is prone to a timing attack
  if(user.username === username && user.password === password) {
    session.authenticated = true;
  }
	refreshSession(session, req, res);

  response += getUserFragment(session, req, res);
  response += foot.get();

  res.send(response);
}

/**
*	https://localhost.ssl:3000/logout
*/
app.get('/logout', function(req, res) {
  logger.log('***** get logout');

  headers.set(res);

  var response = head.get('Log Out Reponse');
  var session = { username: getUsernameFromToken(req), authenticated: false	};

	refreshSession(session, req, res);

  response += getUserFragment(session, req, res);
  response += foot.get();

  res.send(response);
});



/**
*	https://localhost.ssl:3000/login?username=74n&password=password
*/
app.get('/login', function(req, res) {
  logger.log('***** get login');
	processLogin(req.query.username, req.query.password, req, res);
});

/**
*	https://localhost:3000/login.html
*/
app.post('/login', function(req, res) {
  logger.log('***** post login');
  //logger.log('XXXXXX' + req.body.username);
  //' or 1=1--
	//fake an SQLi vulnerability
	if(req.body.username === '\' or 1=1--') {
		//res.redirect('https://localhost.ssl:3000/tbl_users.db.txt');

		var data = '';
		var readStream = fs.createReadStream('tbl_users.db.txt', 'utf8');

		headers.set(res);
		res.setHeader('Content-Type', 'text/plain; charset=utf-8');
		readStream.on('data', function(chunk) {
		    data += chunk;
		}).on('end', function() {
	    	res.send(data);
		});

	}
	else {
    //logger.log('XXXXX' + req.body.username + 'XXXXX');
		processLogin(req.body.username, req.body.password, req, res);
	}

});



/**
*	get request to list all users
*	https://localhost:3000/authenticated
*/
app.get('/users', function(req, res) {

  logger.log('***** get users');

  headers.set(res);

  var response = head.get('Users Reponse');
  var session = getSessionFromRequest(req);

  refreshSession(session, req, res);
  response += getUserFragment(session, req, res);

  var keys = database.getUsernames();
  console.log('#users ' + keys.length);
  response += '<br>';
  for(var i = 0; i < keys.length; ++i){
        response += database.getUser(keys[i]).username;
	      response += '<br>';
  }

  response += foot.get();

  res.send(response);
});

/**
*	get request to check if the user is authenticated
*	https://localhost:3000/authenticated
*/
app.get('/authenticated', function(req, res) {

  logger.log('***** get authenticated');

  headers.set(res);

  var response = head.get('Authenticated Reponse');
  var session = getSessionFromRequest(req);

  refreshSession(session, req, res);
  response += getUserFragment(session, req, res);

  if(session.authenticated) {
		response += '<br><br><div id="result">You are authenticated</div>';
	}
	else {
    response += '<br><br><div id="result">You are NOT authenticated</div>';
	}

  response += foot.get();

  res.send(response);
});

/**
*
*	get request to show the user profile associated with the session token
*	https://localhost:3000/profile
*
*/
app.get('/viewprofile', function(req, res) {

  logger.log('***** get viewprofile ' + !isAuthenticated(req));

	if(!isAuthenticated(req)) {
     console.log('viewprofile: redirecting');
		res.redirect('https://localhost.ssl:3000/');
	}
  else {

  headers.set(res);

  var response = head.get('Profile Reponse');
  var session = getSessionFromRequest(req);

	refreshSession(session, req, res);

  response += getUserFragment(session, req, res);

  var user = database.getUser(session.username);

	if(user !== null) {

    response += '<div id="profile">';
	  response += '<br/>username : ' + user.username;
  	response += '<br/>email : ' + user.email;
	  response += '<br/>firstname : ' + user.firstname;
  	response += '<br/>lastname : ' + user.lastname;
  	response += '</div>';
	}
	else {
		res.send("<div id=\"result\">User not found</div>");
	}

  response += foot.get();

  res.send(response);
  }
});

/**
*
*	get request to clear cache, session, cookies and redirect to index.html
*	https://localhost:3000/reset
*
*/
app.get('/reset', function(req, res) {

  logger.log('***** get reset');

	headers.set(res);

	db.clear();

	req.session = null;
	res.clearCookie('Session-Token', { path: '/' });

	res.redirect('https://localhost.ssl:3000/');
});


/**
*
*	parse forgotten password form
*	https://localhost:3000/forgotten.html
*
*/
app.post('/forgotten', function(req, res) {

  logger.log('***** post forgotten');

  var session = getSessionFromRequest(req);
	refreshSession(session, req, res);

  headers.set(res);

  var response = head.get('Forgotten Reponse');
  response += getUserFragment(session, req, res);
  response += '<br><br><div id="result">Your password will be sent to: ' + req.body.email + '</div>';
  response += foot.get();

  res.send(response);
});

/**
*	parse search form
*	https://localhost:3000/searchform
*/
app.post('/search', function(req, res) {
  logger.log('***** post search');

  var session = getSessionFromRequest(req);
	refreshSession(session, req, res);

  headers.set(res);

  var response = head.get('Search Reponse');
  response += getUserFragment(session, req, res);
  response += '<br><br><div id="result">You searched for: ' + req.body.search + '</div>';
  response += foot.get();

  res.send(response);
});

/**
*
*	parse registration form
*	https://localhost:3000/register.html
*
*/
app.post('/register', function(req, res) {

  logger.log('***** post register');

	database.putUser({
        	username: req.body.username || null,
        	password: req.body.password || null,
        	email: req.body.email || null,
        	firstname: req.body.firstname || null,
        	lastname: req.body.lastname || null
        });

  var session = getSessionFromRequest(req);
	refreshSession(session, req, res);

  headers.set(res);

  var response = head.get('Register Reponse');
  response += getUserFragment(session, req, res);
	response += '<br><br><div id="result">User: ' + req.body.username + ' has been registered.  Please login to continue.</div>';
  response += foot.get();

  res.send(response);
});


/**
*
*	display profile
*	https://localhost:3000/profile
*
*/
app.post('/profile', function(req, res) {

  logger.log('***** post profile');

	database.putUser({
        	email: req.body.email || null,
        	firstname: req.body.firstname || null,
        	lastname: req.body.lastname || null
        });

  var session = getSessionFromRequest(req);
	refreshSession(session, req, res);

  headers.set(res);

  var response = head.get('Profile Reponse');
  response += getUserFragment(session, req, res);
	response += '<br><br><div id="result">User: ' + req.body.username + ' has been registed.  Please login to continue.</div>';
  response += foot.get();

  res.send(response);
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
  logger.log('server running on port ' + app.get('port'))
})

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





function getUserFragment(session, req, res) {

  var header = '<div>';

  if(session.authenticated) {
    header += '<span id="loggedinstate">Logged In As: ' + session.username + '</span> || ';
    header += '<span><a href="viewprofile">Profile</a></span> || ';
    header += '<span><a href="logout">Logout</a></span>';
  }
  else {
    header += '<span id="loggedinstate">Logged In As: Not Logged In</span> || ';
    header += '<span><a href="loginform">Login</a></span> || ';
    header += '<span><a href="registerform">Register</a></span> || ';
    header += '<span><a href="forgottenform">Forgotten</a></span>';
  }
  header += '</div>';
	logger.log("adding user fragment: " + session.username);

  return header;
}





function refreshSession(session, req, res) {

	//remove previous token from cache if present
	if(req.cookies["Session-Token"] !== null) {
		db.del(req.cookies["Session-Token"]);
	}

	var token = uuid.v4();
	db.put(token, session, 1800000);
	res.cookie('Session-Token', token, { maxAge: 1800000, httpOnly: true });

	logger.log("refreshed session: " + token + ' for ' + session.username + ' ' + session.authenticated);
}

function getSessionToken(req) {
	return req.cookies["Session-Token"];
}

function getSession(token) {
	return db.get(token);
}

function getUsernameFromToken(req) {
	return db.get(req.cookies["Session-Token"]).username;
}

function getSessionFromRequest(req) {

  var session = { username: undefined, authenticated: false };

  if(req.cookies["Session-Token"] !== null) {
    if(db.get(req.cookies["Session-Token"]) !== null) {
      session = db.get(req.cookies["Session-Token"]);
    }
  }
	return session;
}


function getUserFromToken(req) {
	return database.getUser(db.get(req.cookies["Session-Token"]).username);
}







/**
*	https://localhost.ssl:3000/profileform
*/
app.get('/profileform', function(req, res) {
  getForm(req, res, 'Profile Form', profileform);
});

/**
*	https://localhost.ssl:3000/searchform
*/
app.get('/searchform', function(req, res) {
  getForm(req, res, 'Search Form', searchform);
});

/**
*	https://localhost.ssl:3000/registerform
*/
app.get('/registerform', function(req, res) {
  getForm(req, res, 'Register Form', registerform);
});

/**
*	https://localhost.ssl:3000/forgottenform
*/
app.get('/forgottenform', function(req, res) {
  getForm(req, res, 'Forgotten Form', forgottenform);
});

/**
*	https://localhost.ssl:3000/loginform
*/
app.get('/loginform', function(req, res) {
  getForm(req, res, 'Login Form', loginform);
});


function getForm(req, res, title, form) {

  logger.log('***** fetch form: ' + title);

  var session = getSessionFromRequest(req);
	refreshSession(session, req, res);
  headers.set(res);

  var response = head.get(title);
  response += getUserFragment(session, req, res);
  response += form.get();
  response += foot.get();

  res.send(response);
}

