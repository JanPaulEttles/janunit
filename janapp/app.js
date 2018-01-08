/*
npm install express
npm install body-parser
npm install cookie-parser
npm install node-uuid
*/

var express = require('express');
var bodyParser = require('body-parser')
var cookieParser = require('cookie-parser');
var uuid = require('node-uuid');

var https = require('https')
var fs = require('fs');

var logger = require('./logger');
var headers = require('./headers');

var head = require('./head');
var foot = require('./foot');

var forms = require('./forms');
var utils = require('./utils');

var sessiondatabase = require('./sessiondatabase');
var userdatabase = require('./userdatabase');
var notedatabase = require('./notedatabase');


var app = express();
app.set('port', 3000);
//app.use(express.static(__dirname + '/'));

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


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
  logger.info('server running on port ' + app.get('port'))
})



/**
* reset everything - todo
*	https://localhost.ssl:3000/nuke
*/
app.get('/nuke', function(req, res) {

  logger.info('***** get nuke BOOOOOOM!!!');

	sessiondatabase.clear();
  //userdatabase
  //notedatabase

  req.session = null;
	res.clearCookie('Session-Token', { path: '/' });

	res.redirect('https://localhost.ssl:3000/');
});

/**
*	https://localhost.ssl:3000/opensesame
*/
app.get('/opensesame', function(req, res) {
  logger.trace('***** get login');
		var data = '';
		var readStream = fs.createReadStream('allissues.txt', 'utf8');

		headers.set(res);
		res.setHeader('Content-Type', 'text/plain; charset=utf-8');
		readStream.on('data', function(chunk) {
		    data += chunk;
		}).on('end', function() {
	    	res.send(data);
		});
});

/**
*	https://localhost.ssl:3000/
*/
app.get('/', function(req, res) {

  logger.info('***** home page');

  var content = '<b>YAVA :: Yet Another Vulnerable App</b>';
  content += '<br><br>An application for collaboratiing on notes.';

  sendResponse(req, res, 'Home Page', content);
});


/**
*	https://localhost.ssl:3000/logout
*/
app.get('/logout', function(req, res) {
  logger.info('***** get logout');

	if(!isAuthenticated(req)) {
    logger.trace('logout: redirecting to homepage');
    res.redirect('https://localhost.ssl:3000/');
	}
  else {

    headers.set(res);

    var session = { username: getUsernameFromToken(req), authenticated: false	};
    refreshSession(session, req, res);

    var response = head.get('Log Out Reponse');
    response += getUserFragment(session, req, res);
    response += foot.get();

    res.send(response);
  }
});


/**
*	get request to view a user via admin interface
*	https://localhost:3000//admin/user/profile/view
*/
app.get('/admin/user/profile/view', function(req, res) {

  logger.info('***** get admin user profile');

  var user = userdatabase.getUser(req.query.username);

  var content = '';
  content += '<br>username : ' + user.username;
  content += '<br>password : ' + user.password; // + ' || <a href="/changepassword">change</a><br>';
  content += '<br>email : ' + user.email;
  content += '<br>firstname : ' + user.firstname;
  content += '<br>lastname : ' + user.lastname;

  sendResponse(req, res, 'Admin User Profile Reponse', content);
});


/**
*	get request to list all sessions
*	https://localhost:3000/admin/sessions
*/
app.get('/admin/sessions', function(req, res) {
  logger.info('***** get admin sessions');

  var keys = sessiondatabase.getSessionTokens();
  var content = '';
  for(var i = 0; i < keys.length; ++i) {
        content += '<br><a href="/admin/session/view?token=' + keys[i] + '">' + keys[i] + '</a>';
  }

  sendResponse(req, res, 'Admin Sessions Reponse', content);

});

/**
*	get request to list all users
*	https://localhost:3000/admin/users
*/
app.get('/admin/users', function(req, res) {
  logger.info('***** get admin users');

  var keys = userdatabase.getUsernames();
  var content = '';
  for(var i = 0; i < keys.length; ++i){
        content += '<br><a href="/admin/user/profile/view?username=' + userdatabase.getUser(keys[i]).username + '">' + userdatabase.getUser(keys[i]).username + '</a>';
  }

  sendResponse(req, res, 'Admin Users Reponse', content);
});





/*
* shared by both get and post login
*/
function processLogin(username, password, req, res) {

  var user = userdatabase.getUser(username);

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
*	https://localhost.ssl:3000/login?username=74n&password=password
*/
app.get('/login', function(req, res) {
  logger.trace('***** get login');
	processLogin(req.query.username, req.query.password, req, res);
});

/**
*	https://localhost:3000/login.html
*/
app.post('/login', function(req, res) {
  logger.trace('***** post login');
  if(utils.checkSQLi(req.body.username)) {
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
    //logger.trace('XXXXX' + req.body.username + 'XXXXX');
		processLogin(req.body.username, req.body.password, req, res);
	}
});



/**
*	get request to check if the user is authenticated
*	https://localhost:3000/authenticated
*/
app.get('/authenticated', function(req, res) {

  logger.info('***** get authenticated');

  var session = getSessionFromRequest(req);
  var content = '';
  if(session.authenticated) {
		content += 'You are authenticated';
	}
	else {
    content += 'You are NOT authenticated';
	}

  sendResponse(req, res, 'Authenticated Reponse', content);
});

/**
*
*	get request to show the user profile --associated with the session token-- from the query string
*	https://localhost:3000/profile
*
*/
app.get('/profile/view', function(req, res) {

  logger.info('***** get profile/view ' + !isAuthenticated(req));

	if(!isAuthenticated(req)) {
    logger.trace('profile/view: redirecting to homepage');
    res.redirect('https://localhost.ssl:3000/');
	}
  else {
    var user = userdatabase.getUser(req.query.username);

    var content = '';

    if(user !== null) {
      content += '<br>username : ' + user.username;

      content += '<br>password : ' + user.password;
      content += '<br><a href="/changepasswordform">change</a><br>';

      content += '<br>email : ' + user.email;
      content += '<br>firstname : ' + user.firstname;
      content += '<br>lastname : ' + user.lastname;
      content += '<br><a href="/updateprofileform?username=' + user.username + '">change</a><br>';
    }
    else {
      content += 'User not found';
    }

    sendResponse(req, res, 'View Profile Reponse', content);
  }
});


/**
*	get request to display admin stuff
*	https://localhost:3000/authenticated
*/
app.get('/admin', function(req, res) {

  logger.info('***** get admin');

  var content = '';
  content += '<a href="/admin/users">Users</a><br>';
  content += '<a href="/admin/sessions">Sessions</a><br>';

  sendResponse(req, res, 'Admin Reponse', content);
});


/**
*
*	get request to show the note
*	https://localhost:3000/profile
*
*/
app.get('/notes/view', function(req, res) {

  logger.info('***** get notes/view ' + !isAuthenticated(req));

	if(!isAuthenticated(req)) {
    logger.trace('notes/view: redirecting');
    res.redirect('https://localhost.ssl:3000/');
	}
  else {

    var content = '';

    var note = notedatabase.getNote(req.query.note);

    if(note !== null) {
      content += '<br>Title : ' + note.title;
      content += '<br>Note : ' + note.note;
      content += '<br><br><a href="/updatenoteform?note=' + note.id + '">Update</a>';
    }
    else {
      content += 'Note not found';
    }

    sendResponse(req, res, 'View Note Reponse', content);
  }
});


/**
*	get request to list all users
*	https://localhost:3000/notes/list
*/
app.get('/notes/list', function(req, res) {

  logger.trace('***** get notes/list ' + !isAuthenticated(req));

	if(!isAuthenticated(req)) {
    logger.info('notes/list: redirecting');
    res.redirect('https://localhost.ssl:3000/');
	}
  else {
    var keys = notedatabase.getNotes();
    logger.debug('#notes ' + keys.length);
    var content = '';
    for(var i = 0; i < keys.length; ++i){
      content += '<a href="/updatenoteform?note=' + notedatabase.getNote(keys[i]).id + '">Update</a>';
      content += ' || ';
      content += '<a href="/notes/view?note=' + notedatabase.getNote(keys[i]).id + '">' + notedatabase.getNote(keys[i]).title + '</a><br>';
    }
  }

  sendResponse(req, res, 'Notes List Reponse', content);
});

/**
*
*	parse note form
*	https://localhost:3000/notes/create
*
*/
app.post('/notes/create', function(req, res) {

  logger.trace('***** post note');

  if(!isAuthenticated(req)) {
    logger.info('notes/create: redirecting');
    res.redirect('https://localhost.ssl:3000/');
	}
  else {
    notedatabase.putNote({
            title: req.body.title || null,
            note: req.body.note || null
          });

    var content = '';
    content += '<br><br><div id="content">Title : ' + req.body.title;
    //content += '<br><br><div id="content">Title : ' + req.body.title.replace('>','&gt;').replace('<','&lt;').replace('\\','\\\\');
    content += '<br>Note : ' + req.body.note + '</div>';

    sendResponse(req, res, 'Create Note Reponse', content);
  }
});

/**
*	parse updatenote form
*	https://localhost:3000/updatenoteform
*/
app.post('/notes/update', function(req, res) {

  logger.info('***** post update note');

  var session = getSessionFromRequest(req);
	refreshSession(session, req, res);

  var note = notedatabase.getNote(req.body.id);
  note.title = req.body.title;
  note.note = req.body.note;
  notedatabase.updateNote(note);

  var content = '';
  content += 'The note has been updated.';

  sendResponse(req, res, 'Update Note Reponse', content);

});


/**
*	parse updateprofile form
*	https://localhost:3000/updateprofileform
*/
app.post('/profile/update', function(req, res) {

  logger.info('***** post update profile');

  var user = userdatabase.getUser(req.body.username);
  user.password = req.body.password;
  user.email = req.body.email;
  user.firstname = req.body.firstname;
  user.lastname = req.body.lastname;
  userdatabase.putUser(user);

  var content = '';
  content += 'Your profile has been updated.';
  sendResponse(req, res, 'Update Profile Reponse', content);
});


/**
*
*	get request to clear cache, session, cookies and redirect to index.html
*	https://localhost:3000/reset
*
*/
app.get('/reset', function(req, res) {

  logger.info('***** get reset');

	headers.set(res);

	sessiondatabase.clear();

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

  logger.info('***** post forgotten');

  var user = userdatabase.getUserByEmail(req.body.email);

  var content = '';
  if(user !== null) {
    content += 'Your password will be sent to: ' + req.body.email;
  }
  else {
    content += 'Email: ' + req.body.email + ' was not found in the database';
  }

  sendResponse(req, res, 'Forgotten Reponse', content);
});

/**
*	parse search form
*	https://localhost:3000/searchform
*/
app.post('/search', function(req, res) {
  logger.info('***** post search');

  var content = 'You searched for: ' + req.body.search;

  sendResponse(req, res, 'Search Reponse', content);
});

/**
*	parse changepassword form
*	https://localhost:3000/changepasswordform
*/
app.post('/changepassword', function(req, res) {

  logger.info('***** post changepassword');

var session = getSessionFromRequest(req);
  var user = userdatabase.getUser(session.username);
  user.password = req.body.password;
  userdatabase.putUser(user);

  var content = 'Your password has been changed.';

  sendResponse(req, res, 'Change Password Reponse', content);
});



app.post('/register', function(req, res) {

  logger.info('***** post register');

  var user = {
        	username  : '',
        	password  : '',
        	email     : '',
        	firstname : '',
        	lastname  : ''
  };


  //user.username = req.body.username.replace('>','&gt;').replace('<','&lt;').replace('\\','\\\\');
  user.username = req.body.username;
  user.password = req.body.password;
  user.email = req.body.email;
  user.firstname = req.body.firstname;
  user.lastname = req.body.lastname;

  //var dummyuser = utils.filterXSS(user);


	userdatabase.putUser(user);

  var content = 'User: ' + user.username + ' has been registered.<br>An email has been sent to: ' + user.email + '<br>Please login to continue.';

  sendResponse(req, res, 'Register Resonse', content);
});


/*
* Session Management
*/
function isAuthenticated(req) {
	var token = req.cookies["Session-Token"];
	if(token !== null) {
		var session = sessiondatabase.getSession(token);
		if(session !== null) {
			logger.info('user ' + session.username + ' has a session: ' + session.authenticated);
			return session.authenticated;
		}
	}
	return false;
}





function getUserFragment(session, req, res) {

  var header = '<div>';

  if(session.authenticated) {
    header += '<span id="loggedinstate">Logged In As: ' + session.username + '</span> || ';
    header += '<span><a href="/profile/view?username=' + session.username + '">Profile</a></span> || ';
    header += '<span><a href="/notes/list">Notes</a></span> || ';
    header += '<span><a href="/logout">Logout</a></span>';
  }
  else {
    header += '<span id="loggedinstate">Logged In As: Not Logged In</span> || ';
    header += '<span><a href="/loginform">Login</a></span> || ';
    header += '<span><a href="/registerform">Register</a></span> || ';
    header += '<span><a href="/forgottenform">Forgotten</a></span>';
  }
  header += '</div>';
	logger.info("adding user fragment: " + session.username);

  return header;
}



function refreshSession(session, req, res) {

  var token = req.cookies["Session-Token"];

	if(req.cookies["Session-Token"] === undefined) {
    token = sessiondatabase.createToken();
    logger.trace("CREATING token: " + token);
  }

  sessiondatabase.putSession(token, session, 1800000);
  //res.cookie('Session-Token', token, { maxAge: 1800000, httpOnly: true, secure: true });
  res.cookie('Session-Token', token, { maxAge: 1800000 });
  logger.trace("refreshed session: " + token + ' for ' + session.username + ' : isAuthenticated: ' + session.authenticated);
}

function getUsernameFromToken(req) {
	return sessiondatabase.getSession(req.cookies["Session-Token"]).username;
}

function getSessionFromRequest(req) {

  var session = { username: undefined, authenticated: false };

  if(req.cookies["Session-Token"] !== null) {
    if(sessiondatabase.getSession(req.cookies["Session-Token"]) !== null) {
      session = sessiondatabase.getSession(req.cookies["Session-Token"]);
    }
  }
	return session;
}


/**
*	https://localhost.ssl:3000/loginform
*/
app.get('/loginform', function(req, res) {
  getForm(req, res, 'Login Form', forms.login);
});


/**
*	https://localhost.ssl:3000/changepasswordform
*/
app.get('/changepasswordform', function(req, res) {
  getForm(req, res, 'Change Password Form', forms.changepassword);
});

/**
*	https://localhost.ssl:3000/profileform
*/
app.get('/profileform', function(req, res) {
  getForm(req, res, 'Profile Form', forms.profile);
});

/**
*	https://localhost.ssl:3000/searchform
*/
app.get('/searchform', function(req, res) {
  getForm(req, res, 'Search Form', forms.search);
});

/**
*	https://localhost.ssl:3000/registerform
*/
app.get('/registerform', function(req, res) {
  getForm(req, res, 'Register Form', forms.register);
});

/**
*	https://localhost.ssl:3000/forgottenform
*/
app.get('/forgottenform', function(req, res) {
  getForm(req, res, 'Forgotten Form', forms.forgotten);
});

/**
*	https://localhost.ssl:3000/noteform
*/
app.get('/noteform', function(req, res) {
  getForm(req, res, 'Note Form', forms.note);
});

/**
*	https://localhost.ssl:3000/updatenoteform
*/
app.get('/updatenoteform', function(req, res) {
  updateForm(req, res, 'Update Note Form', forms.updatenote, notedatabase.getNote(req.query.note));
});

/**
*	https://localhost.ssl:3000/updateprofileform
*/
app.get('/updateprofileform', function(req, res) {
  updateForm(req, res, 'Update Profile Form', forms.updateprofile, userdatabase.getUser(req.query.username));
});

function updateForm(req, res, title, form, object) {

  logger.trace('***** fetch form: ' + title);

  headers.set(res);

  var session = getSessionFromRequest(req);
	refreshSession(session, req, res);

  var response = head.get(title);
  response += getUserFragment(session, req, res);
  response += form.get(object);
  response += foot.get();

  res.send(response);
}


function getForm(req, res, title, form) {

  logger.trace('***** fetch form: ' + title);

  headers.set(res);

  var session = getSessionFromRequest(req);
	refreshSession(session, req, res);

  var response = head.get(title);
  response += getUserFragment(session, req, res);
  response += form.get();
  response += foot.get();

  res.send(response);
}

function sendResponse(req, res, title, content) {

  logger.info('***** sendResponse');

  headers.set(res);

  var session = getSessionFromRequest(req);
  refreshSession(session, req, res);

  var response = head.get(title);
  response += getUserFragment(session, req, res);
  response += '<br><br><div id="content">';
  response += content;
  response += '<div>';
  response += foot.get();

  res.send(response);
}

